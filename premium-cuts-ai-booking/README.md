# Premium Cuts AI Booking — built by Ashworth

A full-stack demo: customers either chat with an AI receptionist or fill in
a plain form to book a barbershop appointment. Both paths save real
appointments into **Square Appointments** (via the Square API) — not a
local database — so bookings show up in Square's own dashboard too, and
persist independently of this app's hosting.

## Stack

- **Backend:** Node.js + Express
- **Bookings:** Square, via the official `square` SDK — a real scheduling
  backend (customers, services, team members, availability, appointments),
  not a custom database.
- **AI:** Google's Gemini, via the official `@google/genai` SDK, using
  function-calling so the model only ever saves a booking through a
  well-defined `book_appointment` function — it never talks to Square
  directly.
- **Frontend:** plain HTML/CSS/JS served as static files by Express — no
  build step, no framework.

## How the booking flow works

There are two ways to book, both landing in the same Square account:

```
Chat tab   ──POST /api/chat─────► Express ──► Gemini (function-calling)
                                                   │
                                        calls book_appointment
                                                   │
Manual tab ──POST /api/bookings─► Express ─────────┼──────► Square (Bookings API)
                                        (shared validateBookingInput)
```

The server has no session store — the browser keeps the full conversation
history in memory and resends it with every message. Gemini collects the
customer's name, phone, service, date, and time conversationally, and only
calls `book_appointment` once the customer has confirmed all five details.

The manual form skips Gemini entirely and posts straight to
`POST /api/bookings`. Both paths run the same `validateBookingInput` check
(`src/bookingValidation.js`), and both ultimately call the same
`src/squareClient.js` functions to talk to Square.

## First boot: auto-setup

`src/squareClient.js` automatically sets up whatever's missing in your
Square account the first time it runs:
- Resolves your Square **location** (uses `SQUARE_LOCATION_ID` if you set
  one, otherwise your account's first location).
- Checks for **Haircut**, **Beard Trim**, and **Both** as bookable services
  in Square's Catalog — creates any that don't already exist.
- Checks for an active **team member** at that location — creates a
  default one ("Alex Barber") if none exists.

This means you only need a Square account and an access token — you don't
have to manually create services or staff in Square's dashboard first
(though you're welcome to, and rename/reprice them there any time).

## Setup

1. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Create a [Square Developer account](https://developer.squareup.com/),
   create an Application, and grab the **Sandbox Access Token** from your
   application's dashboard (no business verification needed to start in
   Sandbox).
3. Copy `.env.example` to `.env` and fill in `GEMINI_API_KEY` and
   `SQUARE_ACCESS_TOKEN`.
4. `npm install && npm start`, then open http://localhost:3000.

On first boot, check the server logs — it'll print what it created/found
in Square (services, team member, location).

## Known limitations

- **Not yet tested against a live Square account.** This integration was
  built directly against Square's official Node SDK docs and reference
  examples, but hasn't been exercised against a real Sandbox account yet
  (this dev environment's network policy blocks reaching Square's API).
  Test it with your own Sandbox token and report back anything that
  errors — happy to iterate.
- **Naive timezone handling.** The date + time a customer picks is combined
  into a timestamp using the server's local time, not the Square location's
  actual timezone. Fine for a demo in one timezone; a real deployment
  should resolve this against the location's `timezone` field.
- **No proactive availability check.** The app doesn't search Square for
  open slots before proposing a time — it just attempts to create the
  booking, and Square rejects conflicting times with an error the customer
  sees. Deliberately kept simple to avoid extra Gemini calls (Gemini's free
  tier has a daily quota — see below).
- **`/admin` has no authentication.** It's "hidden" only in the sense that
  it isn't linked anywhere — anyone who finds the URL can view all
  bookings. Add real authentication before putting this in front of real
  customer data.
- **Gemini's free tier has a daily request quota.** It's shared across all
  customers using the chat (not per-customer). `gemini-2.5-flash-lite` (the
  default) has a much higher free quota than the full `gemini-2.5-flash`
  model, which should be plenty for demoing and light real use — but a
  genuinely busy shop would eventually want billing enabled on the Google
  Cloud project behind the key to remove the cap entirely (Flash-Lite is
  very cheap per conversation). The manual booking form doesn't use Gemini
  at all, so it's unaffected by this.

## Get a public link (deploy to Render — one click)

This repo includes a `render.yaml` Blueprint at its root:

1. In [Render](https://render.com/), click **New → Blueprint** and connect
   the `halalbarcelona/halalbarcelona.github.io` repo (branch
   `claude/untitled-nt7egw`, unless it's since been merged to the default
   branch).
2. Render reads `render.yaml` and pre-fills the service config. Fill in
   `GEMINI_API_KEY` and add `SQUARE_ACCESS_TOKEN` (and optionally
   `SQUARE_ENVIRONMENT` / `SQUARE_LOCATION_ID`) as environment variables.
3. Click **Deploy**. Render gives you a public URL once it finishes
   building.

Visit that URL for the chat booking page, and `/admin` for the dashboard.

## Run it locally instead

```bash
cd premium-cuts-ai-booking
npm install
cp .env.example .env   # then add your Gemini + Square credentials
npm start
```

Then open:
- **http://localhost:3000** — the customer-facing chat booking page
- **http://localhost:3000/admin** — the bookings dashboard

## Project layout

```
premium-cuts-ai-booking/
├── src/
│   ├── server.js              Express app: static files, routes, Square setup on boot
│   ├── squareClient.js         Square SDK wrapper: auto-setup, createBooking, listBookings
│   ├── bookingValidation.js    Shared validation used by both booking paths
│   ├── geminiAgent.js          System prompt, book_appointment function, chat loop
│   └── routes/
│       ├── chat.js             POST /api/chat
│       └── bookings.js         GET + POST /api/bookings
└── public/
    ├── index.html               Customer page: chat tab + manual booking tab
    ├── admin.html                Bookings dashboard
    ├── chat.js                   Chat tab logic
    ├── manual.js                  Manual booking form logic
    ├── toggle.js                   Switches between the chat and manual tabs
    ├── admin.js                   Admin dashboard logic
    └── styles.css                Shared styling
```
