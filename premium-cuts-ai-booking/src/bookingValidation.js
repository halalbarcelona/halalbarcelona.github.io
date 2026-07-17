export const VALID_SERVICES = ['Corte de Pelo', 'Recorte de Barba', 'Ambos'];

/**
 * Shared validation for a booking payload, used by both the AI's
 * book_appointment function and the manual booking form endpoint — so a
 * booking saved either way has been checked the same way.
 */
export function validateBookingInput({ name, phone, service, date, time } = {}) {
  if (!name || !phone || !service || !date || !time) {
    return { valid: false, error: 'Falta uno o más datos obligatorios de la reserva.' };
  }
  if (!VALID_SERVICES.includes(service)) {
    return { valid: false, error: `El servicio debe ser uno de: ${VALID_SERVICES.join(', ')}.` };
  }
  return { valid: true };
}
