import { createSquareBooking } from './squareClient.js';
import { SHOP_INFO, isClosedOn } from './shopInfo.js';
import { matchKnowledge } from './knowledgeBase.js';
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
    '¿Qué te gustaría hacerte: Corte de Pelo, Recorte de Barba o Ambos?',
    'Claro — ¿hoy Corte de Pelo, Recorte de Barba o Ambos?',
  ],
  date: [
    '¿Qué día te viene bien? (p. ej. "mañana", "viernes" o "10 de julio")',
    'Genial — ¿qué fecha te gustaría venir?',
  ],
  time: [
    '¿A qué hora te gustaría? (p. ej. "las 3 de la tarde" o "15:30")',
    '¿Y qué hora te viene mejor?',
  ],
  name: ['¿Me dices tu nombre para la reserva?', '¿A nombre de quién pongo la cita?'],
  phone: [
    'Por último, ¿cuál es el mejor teléfono para contactarte?',
    '¿Y un número de teléfono por si necesitamos contactarte?',
  ],
};

// Varias variantes por franja para que fallos repetidos no muestren
// siempre la misma frase — se ciclan mediante un contador de reintentos
// por bloqueo (ver nextRetryCount), no solo el contador global de turnos.
const CLARIFY_PROMPTS = {
  service: [
    'Perdona, no lo he pillado — ¿Corte de Pelo, Recorte de Barba o Ambos?',
    'Para aclararlo: ¿Corte de Pelo, Recorte de Barba o Ambos?',
    'Necesito uno de los tres — Corte de Pelo, Recorte de Barba o Ambos.',
  ],
  date: [
    'Perdona, no he entendido la fecha — prueba algo como "mañana", "viernes" o "10 de julio".',
    'Todavía necesito una fecha — algo como "el próximo martes" o "15 de julio" funciona.',
    'Probemos otra vez — un día como "sábado" o una fecha como "3 de agosto" funciona.',
  ],
  time: [
    'Perdona, no he entendido la hora — prueba algo como "las 3 de la tarde" o "15:30".',
    'Solo necesito una hora — prueba "las 2 y media" o "14:30".',
    'No he pillado la hora — algo como "las 10 de la mañana" funciona.',
  ],
  name: [
    '¿Me puedes repetir tu nombre?',
    'No lo he pillado bien — ¿cuál es tu nombre?',
  ],
  phone: [
    'Perdona, eso no parece un número de teléfono — ¿me lo envías de nuevo? p. ej. 612 345 678',
    'Necesito un número de teléfono válido — algo como 612 345 678.',
  ],
};

const VAGUE_TIME_PROMPTS = [
  (period) => `¡${capitalize(period)} genial! ¿Me puedes dar una hora concreta, como las 9 de la mañana o las 3:30 de la tarde?`,
  (period) => `Vale, ${period} entonces — ¿pero qué hora exacta? p. ej. las 10:30.`,
];

const PAST_DATE_MESSAGES = [
  'Esa fecha ya ha pasado — ¿me das una fecha próxima?',
  '¡Esa es del pasado! ¿Qué tal una fecha que esté por llegar?',
  'Parece que esa fecha ya quedó atrás — ¿puedes elegir una fecha futura?',
];

// Días de la semana en español: lunes/martes/miércoles/jueves/viernes ya
// son invariables en plural, pero sábado/domingo necesitan una "s".
function pluralizeDayName(dayName) {
  return dayName.endsWith('s') ? dayName : `${dayName}s`;
}

function closedDayMessages(dayName) {
  const plural = pluralizeDayName(dayName);
  return [
    `Los ${plural} cerramos — ¿puedes elegir otro día? Abrimos ${SHOP_INFO.hoursText}.`,
    `Ah, los ${plural} no abrimos. ¿Te viene bien otro día? Abrimos ${SHOP_INFO.hoursText}.`,
    `Los ${plural} no son posibles — ¿qué tal otro día? Abrimos ${SHOP_INFO.hoursText}.`,
  ];
}

function pick(list, seed) {
  return list[seed % list.length];
}

function freshState() {
  return {
    slots: { service: null, date: null, time: null, name: null, phone: null },
    lastAsked: null,
    turnCount: 0,
    blockKey: null,
    blockRetryCount: 0,
  };
}

// Registra cuántos turnos consecutivos han fallado en superar el mismo
// bloqueo (la misma franja fallando repetidamente al parsear, o el mismo
// tipo de rechazo de fecha repitiéndose) para que los mensajes repetidos
// puedan ciclar entre distintas frases en vez de mostrar siempre la misma.
function nextRetryCount(state, blockKey) {
  if (state.blockKey === blockKey) {
    state.blockRetryCount = (state.blockRetryCount || 0) + 1;
  } else {
    state.blockKey = blockKey;
    state.blockRetryCount = 0;
  }
  return state.blockRetryCount;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateForReply(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTimeForReply(time24) {
  if (!time24) return '—';
  const [h, m] = time24.split(':').map(Number);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function firstName(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || '';
}

function buildSummary(slots) {
  return (
    'Esto es lo que tengo:\n' +
    `• Servicio: ${slots.service}\n` +
    `• Fecha: ${formatDateForReply(slots.date)}\n` +
    `• Hora: ${formatTimeForReply(slots.time)}\n` +
    `• Nombre: ${slots.name}\n` +
    `• Teléfono: ${slots.phone}`
  );
}

function joinReply(interjection, mainReply) {
  return interjection ? `${interjection} ${mainReply}` : mainReply;
}

function describeCaptured(slotsList, slots) {
  const labels = {
    service: () => `servicio: ${slots.service}`,
    date: () => `fecha: ${formatDateForReply(slots.date)}`,
    time: () => `hora: ${formatTimeForReply(slots.time)}`,
    name: () => `nombre: ${slots.name}`,
    phone: () => `teléfono: ${slots.phone}`,
  };
  const parts = slotsList.filter((slot) => labels[slot]).map((slot) => labels[slot]());
  return parts.length > 0 ? `Anotado — ${parts.join(', ')}.` : '';
}

function describeCorrection(appliedSlots, slots) {
  if (appliedSlots.length === 0) return '';
  const labels = {
    service: () => `el servicio a ${slots.service}`,
    date: () => `la fecha al ${formatDateForReply(slots.date)}`,
    time: () => `la hora a las ${formatTimeForReply(slots.time)}`,
    name: () => `el nombre a ${slots.name}`,
    phone: () => `el teléfono a ${slots.phone}`,
  };
  const parts = appliedSlots.map((slot) => labels[slot]());
  return `Hecho, he actualizado ${parts.join(' y ')}.`;
}

function validateDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (d < today) {
    return { ok: false, kind: 'past' };
  }
  if (isClosedOn(d)) {
    return { ok: false, kind: 'closed', dayName: d.toLocaleDateString('es-ES', { weekday: 'long' }) };
  }
  return { ok: true };
}

function dateIssueMessage(validation, retryCount) {
  if (validation.kind === 'past') return pick(PAST_DATE_MESSAGES, retryCount);
  if (validation.kind === 'closed') return pick(closedDayMessages(validation.dayName), retryCount);
  return '';
}

// Extracción oportunista de varias franjas, ejecutada en cada mensaje sin
// importar qué se preguntó por última vez (servicio/fecha/hora/teléfono
// tienen poco riesgo de falso positivo; el nombre solo mediante un patrón
// explícito tipo "soy X" / "me llamo X" aquí — el fallback permisivo sobre
// texto en bruto vive en applyContextualFallback y solo se ejecuta cuando
// justo acabamos de pedir un nombre).
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
      dateIssue = validation;
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
        reply: 'Sin problema, empecemos de nuevo. ¿Qué te gustaría hacerte: Corte de Pelo, Recorte de Barba o Ambos?',
        history: fresh,
      };
    }

    const knowledgeMatch = matchKnowledge(text);
    const interjection = knowledgeMatch ? knowledgeMatch.answer : '';

    if (state.lastAsked === 'confirm') {
      if (detectAffirmative(text) && !detectNegative(text)) {
        const result = await createSquareBooking(state.slots);
        if (result.success) {
          const reply = joinReply(
            interjection,
            `¡Todo listo${firstName(state.slots.name) ? ', ' + firstName(state.slots.name) : ''}! ${state.slots.service} el ${formatDateForReply(state.slots.date)} a las ${formatTimeForReply(state.slots.time)}. ¡Nos vemos!`
          );
          return { reply, history: freshState() };
        }
        state.lastAsked = 'time';
        state.slots.time = null;
        return { reply: joinReply(interjection, `${result.error} ¿Qué hora prefieres en su lugar?`), history: state };
      }

      if (detectNegative(text) && !detectAffirmative(text)) {
        const fresh = { ...freshState(), lastAsked: 'service' };
        return { reply: joinReply(interjection, 'Sin problema — empecemos de nuevo. ¿Qué te gustaría hacerte?'), history: fresh };
      }

      const { appliedSlots, dateIssue } = processTurn(state, text, { allowCorrection: true });
      if (dateIssue) {
        const retry = nextRetryCount(state, `date:${dateIssue.kind}`);
        const capturedAck = describeCaptured(appliedSlots, state.slots);
        const message = dateIssueMessage(dateIssue, retry);
        return { reply: joinReply([interjection, capturedAck].filter(Boolean).join(' '), message), history: state };
      }
      if (appliedSlots.length > 0 || knowledgeMatch) {
        return { reply: joinReply(interjection, `${buildSummary(state.slots)}\n\n¿Está todo correcto?`), history: state };
      }

      return { reply: 'Perdona, solo para confirmar — ¿reservo la cita? (sí/no)', history: state };
    }

    const correctionIntent = detectCorrectionIntent(text);
    const previouslyFilled = new Set(SLOT_ORDER.filter((slot) => state.slots[slot]));
    const { appliedSlots, dateIssue } = processTurn(state, text, { allowCorrection: correctionIntent });
    const corrections = appliedSlots.filter((slot) => previouslyFilled.has(slot));

    // Solo recurrimos a "tratar el texto en bruto como lo que acabamos de
    // preguntar" cuando no se ha entendido nada más este turno — si no, una
    // corrección como "en realidad mejor el sábado" (que actualiza la
    // fecha) también se tragaría como el nombre/teléfono que preguntábamos
    // a continuación.
    if (state.lastAsked && !state.slots[state.lastAsked] && !dateIssue && appliedSlots.length === 0 && !knowledgeMatch) {
      applyContextualFallback(state, text);
    }

    const missing = SLOT_ORDER.find((slot) => !state.slots[slot]);

    if (!missing) {
      state.lastAsked = 'confirm';
      return { reply: joinReply(interjection, `${buildSummary(state.slots)}\n\n¿Está todo correcto?`), history: state };
    }

    if (dateIssue) {
      state.lastAsked = 'date';
      const retry = nextRetryCount(state, `date:${dateIssue.kind}`);
      const capturedAck = describeCaptured(appliedSlots, state.slots);
      const message = dateIssueMessage(dateIssue, retry);
      return { reply: joinReply([interjection, capturedAck].filter(Boolean).join(' '), message), history: state };
    }

    const correctionAck = corrections.length > 0 ? describeCorrection(corrections, state.slots) : '';
    // Franjas que se rellenaron este turno pero no son la que estamos a
    // punto de (re)preguntar — p. ej. el cliente da un teléfono mientras
    // seguimos atascados repreguntando por una fecha válida. Sin esto,
    // quedarían absorbidas en silencio y la misma pregunta se repetiría
    // sin señal de que se ha entendido algo.
    const askedSlot = state.lastAsked;
    const freshBonus = appliedSlots.filter((slot) => slot !== askedSlot && !corrections.includes(slot));
    const freshAck = freshBonus.length > 0 ? describeCaptured(freshBonus, state.slots) : '';
    // Un turno de puro FAQ/charla informal ("¿dónde estáis?") no debería
    // contar como un intento fallido de responder a la pregunta de la
    // franja — el cliente no intentaba responderla, así que repreguntamos
    // con normalidad en vez de con un tono de "no lo he entendido".
    const failedToExtract = askedSlot === missing && state.turnCount > 1 && appliedSlots.length === 0 && !knowledgeMatch;

    let prompt;
    if (failedToExtract) {
      const retry = nextRetryCount(state, `slot:${missing}`);
      if (missing === 'time') {
        const vague = detectVagueTimePeriod(text);
        prompt = vague ? pick(VAGUE_TIME_PROMPTS, retry)(vague) : pick(CLARIFY_PROMPTS.time, retry);
      } else {
        prompt = pick(CLARIFY_PROMPTS[missing], retry);
      }
    } else {
      state.blockKey = null;
      state.blockRetryCount = 0;
      prompt = pick(SLOT_PROMPTS[missing], state.turnCount);
    }

    state.lastAsked = missing;
    const fullInterjection = [interjection, correctionAck, freshAck].filter(Boolean).join(' ');
    return { reply: joinReply(fullInterjection, prompt), history: state };
  }

  return { handleMessage };
}
