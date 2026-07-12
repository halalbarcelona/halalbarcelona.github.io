// Central place for shop facts — edit this to match the real business.
// Used both for FAQ-style answers in chat and for validating that a
// requested day isn't one the shop is closed.

export const SHOP_INFO = {
  name: 'Premium Cuts Barbershop',
  address: 'Carrer Major 45, Cornellà de Llobregat, Barcelona',
  phone: '+34 93 123 45 67',
  hoursText: 'lunes a sábado, de 9:00 a 19:00 (cerrado los domingos)',
  closedWeekdays: [0], // 0 = domingo (convención de Date.getDay() en JS)
  cancellationPolicy: 'Por favor avísanos con al menos 2 horas de antelación si necesitas cancelar o cambiar tu cita.',
  walkInsPolicy: 'Atendemos sin cita cuando hay un sillón libre, pero reservar con antelación garantiza tu turno.',
  // Los precios reflejan tarifas típicas de una barbería de barrio en el
  // área de Barcelona — edítalos para ajustarlos al negocio real.
  services: {
    'Corte de Pelo': { price: '18€', duration: '30 min', description: 'Corte clásico, lavado y peinado.' },
    'Recorte de Barba': { price: '10€', duration: '15 min', description: 'Perfilado y recorte de barba.' },
    Ambos: { price: '25€', duration: '45 min', description: 'Corte de pelo y recorte de barba juntos (precio combinado).' },
  },
};

export function isClosedOn(dateObj) {
  return SHOP_INFO.closedWeekdays.includes(dateObj.getDay());
}

export function formatServicesList() {
  return Object.entries(SHOP_INFO.services)
    .map(([name, info]) => `${name} (${info.price}, ${info.duration})`)
    .join(', ');
}
