// Central place for shop facts — edit this to match the real business.
// Used both for FAQ-style answers in chat and for validating that a
// requested day isn't one the shop is closed.

export const SHOP_INFO = {
  name: 'Premium Cuts Barbershop',
  address: 'Carrer Major 45, Cornellà de Llobregat, Barcelona',
  phone: '+34 93 123 45 67',
  hoursText: 'Monday–Saturday, 9am–7pm (closed Sundays)',
  closedWeekdays: [0], // 0 = Sunday (JS Date.getDay() convention)
  cancellationPolicy: 'Please give us at least 2 hours notice if you need to cancel or reschedule.',
  walkInsPolicy: "We take walk-ins when there's a free chair, but booking ahead guarantees your spot.",
  // Prices reflect typical neighborhood-barbershop rates in the Barcelona
  // area (lower than US averages) — edit to match the real business.
  services: {
    Haircut: { price: '18€', duration: '30 min', description: 'A classic cut, wash and style.' },
    'Beard Trim': { price: '10€', duration: '15 min', description: 'Beard shape-up and trim.' },
    Both: { price: '25€', duration: '45 min', description: 'Haircut and beard trim together (bundle price).' },
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
