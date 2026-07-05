import express from 'express';
import { getAllBookings, insertBooking } from '../db.js';
import { validateBookingInput } from '../bookingValidation.js';

export function createBookingsRouter() {
  const router = express.Router();

  router.get('/bookings', async (_req, res) => {
    try {
      const bookings = await getAllBookings();
      res.json(bookings);
    } catch (err) {
      console.error('Error in GET /api/bookings:', err);
      res.status(500).json({ error: 'Could not load bookings.' });
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
      const { id } = await insertBooking({ name, phone, service, date, time });
      res.status(201).json({ success: true, bookingId: id });
    } catch (err) {
      console.error('Error in POST /api/bookings:', err);
      res.status(500).json({ error: 'The booking could not be saved. Please try again.' });
    }
  });

  return router;
}
