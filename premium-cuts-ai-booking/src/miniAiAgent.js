import { createSquareBooking } from './squareClient.js';

// A fully local, rule-based "mini AI" receptionist — no external LLM, no
// API key, no quota, no billing. It fills five slots (service, date, time,
// name, phone) via simple text parsing, one at a time, then confirms and
// books through the same createSquareBooking used everywhere else.

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

const AFFIRMATIVE = ['yes', 'yeah', 'yep', 'yup', 'correct', 'confirm', 'confirmed', 'sure', 'ok', 'okay', 'perfect', 'great', 'sounds good', 'that works', 'looks good'];
const NEGATIVE = ['no', 'nope', 'cancel', 'start over', 'restart', "that's wrong", 'wrong'];

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

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

function normalize(text) {
  return String(text || '').toLowerCase().trim();
}

function containsWord(text, word) {
  return new RegExp(`\\b${word}\\b`, 'i').test(text);
}

function detectAffirmative(text) {
  const t = normalize(text);
  return AFFIRMATIVE.some((w) => t === w || t.includes(w));
}

function detectNegative(text) {
  const t = normalize(text);
  return NEGATIVE.some((w) => t === w || t.includes(w));
}

function extractService(text) {
  const t = normalize(text);
  if (containsWord(t, 'both') || (/hair/.test(t) && /beard/.test(t))) return 'Both';
  if (/beard|shave|mustache|moustache/.test(t)) return 'Beard Trim';
  if (/hair ?cut|cut my hair|trim my hair|\bhair\b/.test(t)) return 'Haircut';
  return null;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

function extractDate(text) {
  const t = normalize(text);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (containsWord(t, 'today')) return isoDate(today);
  if (containsWord(t, 'tomorrow')) return isoDate(addDays(today, 1));

  for (let i = 0; i < WEEKDAYS.length; i += 1) {
    const day = WEEKDAYS[i];
    if (containsWord(t, day)) {
      const todayIdx = today.getDay();
      let diff = (i - todayIdx + 7) % 7;
      if (diff === 0) {
        diff = /next/.test(t) ? 7 : 0;
      } else if (/next/.test(t)) {
        diff += 7;
      }
      return isoDate(addDays(today, diff));
    }
  }

  const isoMatch = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return isoDate(new Date(Number(y), Number(m) - 1, Number(d)));
  }

  const slashMatch = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slashMatch) {
    const [, mm, dd, yy] = slashMatch;
    const year = yy ? (yy.length === 2 ? 2000 + Number(yy) : Number(yy)) : today.getFullYear();
    return isoDate(new Date(year, Number(mm) - 1, Number(dd)));
  }

  for (let i = 0; i < MONTHS.length; i += 1) {
    const month = MONTHS[i];
    if (!t.includes(month.slice(0, 3))) continue;
    const monthPattern = new RegExp(`${month}[a-z]*\\s+(\\d{1,2})`);
    const dayFirstPattern = new RegExp(`(\\d{1,2})\\w*\\s+${month}`);
    const m1 = t.match(monthPattern);
    const m2 = t.match(dayFirstPattern);
    const dayNum = m1 ? Number(m1[1]) : m2 ? Number(m2[1]) : null;
    if (dayNum && dayNum >= 1 && dayNum <= 31) {
      const year = today.getFullYear();
      let candidate = new Date(year, i, dayNum);
      if (candidate < today) candidate = new Date(year + 1, i, dayNum);
      return isoDate(candidate);
    }
  }

  return null;
}

function extractTime(text) {
  const t = normalize(text);
  if (containsWord(t, 'noon')) return '12:00';
  if (containsWord(t, 'midnight')) return '00:00';

  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) || t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!m) return null;

  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const ampm = m[3];

  if (hour > 23 || minute > 59) return null;
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function extractPhone(text) {
  const match = text.match(/(\+?\d[\d .\-()]{5,}\d)/);
  if (!match) return null;
  const digitsOnly = match[1].replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) return null;
  return match[1].trim();
}

function extractName(text) {
  let cleaned = String(text || '').trim();
  cleaned = cleaned.replace(/^(it'?s|i'?m|my name is|this is|i am)\s+/i, '').trim();
  if (!cleaned || cleaned.length > 60) return null;
  if (/^[\d\s\-().+]+$/.test(cleaned)) return null;
  return cleaned;
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

function tryApplyCorrection(state, text) {
  const svc = extractService(text);
  const date = extractDate(text);
  const time = extractTime(text);
  let applied = false;

  if (svc && svc !== state.slots.service) {
    state.slots.service = svc;
    applied = true;
  }
  if (date && date !== state.slots.date) {
    state.slots.date = date;
    applied = true;
  }
  if (time && time !== state.slots.time) {
    state.slots.time = time;
    applied = true;
  }

  return applied;
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

    if (/cancel|start over|restart/i.test(text)) {
      const fresh = { ...freshState(), lastAsked: 'service' };
      return {
        reply: "No problem, let's start fresh. What would you like done — a Haircut, Beard Trim, or Both?",
        history: fresh,
      };
    }

    if (!state.slots.service) {
      const svc = extractService(text);
      if (svc) state.slots.service = svc;
    }

    if (state.lastAsked === 'confirm') {
      if (detectAffirmative(text)) {
        const result = await createSquareBooking(state.slots);
        if (result.success) {
          const reply = `You're all set, ${firstName(state.slots.name)}! ${state.slots.service} on ${formatDateForReply(state.slots.date)} at ${formatTimeForReply(state.slots.time)}. See you then!`;
          return { reply, history: freshState() };
        }
        state.lastAsked = 'time';
        state.slots.time = null;
        return { reply: `${result.error} What time would you like instead?`, history: state };
      }

      if (detectNegative(text)) {
        const fresh = { ...freshState(), lastAsked: 'service' };
        return { reply: "No problem — let's start over. What would you like done?", history: fresh };
      }

      if (tryApplyCorrection(state, text)) {
        return { reply: `${buildSummary(state.slots)}\n\nDoes that look right?`, history: state };
      }

      return { reply: 'Sorry, just to confirm — should I go ahead and book that? (yes/no)', history: state };
    }

    if (state.lastAsked === 'date' && !state.slots.date) {
      const d = extractDate(text);
      if (d) {
        state.slots.date = d;
        const tm = extractTime(text);
        if (tm) state.slots.time = tm;
      }
    } else if (state.lastAsked === 'time' && !state.slots.time) {
      const tm = extractTime(text);
      if (tm) state.slots.time = tm;
    } else if (state.lastAsked === 'phone' && !state.slots.phone) {
      const p = extractPhone(text);
      if (p) state.slots.phone = p;
    } else if (state.lastAsked === 'name' && !state.slots.name) {
      const n = extractName(text);
      if (n) state.slots.name = n;
    }

    const missing = SLOT_ORDER.find((slot) => !state.slots[slot]);

    if (!missing) {
      state.lastAsked = 'confirm';
      return { reply: `${buildSummary(state.slots)}\n\nDoes that look right?`, history: state };
    }

    const failedToExtract = state.lastAsked === missing && state.turnCount > 1;
    state.lastAsked = missing;
    const prompt = failedToExtract ? CLARIFY_PROMPTS[missing] : pick(SLOT_PROMPTS[missing], state.turnCount);

    return { reply: prompt, history: state };
  }

  return { handleMessage };
}
