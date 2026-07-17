# Ashworth Orders

A small, self-contained "hire us" tool: a public page where anyone can
request a custom app, and a password-protected admin inbox where Ashworth
sees each request and replies — with the reply emailed straight to the
customer.

## Stack

- **Backend:** Node.js + Express
- **Storage:** a single local JSON file (`data/orders.json`) — no database
  to set up. Fine for a lead inbox at this volume, and it's trivial to read
  or back up by hand.
- **Email:** `nodemailer` over SMTP, used for two things — notifying you
  when a new request comes in, and emailing your reply to the customer.
  Fully optional: if SMTP isn't configured, the app still works as an
  admin-dashboard-only inbox (everything is logged to the console and
  visible in `/admin` instead of emailed).
- **Frontend:** plain HTML/CSS/JS, no build step — same visual language as
  the other Ashworth demo products in this repo.

## How it works

```
Public page  ──POST /api/orders───────► saved to data/orders.json
  (/)                                    │
                                          └─► email to NOTIFY_EMAIL (if SMTP set)

Admin inbox  ──GET  /api/admin/orders──► list of all requests
  (/admin)   ──POST /api/admin/orders/:id/reply──► saved + emailed to the customer
```

The admin inbox and its API (`/admin`, `/api/admin/*`) are behind HTTP
Basic Auth. **This is fail-closed on purpose** — if `ADMIN_PASSWORD` isn't
set, the admin routes refuse every request rather than being silently
open to anyone who finds the URL, since this inbox holds real customer
contact details.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in at least `ADMIN_PASSWORD`.
3. `npm start`, then open http://localhost:3000 (the public form) and
   http://localhost:3000/admin (the inbox — you'll be prompted for
   `ADMIN_USER`/`ADMIN_PASSWORD`).

### Turning on email (optional but recommended)

Without SMTP configured, new requests and your replies are only logged to
the console and visible in `/admin` — nothing gets emailed. To actually
receive notifications and have replies land in the customer's inbox, set
`NOTIFY_EMAIL` (where new-request notifications go) and the `SMTP_*`
variables in `.env`.

The easiest free option is a Gmail account with an **App Password**:
Google Account → Security → 2-Step Verification → App passwords. That
gives you a 16-character password to use as `SMTP_PASS` — no billing, no
API signup, no quota, unlike the LLM APIs this repo's other projects ran
into trouble with.

## Known limitations

- **No spam protection** on the public form (no CAPTCHA/rate limiting) —
  fine for a low-traffic outreach tool, worth adding if this gets shared
  widely.
- **Single JSON file storage** — works well up to a few thousand requests;
  would need a real database if this grows into a high-volume product.
- **Basic Auth, not a full login system** — good enough for one admin
  (you); would need real accounts/sessions if more than one person needs
  separate access.

## Deploy to Render

Included in the root `render.yaml` Blueprint alongside the other Ashworth
demo products in this repo — deploy via Render's **New → Blueprint**,
connect this repo, and set `ADMIN_PASSWORD` (and the `SMTP_*`/`NOTIFY_EMAIL`
vars if you want email) as environment variables.

## Project layout

```
ashworth-orders/
├── src/
│   ├── server.js         Express app: static files, basic auth, routes
│   ├── ordersStore.js     JSON-file storage: create/list/reply
│   ├── mailer.js           nodemailer wrapper (optional SMTP)
│   └── routes/
│       ├── orders.js       POST /api/orders (public)
│       └── admin.js        GET/POST /api/admin/orders (protected)
├── public/                 Public order-request page
│   ├── index.html
│   ├── order.js
│   └── styles.css
├── admin-ui/               Admin inbox (served under /admin, protected)
│   ├── index.html
│   └── admin.js
└── data/
    └── orders.json         Created automatically on first order
```
