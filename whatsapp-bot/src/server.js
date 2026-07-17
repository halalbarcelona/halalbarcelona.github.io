import express from 'express';
import { config } from './config.js';
import { loadMenu } from './menu/menuService.js';
import { createTwilioClient } from './whatsapp/twilioClient.js';
import { createOwnerNotifier } from './notify/ownerNotifier.js';
import { createClaudeClient } from './assistant/claudeClient.js';
import { createWhatsappRouter } from './routes/whatsapp.js';

const app = express();
const menuData = loadMenu();
const twilioClient = createTwilioClient(config);
const notifyOwner = createOwnerNotifier({
  twilioClient,
  fromNumber: config.twilioWhatsappNumber,
  ownerNumber: config.ownerWhatsappNumber,
  restaurantName: menuData.restaurant.name,
});
const claudeClient = createClaudeClient({ apiKey: config.anthropicApiKey });

app.get('/', (_req, res) => res.send('Machado Kebab WhatsApp bot is running.'));
app.use('/whatsapp', createWhatsappRouter({ menuData, claudeClient, notifyOwner }));

app.listen(config.port, () => {
  console.log(`Machado Kebab WhatsApp bot listening on port ${config.port}`);
});
