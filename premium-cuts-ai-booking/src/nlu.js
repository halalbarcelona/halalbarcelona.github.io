// Local, dependency-free natural-language helpers for the mini AI — this
// is the Spanish-language version, tuned for how Barcelona-area customers
// actually type (accents often dropped, "mañana" doing double duty for
// "tomorrow" and "morning", DD/MM date order). Every function here is a
// pure parser/detector — no network calls, no external model.

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Lowercases and strips accents so "miércoles"/"miercoles" and
// "sábado"/"sabado" both match — very common for customers to drop
// accents when typing casually.
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
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

// ---------- Servicio ----------

// No intenta casar con un "pelo" suelto — es demasiado amplio y da falsos
// positivos en preguntas como "¿cortáis el pelo a niños?" (una pregunta,
// no una solicitud). Requiere una frase que realmente indique corte.
const HAIRCUT_PATTERN = /\bcorte\b( de pelo)?|\bcortar(me)? el pelo\b/;

export function extractService(text) {
  const t = normalize(text);

  if (containsWord(t, 'ambos') || containsWord(t, 'los dos') || (HAIRCUT_PATTERN.test(t) && /barba/.test(t))) {
    return 'Ambos';
  }
  if (/barba|afeitad|bigote/.test(t)) return 'Recorte de Barba';
  if (HAIRCUT_PATTERN.test(t)) return 'Corte de Pelo';

  // Tolerancia a errores tipográficos comunes.
  const tokens = t.split(/\s+/);
  for (const tok of tokens) {
    if (tok.length < 4) continue;
    if (levenshtein(tok, 'corte') <= 2) return 'Corte de Pelo';
    if (levenshtein(tok, 'barba') <= 2) return 'Recorte de Barba';
    if (levenshtein(tok, 'ambos') <= 1) return 'Ambos';
  }
  return null;
}

// ---------- Fecha ----------

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

  if (/\bpasado manana\b/.test(t)) return isoDate(addDays(today, 2));
  if (containsWord(t, 'hoy')) return isoDate(today);
  // "manana" a secas = "tomorrow". La lectura de "por la mañana" (periodo
  // del día) se maneja aparte en detectVagueTimePeriod / extractTime.
  if (containsWord(t, 'manana')) return isoDate(addDays(today, 1));

  const inDaysMatch = t.match(/\ben (\d+) dias?\b/);
  if (inDaysMatch) return isoDate(addDays(today, Number(inDaysMatch[1])));

  if (/\beste finde\b|\beste fin de semana\b/.test(t)) {
    const dow = today.getDay();
    if (dow === 6 || dow === 0) return isoDate(today);
    return isoDate(addDays(today, (6 - dow + 7) % 7));
  }

  for (let i = 0; i < WEEKDAYS.length; i += 1) {
    const day = WEEKDAYS[i];
    if (containsWord(t, day)) {
      const todayIdx = today.getDay();
      let diff = (i - todayIdx + 7) % 7;
      if (diff === 0) diff = /proxim/.test(t) ? 7 : 0;
      else if (/proxim/.test(t)) diff += 7;
      return isoDate(addDays(today, diff));
    }
  }

  const isoMatch = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return isoDate(new Date(Number(y), Number(m) - 1, Number(d)));
  }

  // Formato español: DD/MM(/AAAA), día antes que mes.
  const slashMatch = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slashMatch) {
    const [, dd, mm, yy] = slashMatch;
    const year = yy ? (yy.length === 2 ? 2000 + Number(yy) : Number(yy)) : today.getFullYear();
    return isoDate(new Date(year, Number(mm) - 1, Number(dd)));
  }

  const ordinalCleaned = t.replace(/(\d{1,2})(ro|do|to|er)\b/g, '$1');
  for (let i = 0; i < MONTHS.length; i += 1) {
    const month = MONTHS[i];
    if (!ordinalCleaned.includes(month.slice(0, 4))) continue;
    // "10 de julio" (día primero, forma más natural en español)
    const dayFirst = ordinalCleaned.match(new RegExp(`(\\d{1,2})\\s+de\\s+${month}(?:\\s+de\\s+(\\d{4}))?`));
    // "julio 10" (menos común, pero se admite)
    const monthFirst = ordinalCleaned.match(new RegExp(`${month}\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?`));
    const dayNum = dayFirst ? Number(dayFirst[1]) : monthFirst ? Number(monthFirst[1]) : null;
    const explicitYear = (dayFirst && dayFirst[2]) || (monthFirst && monthFirst[2]);
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

// ---------- Hora ----------

export function extractTime(text) {
  const t = normalize(text);
  if (containsWord(t, 'mediodia')) return '12:00';
  if (containsWord(t, 'medianoche')) return '00:00';

  const menosCuarto = t.match(/(\d{1,2})\s*menos cuarto/);
  if (menosCuarto) {
    let h = Number(menosCuarto[1]) - 1;
    if (h < 0) h = 23;
    return `${String(h).padStart(2, '0')}:45`;
  }
  const yCuarto = t.match(/(\d{1,2})\s*y cuarto/);
  if (yCuarto) return `${String(Number(yCuarto[1])).padStart(2, '0')}:15`;
  const yMedia = t.match(/(\d{1,2})\s*y media/);
  if (yMedia) return `${String(Number(yMedia[1])).padStart(2, '0')}:30`;

  // "3 de la tarde", "10 de la manana", "8 de la noche", con o sin minutos.
  const withPeriod = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(?:de la |por la )?(manana|tarde|noche)\b/);
  if (withPeriod) {
    let hour = Number(withPeriod[1]);
    const minute = withPeriod[2] ? Number(withPeriod[2]) : 0;
    const period = withPeriod[3];
    if (hour > 23 || minute > 59) return null;
    if ((period === 'tarde' || period === 'noche') && hour < 12) hour += 12;
    if (period === 'manana' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // Formato de 24 horas explícito, "15:30".
  const plain24 = t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (plain24) {
    const hour = Number(plain24[1]);
    const minute = Number(plain24[2]);
    if (hour > 23 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return null;
}

export function detectVagueTimePeriod(text) {
  const t = normalize(text);
  if (/\b(de la |por la |en la )?manana\b/.test(t) && !/\bpasado manana\b/.test(t)) {
    // Solo cuenta como "periodo vago" si viene acompañada de "de/por/en la"
    // — "mañana" a secas ya se interpretó como "tomorrow" en extractDate.
    if (/\b(de la|por la|en la) manana\b/.test(t)) return 'la mañana';
    return null;
  }
  if (/\b(de la|por la|en la) tarde\b/.test(t)) return 'la tarde';
  if (/\b(de la|por la|en la) noche\b/.test(t)) return 'la noche';
  return null;
}

// ---------- Teléfono ----------

export function extractPhone(text) {
  const match = text.match(/(\+?\d[\d .\-()]{5,}\d)/);
  if (!match) return null;
  const digitsOnly = match[1].replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) return null;
  return match[1].trim();
}

// ---------- Nombre ----------

const NAME_PATTERNS = [
  /\bme llamo ([a-zA-ZñÑáéíóúÁÉÍÓÚ][a-zA-ZñÑáéíóúÁÉÍÓÚ' -]{1,40})/i,
  /\bmi nombre es ([a-zA-ZñÑáéíóúÁÉÍÓÚ][a-zA-ZñÑáéíóúÁÉÍÓÚ' -]{1,40})/i,
  /\bsoy ([a-zA-ZñÑáéíóúÁÉÍÓÚ][a-zA-ZñÑáéíóúÁÉÍÓÚ' -]{1,40})/i,
  /\bllamame ([a-zA-ZñÑáéíóúÁÉÍÓÚ][a-zA-ZñÑáéíóúÁÉÍÓÚ' -]{1,40})/i,
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
  cleaned = cleaned.replace(/^(me llamo|mi nombre es|soy|llamame)\s+/i, '').trim();
  if (!cleaned || cleaned.length > 60) return null;
  if (/^[\d\s\-().+]+$/.test(cleaned)) return null;
  return smartTitleCase(cleaned);
}

// ---------- Sí / no / cancelar / corrección ----------

const AFFIRMATIVE_WORDS = ['si', 'vale', 'claro', 'correcto', 'confirmo', 'confirmado', 'perfecto', 'genial', 'exacto'];
const AFFIRMATIVE_PHRASES = ['esta bien', 'de acuerdo', 'suena bien', 'me parece bien'];
const NEGATIVE_WORDS = ['no', 'incorrecto', 'mal'];
const NEGATIVE_PHRASES = ['no es correcto', 'no esta bien', 'eso esta mal'];

export function detectAffirmative(text) {
  const t = normalize(text);
  return AFFIRMATIVE_WORDS.some((w) => containsWord(t, w)) || AFFIRMATIVE_PHRASES.some((p) => t.includes(p));
}

export function detectNegative(text) {
  const t = normalize(text);
  return NEGATIVE_WORDS.some((w) => containsWord(t, w)) || NEGATIVE_PHRASES.some((p) => t.includes(p));
}

export function detectCancel(text) {
  return /\b(cancelar|cancelalo|empezar de nuevo|reiniciar|olvidalo)\b/i.test(normalize(text));
}

export function detectCorrectionIntent(text) {
  return /\b(en realidad|espera|mejor que sea|cambia(lo)?|quise decir|mejor)\b/i.test(normalize(text));
}

// La detección de FAQ/small-talk vive en src/knowledgeBase.js
// (matchKnowledge), que también contiene el texto de cada respuesta.
