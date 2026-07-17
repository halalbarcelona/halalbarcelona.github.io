import nodemailer from 'nodemailer';

// Email is optional. If SMTP_HOST/SMTP_USER/SMTP_PASS aren't set, every
// send() call logs instead of throwing — the app still works fully as an
// admin-dashboard-only inbox (you'd just check /admin instead of your
// email for new orders and rely on the reply text being visible there).
let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    transporter = null;
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function send({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] SMTP not configured — would have emailed ${to}: "${subject}"`);
    return { sent: false };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await t.sendMail({ from, to, subject, text });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] Failed to send email:', err.message);
    return { sent: false, error: err.message };
  }
}

export async function notifyOwnerOfNewOrder(order) {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) {
    console.log('[mailer] NOTIFY_EMAIL not set — skipping owner notification for new order.');
    return { sent: false };
  }
  const lines = [
    `New app request from ${order.name} (${order.email})`,
    order.phone ? `Phone: ${order.phone}` : null,
    order.businessName ? `Business: ${order.businessName}` : null,
    order.projectType ? `Project type: ${order.projectType}` : null,
    order.budget ? `Budget: ${order.budget}` : null,
    '',
    'Description:',
    order.description,
    '',
    'Reply from the admin inbox at /admin.',
  ].filter((line) => line !== null);
  return send({ to, subject: `New app request: ${order.name}`, text: lines.join('\n') });
}

export async function sendReplyToCustomer(order, message) {
  return send({
    to: order.email,
    subject: 'Re: your app request — Ashworth',
    text: `${message}\n\n—\nAshworth`,
  });
}
