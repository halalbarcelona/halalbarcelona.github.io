import express from 'express';
import { listSquareBookings, createSquareBooking } from '../squareClient.js';
import { validateBookingInput } from '../bookingValidation.js';

export function createBookingsRouter() {
  const router = express.Router();

  router.get('/bookings', async (_req, res) => {
    try {
      const bookings = await listSquareBookings();
      res.json(bookings);
    } catch (err) {
      console.error('Error in GET /api/bookings:', err);
      res.status(500).json({ error: 'No se pudieron cargar las reservas.' });
    }
  });

  // Manual booking form submission — bypasses the AI entirely, for
  // customers who'd rather fill in a form than chat.
  router.post('/bookings', async (req, res) => {
    const { name, phone, service, date, time } = req.body || {};
    const validation = validateBookingInput({ name, phone, service, date, time });

    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const result = await createSquareBooking({ name, phone, service, date, time });
      if (!result.success) {
        res.status(422).json({ error: result.error });
        return;
      }
      res.status(201).json(result);
    } catch (err) {
      console.error('Error in POST /api/bookings:', err);
      res.status(500).json({ error: 'No se pudo guardar la reserva. Inténtalo de nuevo.' });
    }
  });

  return router;
}
