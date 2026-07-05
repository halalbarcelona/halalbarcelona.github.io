export const VALID_SERVICES = ['Haircut', 'Beard Trim', 'Both'];

/**
 * Shared validation for a booking payload, used by both the AI's
 * book_appointment function and the manual booking form endpoint — so a
 * booking saved either way has been checked the same way.
 */
export function validateBookingInput({ name, phone, service, date, time } = {}) {
  if (!name || !phone || !service || !date || !time) {
    return { valid: false, error: 'One or more required booking details are missing.' };
  }
  if (!VALID_SERVICES.includes(service)) {
    return { valid: false, error: `service must be one of: ${VALID_SERVICES.join(', ')}.` };
  }
  return { valid: true };
}
