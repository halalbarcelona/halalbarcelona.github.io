import { SHOP_INFO, formatServicesList } from './shopInfo.js';

// A single, data-driven Q&A system for everything the assistant can talk
// about outside the booking flow itself — shop logistics (hours, prices,
// policies) plus genuine grooming knowledge (haircut frequency, beard
// care, face-shape tips). Entries are checked in order; the first
// matching pattern wins, so more specific patterns are listed before
// broader ones. Still 100% local — no external lookups.
//
// Patterns match against accent-stripped, lowercased text (see
// normalize() below) so "cuánto" and "cuanto" both work regardless of
// whether the customer typed accents.

const ENTRIES = [
  // --- Charla informal ---
  {
    id: 'greeting',
    pattern: /^(hola|buenas|buenos dias|buenas tardes|buenas noches|ey|hey)\b/,
    answer: () => `¡Hola! Bienvenido a ${SHOP_INFO.name}.`,
  },
  {
    id: 'howareyou',
    pattern: /\bcomo (estas|va|te va|andas)\b/,
    answer: () => '¡Muy bien, gracias por preguntar! Cuando quieras te ayudo a reservar tu cita.',
  },
  {
    id: 'thanks',
    pattern: /\b(gracias|te lo agradezco)\b/,
    answer: () => '¡De nada!',
  },
  {
    id: 'compliment',
    pattern: /\beres (genial|el mejor|increible)\b|\bbuen (bot|trabajo)\b/,
    answer: () => '¡Qué amable! Vamos a organizar tu visita.',
  },
  {
    id: 'joke',
    pattern: /\bcuentame un chiste\b|\bchiste\b.*(por favor|barbero)?/,
    answer: () =>
      '¿Por qué el barbero ganó la carrera? ¡Porque conocía un atajo (corte)! ...vale, volvamos a lo importante — ¿qué te reservo?',
  },

  // --- Preguntas frecuentes sobre la barbería ---
  {
    id: 'firstvisit',
    pattern: /\bprimera vez\b/,
    answer: () => '¿Primera vez? ¡Bienvenido! Llega un par de minutos antes y nosotros nos encargamos del resto.',
  },
  {
    id: 'kids',
    pattern: /\b(nino|ninos|nina|ninas|infantil)\b.*\b(corte|pelo)\b|\bcorte infantil\b/,
    answer: () =>
      'Sí, también cortamos el pelo a niños — solo menciona su edad al reservar para que podamos prever el tiempo necesario.',
  },
  {
    id: 'cancellation',
    pattern: /\b(cancelar|cancelacion|reprogramar|cambiar la cita)\b/,
    answer: () => SHOP_INFO.cancellationPolicy,
  },
  {
    id: 'walkins',
    pattern: /\b(sin cita|sin reserva|necesito cita previa|puedo ir sin reservar)\b/,
    answer: () => SHOP_INFO.walkInsPolicy,
  },
  {
    id: 'payment',
    pattern: /\b(pago|pagar|efectivo|tarjeta|contactless|sin contacto)\b|\bacept[a-z]* tarjetas?\b/,
    answer: () => 'Aceptamos efectivo y todas las tarjetas principales, incluido el pago sin contacto.',
  },
  {
    id: 'parking',
    pattern: /\bparking\b|\baparcamiento\b|\bdonde aparcar\b/,
    answer: () => 'Hay aparcamiento en la calle cerca de la barbería, y un parking público a poca distancia andando.',
  },
  {
    id: 'phone_contact',
    pattern: /\b(numero de telefono|llamaros|vuestro numero|numero de contacto)\b/,
    answer: () => `Puedes contactarnos en el ${SHOP_INFO.phone}.`,
  },
  {
    id: 'products',
    pattern: /\b(que productos|que marca|con que productos)\b/,
    answer: () => 'Usamos productos de peluquería profesionales en cada corte y recorte.',
  },
  {
    id: 'services',
    pattern: /\b(que servicios|servicios ofreceis|que haceis|que hac[eé]is)\b/,
    answer: () => `Ofrecemos: ${formatServicesList()}.`,
  },
  {
    id: 'hours',
    pattern: /\b(horario|horarios|abrir|abris|cerrar|cerrais|abierto|cerrado)\b/,
    answer: () => `Abrimos ${SHOP_INFO.hoursText}.`,
  },
  {
    id: 'price',
    pattern: /\b(precio|precios|cuesta|cuanto vale|tarifa|tarifas)\b/,
    answer: () => `Estos son nuestros precios: ${formatServicesList()}.`,
  },
  {
    id: 'location',
    pattern: /\b(donde estais|direccion|ubicacion|donde os encontramos|donde queda)\b/,
    answer: () => `Estamos en ${SHOP_INFO.address}.`,
  },

  // --- Conocimiento general de peluquería (consejos reales, no específicos del negocio) ---
  {
    id: 'haircut_frequency',
    pattern: /cada cuanto.*(corte|cortarme el pelo|cortar el pelo)/,
    answer: () =>
      'A la mayoría le va bien un corte cada 3-6 semanas — los fades y estilos muy cortos mantienen mejor su forma cada 3 semanas aproximadamente, mientras que los estilos más largos pueden aguantar 6-8 semanas.',
  },
  {
    id: 'beard_care',
    pattern: /\b(mantener|cuidar)\b.*\bbarba\b|\bbarba\b.*\b(mantener|cuidado)\b/,
    answer: () =>
      'Recortarla cada 2-4 semanas mantiene la barba con buen aspecto, junto con cepillado diario y un aceite o bálsamo de barba para mantenerla suave y sana.',
  },
  {
    id: 'face_shape',
    pattern: /\bcara (redonda|cuadrada|ovalada|alargada)\b.*(corte|estilo|queda)|(corte|estilo).*\bcara (redonda|cuadrada|ovalada|alargada)\b/,
    answer: () =>
      'Depende del corte concreto, pero en general: las caras más redondas favorecen estilos con más volumen arriba, mientras que las caras angulares lucen bien con cortes más cortos y con textura. Nuestro barbero te puede aconsejar en persona.',
  },
  {
    id: 'hair_health',
    pattern: /\bpelo sano\b|\bcaida del pelo\b|\bse me cae el pelo\b|\bcaspa\b/,
    answer: () =>
      'Para un pelo más sano: lávalo unas pocas veces por semana (no a diario, porque reseca), usa acondicionador y hazte cortes regulares para evitar puntas abiertas. Si te preocupa la caída del pelo o la caspa, también merece la pena consultar a un dermatólogo.',
  },
  {
    id: 'fade_types',
    pattern: /\bfade (bajo|medio|alto)\b|\btipos? de fade\b/,
    answer: () =>
      'Las alturas de fade principales son bajo (empieza justo encima de la oreja, sutil), medio (empieza a la altura de la sien, un buen equilibrio) y alto (empieza más arriba, con más contraste). Dile a tu barbero qué estilo buscas y lo ajustará.',
  },

  {
    id: 'help',
    pattern: /^\s*ayuda\s*$/,
    answer: () =>
      'Puedo ayudarte a reservar una cita — solo dime qué servicio quieres, o pregúntame por nuestro horario, precios o ubicación.',
  },
];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
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
