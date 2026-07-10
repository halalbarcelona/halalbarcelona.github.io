import { createSquareBooking } from './squareClient.js';
import { SHOP_INFO, isClosedOn, formatServicesList } from './shopInfo.js';
import {
  extractService,
  extractDate,
  extractTime,
  detectVagueTimePeriod,
  extractPhone,
  extractNameExplicit,
  extractNameFallback,
  detectAffirmative,
  detectNegative,
  detectCancel,
  detectCorrectionIntent,
  detectIntent,
} from './nlu.js';

// A fully local, rule-based "mini AI" receptionist — no external LLM, no
// API key, no quota, no billing. It fills five slots (service, date, time,
// name, phone) via layered text parsing (opportunistic multi-slot
// extraction, then a contextual fallback for whatever was just asked),
// answers shop FAQs along the way, allows corrections at any point, and
// validates dates against the shop's real hours before booking through
// createSquareBooking — the same function the manual form uses.

const SLOT_ORDER = ['service', 'date', 'time', 'name', 'phone'];

const SLOT_PROMPTS = {
  service: [
    'What would you like done — a Haircut, Beard Trim, or Both?',
    'Sure thing — is it a Haircut, a Beard Trim, or Both today?',
  ],
  date: [
    'What day works for you? (e.g. "tomorrow", "Friday", or "July 10")',
    'Great — what date would you like to come in?',
  ],
  time: [
    'What time would you like? (e.g. "3pm" or "15:30")',
    'And what time works best for you?',
  ],
  name: ['Can I get your name for the booking?', 'What name should I put this under?'],
  phone: [
    "Lastly, what's the best phone number to reach you?",
    'And a phone number in case we need to reach you?',
  ],
};

const CLARIFY_PROMPTS = {
  service: "Sorry, I didn't catch that — is it a Haircut, Beard Trim, or Both?",
  date: 'Sorry, I didn\'t get a date from that — try something like "tomorrow", "Friday", or "July 10".',
  time: 'Sorry, I didn\'t get a time from that — try something like "3pm" or "15:30".',
  name: 'Sorry, could you tell me your name again?',
  phone: "Sorry, that didn't look like a phone number — could you send it again? e.g. 555-123-4567",
};

function pick(list, seed) {
  return list[seed % list.length];
}

function freshState() {
  return {
    slots: { service: null, date: null, time: null, name: null, phone: null },
    lastAsked: null,
    turnCount: 0,
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateForReply(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTimeForReply(time24) {
  if (!time24) return '—';
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function firstName(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || 'there';
}

function buildSummary(slots) {
  return (
    "Here's what I have:\n" +
    `• Service: ${slots.service}\n` +
    `• Date: ${formatDateForReply(slots.date)}\n` +
    `• Time: ${formatTimeForReply(slots.time)}\n` +
    `• Name: ${slots.name}\n` +
    `• Phone: ${slots.phone}`
  );
}

function joinReply(interjection, mainReply) {
  return interjection ? `${interjection} ${mainReply}` : mainReply;
}

function describeCorrection(appliedSlots, slots) {
  if (appliedSlots.length === 0) return '';
  const labels = {
    service: () => `service to ${slots.service}`,
    date: () => `date to ${formatDateForReply(slots.date)}`,
    time: () => `time to ${formatTimeForReply(slots.time)}`,
    name: () => `name to ${slots.name}`,
    phone: () => `phone to ${slots.phone}`,
  };
  const parts = appliedSlots.map((slot) => labels[slot]());
  return `Got it, updated the ${parts.join(' and ')}.`;
}

function answerIntent(intent) {
  switch (intent) {
    case 'greeting':
      return `Hey there! Welcome to ${SHOP_INFO.name}.`;
    case 'thanks':
      return "You're welcome!";
    case 'hours':
      return `We're open ${SHOP_INFO.hoursText}.`;
    case 'price':
      return `Here's our pricing: ${formatServicesList()}.`;
    case 'services':
      return `We offer: ${formatServicesList()}.`;
    case 'location':
      return `We're located at ${SHOP_INFO.address}.`;
    case 'help':
      return "I can help you book an appointment — just tell me what service you'd like, or ask about our hours, pricing, or location.";
    default:
      return '';
  }
}

function validateDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (d < today) {
    return { ok: false, message: "That date's already passed — could you give me an upcoming date?" };
  }
  if (isClosedOn(d)) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    return { ok: false, message: `We're closed on ${dayName}s — could you pick another day? We're open ${SHOP_INFO.hoursText}.` };
  }
  return { ok: true };
}

// Opportunistic multi-slot extraction, run on every message regardless of
// what was last asked (service/date/time/phone have low false-positive
// risk; name only via an explicit "I'm X" / "my name is X" style pattern
// here — the permissive raw-text fallback lives in applyContextualFallback
// and only runs when we specifically just asked for a name).
function processTurn(state, text, { allowCorrection }) {
  const appliedSlots = [];
  let dateIssue = null;

  const svc = extractService(text);
  if (svc && svc !== state.slots.service && (!state.slots.service || allowCorrection)) {
    state.slots.service = svc;
    appliedSlots.push('service');
  }

  const rawDate = extractDate(text);
  if (rawDate && rawDate !== state.slots.date && (!state.slots.date || allowCorrection)) {
    const validation = validateDate(rawDate);
    if (validation.ok) {
      state.slots.date = rawDate;
      appliedSlots.push('date');
      const tm = extractTime(text);
      if (tm && !state.slots.time) {
        state.slots.time = tm;
        appliedSlots.push('time');
      }
    } else {
      dateIssue = validation.message;
    }
  }

  const rawTime = extractTime(text);
  if (rawTime && rawTime !== state.slots.time && (!state.slots.time || allowCorrection)) {
    state.slots.time = rawTime;
    appliedSlots.push('time');
  }

  const phone = extractPhone(text);
  if (phone && phone !== state.slots.phone && (!state.slots.phone || allowCorrection)) {
    state.slots.phone = phone;
    appliedSlots.push('phone');
  }

  const nameExplicit = extractNameExplicit(text);
  if (nameExplicit && nameExplicit !== state.slots.name && (!state.slots.name || allowCorrection)) {
    state.slots.name = nameExplicit;
    appliedSlots.push('name');
  }

  return { appliedSlots, dateIssue };
}

function applyContextualFallback(state, text) {
  if (state.lastAsked === 'name' && !state.slots.name) {
    const n = extractNameFallback(text);
    if (n) state.slots.name = n;
  } else if (state.lastAsked === 'phone' && !state.slots.phone) {
    const p = extractPhone(text);
    if (p) state.slots.phone = p;
  }
}

export function createChatAgent() {
  async function handleMessage(message, historyIn) {
    const state =
      historyIn && historyIn.slots
        ? { ...historyIn, slots: { ...historyIn.slots } }
        : freshState();
    state.turnCount = (state.turnCount || 0) + 1;
    const text = String(message || '').trim();

    if (!text) {
      const prompt = state.lastAsked ? pick(SLOT_PROMPTS[state.lastAsked] || [''], state.turnCount) : pick(SLOT_PROMPTS.service, 0);
      return { reply: prompt, history: state };
    }

    if (detectCancel(text)) {
      const fresh = { ...freshState(), lastAsked: 'service' };
      return {
        reply: "No problem, let's start fresh. What would you like done — a Haircut, Beard Trim, or Both?",
        history: fresh,
      };
    }

    const intent = detectIntent(text);
    const interjection = intent ? answerIntent(intent) : '';

    if (state.lastAsked === 'confirm') {
      if (detectAffirmative(text) && !detectNegative(text)) {
        const result = await createSquareBooking(state.slots);
        if (result.success) {
          const reply = joinReply(
            interjection,
            `You're all set, ${firstName(state.slots.name)}! ${state.slots.service} on ${formatDateForReply(state.slots.date)} at ${formatTimeForReply(state.slots.time)}. See you then!`
          );
          return { reply, history: freshState() };
        }
        state.lastAsked = 'time';
        state.slots.time = null;
        return { reply: joinReply(interjection, `${result.error} What time would you like instead?`), history: state };
      }

      if (detectNegative(text) && !detectAffirmative(text)) {
        const fresh = { ...freshState(), lastAsked: 'service' };
        return { reply: joinReply(interjection, "No problem — let's start over. What would you like done?"), history: fresh };
      }

      const { appliedSlots, dateIssue } = processTurn(state, text, { allowCorrection: true });
      if (dateIssue) {
        return { reply: joinReply(interjection, dateIssue), history: state };
      }
      if (appliedSlots.length > 0 || intent) {
        return { reply: joinReply(interjection, `${buildSummary(state.slots)}\n\nDoes that look right?`), history: state };
      }

      return { reply: 'Sorry, just to confirm — should I go ahead and book that? (yes/no)', history: state };
    }

    const correctionIntent = detectCorrectionIntent(text);
    const previouslyFilled = new Set(SLOT_ORDER.filter((slot) => state.slots[slot]));
    const { appliedSlots, dateIssue } = processTurn(state, text, { allowCorrection: correctionIntent });
    const corrections = appliedSlots.filter((slot) => previouslyFilled.has(slot));

    // Only fall back to "treat the raw text as whatever we just asked for"
    // when nothing else was understood this turn — otherwise a correction
    // like "actually make it Saturday instead" (which updates the date)
    // would also get swallowed as the name/phone we happened to be asking
    // about next.
    if (state.lastAsked && !state.slots[state.lastAsked] && !dateIssue && appliedSlots.length === 0) {
      applyContextualFallback(state, text);
    }

    const missing = SLOT_ORDER.find((slot) => !state.slots[slot]);

    if (!missing) {
      state.lastAsked = 'confirm';
      return { reply: joinReply(interjection, `${buildSummary(state.slots)}\n\nDoes that look right?`), history: state };
    }

    if (dateIssue) {
      state.lastAsked = 'date';
      return { reply: joinReply(interjection, dateIssue), history: state };
    }

    const correctionAck = corrections.length > 0 ? describeCorrection(corrections, state.slots) : '';
    const failedToExtract = state.lastAsked === missing && state.turnCount > 1 && appliedSlots.length === 0;
    state.lastAsked = missing;

    let prompt;
    if (failedToExtract) {
      if (missing === 'time') {
        const vague = detectVagueTimePeriod(text);
        prompt = vague
          ? `${capitalize(vague)} works! Could you give me a specific time, like 9am or 3:30pm?`
          : CLARIFY_PROMPTS.time;
      } else {
        prompt = CLARIFY_PROMPTS[missing];
      }
    } else {
      prompt = pick(SLOT_PROMPTS[missing], state.turnCount);
    }

    const fullInterjection = [interjection, correctionAck].filter(Boolean).join(' ');
    return { reply: joinReply(fullInterjection, prompt), history: state };
  }

  return { handleMessage };
}
