import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureSetup } from './squareClient.js';
import { createChatAgent } from './miniAiAgent.js';
import { createChatRouter } from './routes/chat.js';
import { createBookingsRouter } from './routes/bookings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

const agent = createChatAgent();

app.use('/api', createChatRouter({ agent }));
app.use('/api', createBookingsRouter());

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

try {
  await ensureSetup();
} catch (err) {
  console.error('Square setup failed — check SQUARE_ACCESS_TOKEN and related env vars:', err);
}

app.listen(PORT, () => {
  console.log(`Premium Cuts AI booking app listening on port ${PORT}`);
});
