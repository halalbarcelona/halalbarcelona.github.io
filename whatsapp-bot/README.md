# Machado Kebab WhatsApp Ordering Assistant

A WhatsApp chatbot for Machado Döner Kebab & Pizzeria. Customers chat with it
in Spanish, Catalan or English to browse the menu, build an order, and get a
final total — the finished order is then sent straight to the owner's
WhatsApp. It only talks about this restaurant's food and ordering; anything
else is politely declined.

## How it works

```
Customer's WhatsApp
      │
      ▼
   Twilio  ──(webhook)──►  this service (Express)
      │                          │
      │                          ▼
      │                    Claude (Anthropic API)
      │                    — understands the message,
      │                      calls tools like add_item,
      │                      never does the math itself
      │                          │
      │                          ▼
      │                 order engine (menu.yaml + JS)
      │                 — the ONLY place prices/totals
      │                   are actually calculated
      │                          │
      ◄──────── reply ───────────┘
      │
      ▼
When an order is confirmed, a separate WhatsApp message
with the itemized order + total is sent to the owner's number.
```

This matters because language models are unreliable at arithmetic and can
drift from a real menu. Here, Claude only decides *what the customer wants*
and *how to phrase replies*; a plain JavaScript module (`orderCalculator.js`)
is the sole source of truth for every price and total.

## Prerequisites

- Node.js 18+
- A [Twilio](https://www.twilio.com/) account (free to start)
- An [Anthropic API key](https://console.anthropic.com/)
- A [Render](https://render.com/) account (or any host that runs a Node web
  service and gives you a public HTTPS URL)
- The restaurant owner's WhatsApp number (to receive finished orders)

## 1. Twilio setup

1. Create a free Twilio account and find your **Account SID** and **Auth
   Token** on the [Twilio Console](https://console.twilio.com/) dashboard.
2. Go to **Messaging → Try it out → Send a WhatsApp message** to activate the
   free **WhatsApp Sandbox**. Note the sandbox's WhatsApp number and the
   "join `<your-code>`" phrase — you'll text that from your own phone to
   start testing.
3. Once this service is deployed (step 4 below), set the sandbox's
   **"When a message comes in"** webhook to:
   `https://<your-app>.onrender.com/whatsapp/webhook` (method: `HTTP POST`).

The sandbox is free and fine for testing. See "Going live" below for moving
to a real, always-on WhatsApp Business number later.

## 2. Anthropic setup

Sign up at [console.anthropic.com](https://console.anthropic.com/), create an
API key, and keep it handy for the environment variables below.

## 3. Environment variables

Copy `.env.example` to `.env` for local development:

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | From the Twilio Console |
| `TWILIO_AUTH_TOKEN` | From the Twilio Console |
| `TWILIO_WHATSAPP_NUMBER` | The Twilio WhatsApp sender, e.g. `whatsapp:+14155238886` (sandbox number while testing) |
| `OWNER_WHATSAPP_NUMBER` | The restaurant owner's WhatsApp number, e.g. `whatsapp:+34600000000` |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `PUBLIC_BASE_URL` | The public HTTPS URL of this deployed service, e.g. `https://machado-kebab-bot.onrender.com` |
| `PORT` | Local port (Render sets its own automatically) |

Never commit a real `.env` file — it's already covered by `.gitignore`.

## 4. Deploying to Render

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In Render, create a **New Web Service** from this GitHub repo.
3. Set the **Root Directory** to `whatsapp-bot`.
4. Build command: `npm install`. Start command: `npm start`.
5. Add all the environment variables from step 3 in Render's dashboard
   (Environment tab) — not in the code.
6. Deploy, then copy the resulting `https://*.onrender.com` URL into both
   `PUBLIC_BASE_URL` (as an env var here) and the Twilio sandbox webhook
   (step 1.3).

### Local development

```bash
npm install
cp .env.example .env   # then fill in real values
npm run dev
```

To let Twilio reach your local machine for testing, use a tunnel like
[ngrok](https://ngrok.com/) (`ngrok http 3000`) and point the Twilio sandbox
webhook at the ngrok HTTPS URL instead.

## 5. Editing the menu

All menu items and prices live in
[`src/menu/menu.yaml`](src/menu/menu.yaml) — **it ships with placeholder
example items that must be replaced with the real Machado Kebab menu.**

Each item looks like:

```yaml
- id: kebab-pollo              # internal code, customers never see this
  name: "Kebab de Pollo"       # shown to customers
  aliases: ["chicken kebab", "kebab pollo"]   # other ways customers might type it
  price: 6.50                  # always use a dot, not a comma
  description: "Grilled chicken doner with salad and sauce in pita bread."
  tags: [popular]              # optional, informational only
```

To add, remove, or re-price an item, edit this file directly (comments with
`#` are allowed and encouraged) and push the change — Render will
automatically redeploy and the bot will pick up the new menu. **A redeploy is
required** for menu changes to take effect; the file is read once when the
server starts.

## 6. Going live beyond the sandbox

The Twilio Sandbox is great for testing but has limitations (24-hour session
windows, a shared sandbox number, "join" phrase required). When ready for
real customers:

1. In Twilio, request a dedicated **WhatsApp Sender** (this requires Meta
   Business verification — Twilio's console walks you through it).
2. Once approved, update the `TWILIO_WHATSAPP_NUMBER` environment variable in
   Render to the new number. No code changes are needed.
3. Point that new sender's webhook at the same
   `/whatsapp/webhook` URL.

## Known limitations (by design, for this MVP)

- **Session state is in-memory** and resets if the service restarts or
  redeploys. Fine for a single small restaurant's traffic; revisit if this
  becomes a problem.
- **Single restaurant only** — no multi-tenant support.
- **No payment integration** — orders are assumed to be paid on
  pickup/delivery.
- **No delivery-address validation** — the customer's delivery note is passed
  through as free text to the owner.

## Running tests

```bash
npm test
```

This runs the fully automated, offline test suite covering:
- Menu loading and fuzzy item matching (`test/menuService.test.js`)
- Price/total calculations (`test/orderCalculator.test.js`)
- Order state transitions (`test/orderState.test.js`)
- Tool handlers used by the Claude assistant (`test/toolHandlers.test.js`)

These don't require any live credentials. What they **don't** cover — and
can only be checked manually after deploying with real credentials — is the
actual live conversation with Claude, the real Twilio webhook signature
validation, and the owner notification actually arriving on WhatsApp. Use the
sandbox flow described above (sections 1 and 4) to verify those end-to-end.
