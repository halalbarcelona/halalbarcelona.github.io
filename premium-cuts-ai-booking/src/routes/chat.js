import express from 'express';

export function createChatRouter({ agent }) {
  const router = express.Router();

  router.post('/chat', async (req, res) => {
    try {
      const message = typeof req.body?.message === 'string' ? req.body.message : '';
      const history = Array.isArray(req.body?.history) ? req.body.history : [];
      const { reply, history: updatedHistory } = await agent.handleMessage(message, history);
      res.json({ reply, history: updatedHistory });
    } catch (err) {
      console.error('Error in /api/chat:', err);
      res.status(500).json({ error: 'Algo ha ido mal. Inténtalo de nuevo.' });
    }
  });

  return router;
}
