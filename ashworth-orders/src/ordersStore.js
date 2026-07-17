import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

// A single JSON file is plenty for a lead inbox at this volume, and it
// means zero database setup — just a file that's easy to read or back up
// by hand. Every call re-reads/re-writes the whole file; fine for the
// request rate this app sees (a human submitting a form or clicking
// reply, not a high-throughput API).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'orders.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readAll() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(orders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

export function listOrders() {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getOrder(id) {
  return readAll().find((o) => o.id === id) || null;
}

export function createOrder({ name, email, phone, businessName, projectType, description, budget }) {
  const orders = readAll();
  const order = {
    id: randomUUID(),
    name,
    email,
    phone: phone || '',
    businessName: businessName || '',
    projectType: projectType || '',
    description,
    budget: budget || '',
    status: 'new',
    createdAt: new Date().toISOString(),
    replies: [],
  };
  orders.push(order);
  writeAll(orders);
  return order;
}

export function addReply(id, message) {
  const orders = readAll();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.replies.push({ message, sentAt: new Date().toISOString() });
  order.status = 'replied';
  writeAll(orders);
  return order;
}
