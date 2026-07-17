import express from 'express';
import { listOrders, getOrder, addReply } from '../ordersStore.js';
import { sendReplyToCustomer } from '../mailer.js';

// Mounted behind the basicAuth middleware in server.js — every route here
// assumes the request has already been authenticated.
export function createAdminRouter() {
  const router = express.Router();

  router.get('/orders', (_req, res) => {
    res.json(listOrders());
  });

  router.post('/orders/:id/reply', async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      res.status(400).json({ error: 'Reply message is required.' });
      return;
    }

    const order = getOrder(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const updated = addReply(order.id, message);
    const result = await sendReplyToCustomer(updated, message);
    res.json({ order: updated, emailSent: result.sent });
  });

  return router;
}
