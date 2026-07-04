import { STATES } from './orderState.js';

const sessions = new Map();

function createSession(phone) {
  return {
    phone,
    customerName: null,
    language: 'es',
    state: STATES.IDLE,
    items: [],
    fulfilment: { type: null, note: null },
    history: [],
    lastActivityAt: Date.now(),
  };
}

export function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, createSession(phone));
  }
  return sessions.get(phone);
}

export function saveSession(session) {
  session.lastActivityAt = Date.now();
  sessions.set(session.phone, session);
  return session;
}

export function resetSession(phone) {
  const fresh = createSession(phone);
  sessions.set(phone, fresh);
  return fresh;
}

export function _clearAllSessions() {
  sessions.clear();
}
