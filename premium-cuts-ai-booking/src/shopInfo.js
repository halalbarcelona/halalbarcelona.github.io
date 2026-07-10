// Central place for shop facts — edit this to match the real business.
// Used both for FAQ-style answers in chat and for validating that a
// requested day isn't one the shop is closed.

export const SHOP_INFO = {
  name: 'Premium Cuts Barbershop',
  address: '123 Main Street, Cornellà de Llobregat',
  phone: '(555) 123-4567',
  hoursText: 'Monday–Saturday, 9am–7pm (closed Sundays)',
  closedWeekdays: [0], // 0 = Sunday (JS Date.getDay() convention)
  cancellationPolicy: 'Please give us at least 2 hours notice if you need to cancel or reschedule.',
  services: {
    Haircut: { price: '$28', duration: '30 min', description: 'A classic cut, wash and style.' },
    'Beard Trim': { price: '$15', duration: '15 min', description: 'Beard shape-up and trim.' },
    Both: { price: '$38', duration: '45 min', description: 'Haircut and beard trim together.' },
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
