import express from 'express';
import twilioPkg from 'twilio';
import { config } from '../config.js';
import { validateTwilioSignature } from '../whatsapp/twilioClient.js';
import { getSession, saveSession } from '../orders/sessionStore.js';
import { buildSystemPrompt } from '../assistant/systemPrompt.js';
import { createToolHandlers } from '../assistant/toolHandlers.js';

const { MessagingResponse } = twilioPkg.twiml;

const FALLBACK_ERROR_REPLY =
  'Lo siento, ha habido un problema técnico. Por favor, inténtalo de nuevo en un momento. / Sorry, something went wrong — please try again shortly.';

export function createWhatsappRouter({ menuData, claudeClient, notifyOwner }) {
  const router = express.Router();
  const toolHandlers = createToolHandlers({ menuData, notifyOwner });
  const systemPrompt = buildSystemPrompt(menuData);

  router.post('/webhook', express.urlencoded({ extended: false }), async (req, res) => {
    const signature = req.headers['x-twilio-signature'];
    const url = `${config.publicBaseUrl}/whatsapp/webhook`;

    const isValid = validateTwilioSignature({
      authToken: config.twilioAuthToken,
      signature,
      url,
      params: req.body,
    });

    if (!isValid) {
      res.status(403).send('Invalid signature');
      return;
    }

    const from = req.body.From;
    const body = req.body.Body || '';
    const profileName = req.body.ProfileName || null;

    const session = getSession(from);
    if (profileName && !session.customerName) {
      session.customerName = profileName;
    }

    const twiml = new MessagingResponse();
    try {
      const reply = await claudeClient.handleMessage({ session, systemPrompt, userMessage: body, toolHandlers });
      saveSession(session);
      twiml.message(reply);
    } catch (err) {
      console.error('Error handling WhatsApp message:', err);
      twiml.message(FALLBACK_ERROR_REPLY);
    }

    res.type('text/xml').send(twiml.toString());
  });

  return router;
}
