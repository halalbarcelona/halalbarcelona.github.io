import express from 'express';
import { getAllBookings } from '../db.js';

export function createBookingsRouter() {
  const router = express.Router();

  router.get('/bookings', async (_req, res) => {
    try {
      const bookings = await getAllBookings();
      res.json(bookings);
    } catch (err) {
      console.error('Error in /api/bookings:', err);
      res.status(500).json({ error: 'Could not load bookings.' });
    }
  });

  return router;
}
