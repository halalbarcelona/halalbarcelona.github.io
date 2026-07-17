import express from 'express';
import { createOrder } from '../ordersStore.js';
import { notifyOwnerOfNewOrder } from '../mailer.js';

// Public endpoint — anyone with the link can submit a request. No auth
// here on purpose; the admin side (routes/admin.js) is what's protected.
export function createOrdersRouter() {
  const router = express.Router();

  router.post('/orders', async (req, res) => {
    const { name, email, phone, businessName, projectType, description, budget } = req.body || {};

    if (!name || !email || !description) {
      res.status(400).json({ error: 'Name, email, and a short description are required.' });
      return;
    }

    const order = createOrder({ name, email, phone, businessName, projectType, description, budget });

    // Fire-and-forget: a slow or failing SMTP send shouldn't hold up the
    // customer's confirmation, and the order is already saved either way.
    notifyOwnerOfNewOrder(order).catch((err) => console.error('notifyOwnerOfNewOrder failed:', err));

    res.status(201).json({ id: order.id });
  });

  return router;
}
