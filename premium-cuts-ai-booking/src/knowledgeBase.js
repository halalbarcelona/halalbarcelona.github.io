import { SHOP_INFO, formatServicesList } from './shopInfo.js';

// A single, data-driven Q&A system for everything the assistant can talk
// about outside the booking flow itself — shop logistics (hours, prices,
// policies) plus genuine grooming knowledge (haircut frequency, beard
// care, face-shape tips). Entries are checked in order; the first
// matching pattern wins, so more specific patterns are listed before
// broader ones. Still 100% local — no external lookups.

const ENTRIES = [
  // --- Small talk ---
  {
    id: 'greeting',
    pattern: /^(hi|hello|hey|yo|good morning|good afternoon|good evening)\b/,
    answer: () => `Hey there! Welcome to ${SHOP_INFO.name}.`,
  },
  {
    id: 'howareyou',
    pattern: /\bhow('s| is| are) (it going|you doing|you)\b/,
    answer: () => "Doing great, thanks for asking! Ready to get you booked in whenever you are.",
  },
  {
    id: 'thanks',
    pattern: /\b(thanks|thank you|appreciate it|thx)\b/,
    answer: () => "You're welcome!",
  },
  {
    id: 'compliment',
    pattern: /\b(you'?re|you are) (awesome|great|the best|amazing)\b|\bgood (bot|job)\b/,
    answer: () => "That's kind of you to say! Let's get your visit sorted.",
  },
  {
    id: 'joke',
    pattern: /\btell me a joke\b|\bjoke\b.*(please|barber)?/,
    answer: () =>
      "Why did the barber win the race? He knew a shortcut! ...okay, back to business — what can I get you booked in for?",
  },

  // --- Shop logistics FAQs ---
  {
    id: 'firstvisit',
    pattern: /\bfirst (time|visit)\b/,
    answer: () => "First time? Welcome! Just arrive a couple of minutes early and we'll take care of the rest.",
  },
  {
    id: 'kids',
    pattern: /\b(kid|child|children)s?\b.*\b(cut|haircut|hair)\b|\bkids? cut\b/,
    answer: () =>
      "Yes, we cut kids' hair too — just mention their age when booking so we can plan enough time.",
  },
  {
    id: 'cancellation',
    pattern: /\b(cancel|reschedul)/,
    answer: () => SHOP_INFO.cancellationPolicy,
  },
  {
    id: 'walkins',
    pattern: /\b(walk.?ins?|walk in|need an appointment|without (an )?appointment)\b/,
    answer: () => SHOP_INFO.walkInsPolicy,
  },
  {
    id: 'payment',
    pattern: /\b(pay|payment|cash|credit card|contactless)\b|\bdo you (take|accept) cards?\b/,
    answer: () => 'We accept cash and all major cards, including contactless.',
  },
  {
    id: 'parking',
    pattern: /\bparking\b/,
    answer: () => "There's street parking nearby, and a public car park a short walk from the shop.",
  },
  {
    id: 'phone_contact',
    pattern: /\b(phone number|call you|your number|contact number)\b/,
    answer: () => `You can reach us at ${SHOP_INFO.phone}.`,
  },
  {
    id: 'products',
    pattern: /\b(what products|which products|what brand)\b/,
    answer: () => 'We use professional-grade grooming products for every cut and trim.',
  },
  {
    id: 'services',
    pattern: /\b(what.*(services|offer)|services.*offer|what.*do you (do|have))\b/,
    answer: () => `We offer: ${formatServicesList()}.`,
  },
  {
    id: 'hours',
    pattern: /\b(hours|open|close|closing|opening)\b/,
    answer: () => `We're open ${SHOP_INFO.hoursText}.`,
  },
  {
    id: 'price',
    pattern: /\b(prices?|costs?|how much|pricing)\b/,
    answer: () => `Here's our pricing: ${formatServicesList()}.`,
  },
  {
    id: 'location',
    pattern: /\b(where|address|located|location)\b/,
    answer: () => `We're located at ${SHOP_INFO.address}.`,
  },

  // --- General grooming knowledge (real advice, not business-specific) ---
  {
    id: 'haircut_frequency',
    pattern: /how often.*(haircut|cut my hair|get (a )?(hair)?cut)/,
    answer: () =>
      'Most people do well with a trim every 3–6 weeks — shorter fades and tight styles hold their shape best around every 3 weeks, while longer styles can often stretch to 6–8.',
  },
  {
    id: 'beard_care',
    pattern: /\b(maintain|care for|take care of)\b.*\bbeard\b|\bbeard\b.*\b(maintain|care)\b/,
    answer: () =>
      'Regular trims every 2–4 weeks keep a beard looking sharp, along with daily brushing and a beard oil or balm to keep it soft and healthy.',
  },
  {
    id: 'face_shape',
    pattern: /\b(round|square|oval|long) face\b.*(haircut|style|suit)|(haircut|style).*\b(round|square|oval|long) face\b/,
    answer: () =>
      "It depends on the specific cut, but generally: rounder faces suit styles with more height on top, while angular faces can pull off shorter, textured cuts. Our barber can give you personalized advice in the chair.",
  },
  {
    id: 'hair_health',
    pattern: /\bhealthy hair\b|\bhair (falling out|loss)\b|\bdandruff\b/,
    answer: () =>
      "For healthier hair: wash a few times a week (not daily, which can dry it out), use a conditioner, and get regular trims to avoid split ends. For hair loss or dandruff concerns, it's worth chatting with a dermatologist too.",
  },
  {
    id: 'fade_types',
    pattern: /\b(low|mid|high) fade\b|\btypes? of fades?\b/,
    answer: () =>
      'The main fade heights are low (starts just above the ear, subtle), mid (starts around temple height, a good all-rounder), and high (starts higher up, more dramatic contrast). Tell your barber which look you\'re going for and they\'ll dial it in.',
  },

  {
    id: 'help',
    pattern: /^\s*help\s*$/,
    answer: () =>
      "I can help you book an appointment — just tell me what service you'd like, or ask about our hours, pricing, or location.",
  },
];

function normalize(text) {
  return String(text || '').toLowerCase().trim();
}

export function matchKnowledge(text) {
  const t = normalize(text);
  for (const entry of ENTRIES) {
    if (entry.pattern.test(t)) {
      return { id: entry.id, answer: entry.answer() };
    }
  }
  return null;
}
