import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { createOrdersRouter } from './routes/orders.js';
import { createAdminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Protects /admin and /api/admin/*. Fails closed: if ADMIN_PASSWORD isn't
// set, the admin inbox is entirely unreachable rather than silently open
// to anyone who finds the URL — this holds customer contact details, so
// "misconfigured" should mean "locked" not "public."
function basicAuth(req, res, next) {
  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedPass) {
    res.status(500).send('Admin panel is not configured — set ADMIN_PASSWORD in your environment.');
    return;
  }

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  const decoded = encoded ? Buffer.from(encoded, 'base64').toString('utf8') : '';
  const sepIndex = decoded.indexOf(':');
  const user = sepIndex === -1 ? decoded : decoded.slice(0, sepIndex);
  const pass = sepIndex === -1 ? '' : decoded.slice(sepIndex + 1);

  if (scheme === 'Basic' && user === expectedUser && safeEqual(pass, expectedPass)) {
    next();
    return;
  }

  res.set('WWW-Authenticate', 'Basic realm="Ashworth Admin"');
  res.status(401).send('Authentication required.');
}

app.use('/admin', basicAuth, express.static(path.join(__dirname, '../admin-ui')));
app.use('/api/admin', basicAuth, createAdminRouter());
app.use('/api', createOrdersRouter());
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ashworth Orders running on port ${PORT}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('ADMIN_PASSWORD is not set — /admin is locked until you set it.');
  }
  if (!process.env.SMTP_HOST) {
    console.log('SMTP not configured — new orders/replies will be logged, not emailed. See .env.example.');
  }
});
