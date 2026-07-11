// Local, dependency-free natural-language helpers for the mini AI. Every
// function here is a pure parser/detector — no network calls, no external
// model. Kept separate from miniAiAgent.js so the parsing logic can be
// tested and reasoned about on its own.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

export function normalize(text) {
  return String(text || '').toLowerCase().trim();
}

export function containsWord(text, word) {
  return new RegExp(`\\b${word}\\b`, 'i').test(text);
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function smartTitleCase(str) {
  return str
    .split(/\s+/)
    .map((word) => (/[A-Z]/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

// ---------- Service ----------

export function extractService(text) {
  const t = normalize(text);

  if (containsWord(t, 'both') || (/hair/.test(t) && /beard/.test(t))) return 'Both';
  if (/beard|shave|mustache|moustache/.test(t)) return 'Beard Trim';
  if (/hair ?cut|cut my hair|trim my hair|\bhair\b/.test(t)) return 'Haircut';

  // Typo tolerance for common misspellings (e.g. "haircutt", "berad").
  const tokens = t.split(/\s+/);
  for (const tok of tokens) {
    if (tok.length < 4) continue;
    if (levenshtein(tok, 'haircut') <= 2) return 'Haircut';
    if (levenshtein(tok, 'beard') <= 2) return 'Beard Trim';
    if (levenshtein(tok, 'both') <= 1) return 'Both';
  }
  return null;
}

// ---------- Date ----------

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

export function extractDate(text) {
  const t = normalize(text);
  const today = startOfToday();

  if (/\bday after tomorrow\b/.test(t)) return isoDate(addDays(today, 2));
  if (containsWord(t, 'today') || containsWord(t, 'tonight')) return isoDate(today);
  if (containsWord(t, 'tomorrow')) return isoDate(addDays(today, 1));

  const inDaysMatch = t.match(/\bin (\d+) days?\b/);
  if (inDaysMatch) return isoDate(addDays(today, Number(inDaysMatch[1])));

  if (/\bthis weekend\b/.test(t)) {
    const dow = today.getDay();
    if (dow === 6 || dow === 0) return isoDate(today);
    return isoDate(addDays(today, (6 - dow + 7) % 7));
  }

  for (let i = 0; i < WEEKDAYS.length; i += 1) {
    const day = WEEKDAYS[i];
    if (containsWord(t, day)) {
      const todayIdx = today.getDay();
      let diff = (i - todayIdx + 7) % 7;
      if (diff === 0) diff = /next/.test(t) ? 7 : 0;
      else if (/next/.test(t)) diff += 7;
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

  const ordinalCleaned = t.replace(/(\d{1,2})(st|nd|rd|th)\b/g, '$1');
  for (let i = 0; i < MONTHS.length; i += 1) {
    const month = MONTHS[i];
    if (!ordinalCleaned.includes(month.slice(0, 3))) continue;
    const monthFirst = ordinalCleaned.match(new RegExp(`${month}[a-z]*\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?`));
    const dayFirst = ordinalCleaned.match(new RegExp(`(\\d{1,2})\\w*\\s+${month}(?:,?\\s+(\\d{4}))?`));
    const dayNum = monthFirst ? Number(monthFirst[1]) : dayFirst ? Number(dayFirst[1]) : null;
    const explicitYear = (monthFirst && monthFirst[2]) || (dayFirst && dayFirst[2]);
    if (dayNum && dayNum >= 1 && dayNum <= 31) {
      if (explicitYear) {
        return isoDate(new Date(Number(explicitYear), i, dayNum));
      }
      const year = today.getFullYear();
      let candidate = new Date(year, i, dayNum);
      if (candidate < today) candidate = new Date(year + 1, i, dayNum);
      return isoDate(candidate);
    }
  }

  return null;
}

// ---------- Time ----------

export function extractTime(text) {
  const t = normalize(text);
  if (containsWord(t, 'noon')) return '12:00';
  if (containsWord(t, 'midnight')) return '00:00';

  const quarterTo = t.match(/quarter to (\d{1,2})/);
  if (quarterTo) {
    let h = Number(quarterTo[1]) - 1;
    if (h < 0) h = 23;
    return `${String(h).padStart(2, '0')}:45`;
  }
  const quarterPast = t.match(/quarter (?:past|after) (\d{1,2})/);
  if (quarterPast) return `${String(Number(quarterPast[1])).padStart(2, '0')}:15`;
  const halfPast = t.match(/half (?:past|after) (\d{1,2})/);
  if (halfPast) return `${String(Number(halfPast[1])).padStart(2, '0')}:30`;

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

export function detectVagueTimePeriod(text) {
  const t = normalize(text);
  if (containsWord(t, 'morning')) return 'morning';
  if (containsWord(t, 'afternoon')) return 'afternoon';
  if (containsWord(t, 'evening')) return 'evening';
  return null;
}

// ---------- Phone ----------

export function extractPhone(text) {
  const match = text.match(/(\+?\d[\d .\-()]{5,}\d)/);
  if (!match) return null;
  const digitsOnly = match[1].replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) return null;
  return match[1].trim();
}

// ---------- Name ----------

const NAME_PATTERNS = [
  /\bmy name is ([a-z][a-z' -]{1,40})/i,
  /\bthis is ([a-z][a-z' -]{1,40})/i,
  /\bi'?m ([a-z][a-z' -]{1,40})/i,
  /\bcall me ([a-z][a-z' -]{1,40})/i,
  /\bname'?s ([a-z][a-z' -]{1,40})/i,
];

export function extractNameExplicit(text) {
  for (const re of NAME_PATTERNS) {
    const m = text.match(re);
    if (m) {
      const candidate = m[1].trim().split(/[.,!?;]/)[0].trim();
      if (candidate) return smartTitleCase(candidate);
    }
  }
  return null;
}

export function extractNameFallback(text) {
  let cleaned = String(text || '').trim();
  cleaned = cleaned.replace(/^(it'?s|i'?m|my name is|this is|i am|call me)\s+/i, '').trim();
  if (!cleaned || cleaned.length > 60) return null;
  if (/^[\d\s\-().+]+$/.test(cleaned)) return null;
  return smartTitleCase(cleaned);
}

// ---------- Yes / no / cancel / correction ----------

const AFFIRMATIVE_WORDS = ['yes', 'yeah', 'yep', 'yup', 'correct', 'confirm', 'confirmed', 'sure', 'ok', 'okay', 'perfect', 'great', 'yea', 'alright'];
const AFFIRMATIVE_PHRASES = ['sounds good', 'that works', 'looks good', 'all good', 'go ahead'];
const NEGATIVE_WORDS = ['no', 'nope', 'wrong', 'incorrect'];
const NEGATIVE_PHRASES = ['not quite', "that's wrong", 'not right'];

export function detectAffirmative(text) {
  const t = normalize(text);
  return AFFIRMATIVE_WORDS.some((w) => containsWord(t, w)) || AFFIRMATIVE_PHRASES.some((p) => t.includes(p));
}

export function detectNegative(text) {
  const t = normalize(text);
  return NEGATIVE_WORDS.some((w) => containsWord(t, w)) || NEGATIVE_PHRASES.some((p) => t.includes(p));
}

export function detectCancel(text) {
  return /\b(cancel|start over|restart|never ?mind)\b/i.test(text);
}

export function detectCorrectionIntent(text) {
  return /\b(actually|wait|no i meant|change (it|that)|instead|make it|i meant)\b/i.test(text);
}

// ---------- Small talk / FAQ ----------

export function detectIntent(text) {
  const t = normalize(text);
  if (/^(hi|hello|hey|yo|good morning|good afternoon|good evening)\b/.test(t)) return 'greeting';
  if (/\b(thanks|thank you|appreciate it|thx)\b/.test(t)) return 'thanks';
  if (/\b(what.*(services|offer)|services.*offer|what.*do you (do|have))\b/.test(t)) return 'services';
  if (/\b(hours|open|close|closing|opening)\b/.test(t)) return 'hours';
  if (/\b(price|cost|how much|pricing)\b/.test(t)) return 'price';
  if (/\b(where|address|located|location)\b/.test(t)) return 'location';
  if (/^\s*help\s*$/.test(t)) return 'help';
  return null;
}
