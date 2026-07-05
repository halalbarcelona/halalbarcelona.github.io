import express from 'express';

export function createChatRouter({ agent }) {
  const router = express.Router();

  router.post('/chat', async (req, res) => {
    try {
      const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
      const { reply, messages } = await agent.handleMessage(incoming);
      res.json({ reply, messages });
    } catch (err) {
      console.error('Error in /api/chat:', err);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  });

  return router;
}
