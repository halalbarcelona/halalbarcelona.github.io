# Premium Cuts AI Booking — built by Ashworth

A full-stack demo: customers either chat with a booking assistant or fill in
a plain form to book a barbershop appointment. Both paths save real
appointments into **Square Appointments** (via the Square API) — not a
local database — so bookings show up in Square's own dashboard too, and
persist independently of this app's hosting.

## Stack

- **Backend:** Node.js + Express
- **Bookings:** Square, via the official `square` SDK — a real scheduling
  backend (customers, services, team members, availability, appointments),
  not a custom database.
- **Chat assistant:** a fully local, rule-based "mini AI" (`src/miniAiAgent.js`)
  — no external LLM, no API key, no quota, no billing. It fills five slots
  (service, date, time, name, phone) via simple text parsing, one at a
  time, then confirms and books through the same Square client the manual
  form uses. See "Why not a real LLM?" below.
- **Frontend:** plain HTML/CSS/JS served as static files by Express — no
  build step, no framework.

## How the booking flow works

There are two ways to book, both landing in the same Square account:

```
Chat tab   ──POST /api/chat─────► Express ──► miniAiAgent (slot-filling)
                                                   │
Manual tab ──POST /api/bookings─► Express ─────────┼──────► Square (Bookings API)
                                        (shared validateBookingInput)
```

The server has no session store — the browser keeps the conversation state
(which slots are filled so far) and resends it with every message. The
assistant asks for service, date, time, name, and phone one at a time,
parsing free text like "tomorrow", "3pm", or "next Friday" — and only
attempts to book once it shows a summary and the customer confirms.

The manual form posts straight to `POST /api/bookings`, skipping the chat
step entirely. Both paths run the same `validateBookingInput` check
(`src/bookingValidation.js`), and both ultimately call the same
`src/squareClient.js` functions to talk to Square.

## Why not a real LLM?

This app went through Claude, then Gemini, then hit a real-world snag worth
documenting: free-tier daily quotas and account billing issues got in the
way of a live demo. Every external LLM API has *some* catch — either a
capped free tier (Gemini) or no free tier at all beyond a one-time credit
(Claude, Grok, OpenAI). For a scripted, well-defined flow like "collect
five pieces of information and book an appointment," a small rule-based
parser does the job without any of that — zero cost, zero quota, zero
external dependency for the chat itself (Square is still an external
dependency, since that's the actual booking system).

The tradeoff: it's not a general-purpose conversational AI. It won't
answer open-ended questions about the shop, and its date/time parsing,
while covering common phrasings ("tomorrow," "next Friday," "July 10,"
"3pm," "15:30"), isn't as flexible as a real LLM. If a phrase isn't
recognized, it asks again with an example format rather than guessing.

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

1. Create a [Square Developer account](https://developer.squareup.com/),
   create an Application, and grab the **Sandbox Access Token** from your
   application's dashboard (no business verification needed to start in
   Sandbox).
2. Copy `.env.example` to `.env` and fill in `SQUARE_ACCESS_TOKEN`.
3. `npm install && npm start`, then open http://localhost:3000.

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
  sees.
- **`/admin` has no authentication.** It's "hidden" only in the sense that
  it isn't linked anywhere — anyone who finds the URL can view all
  bookings. Add real authentication before putting this in front of real
  customer data.
- **The chat assistant is rule-based, not a real LLM** — see "Why not a
  real LLM?" above for the tradeoff. The manual booking form is always
  available as a fallback that doesn't depend on any parsing at all.

## Get a public link (deploy to Render — one click)

This repo includes a `render.yaml` Blueprint at its root:

1. In [Render](https://render.com/), click **New → Blueprint** and connect
   the `halalbarcelona/halalbarcelona.github.io` repo (branch
   `claude/untitled-nt7egw`, unless it's since been merged to the default
   branch).
2. Render reads `render.yaml` and pre-fills the service config. Add
   `SQUARE_ACCESS_TOKEN` (and optionally `SQUARE_ENVIRONMENT` /
   `SQUARE_LOCATION_ID`) as environment variables.
3. Click **Deploy**. Render gives you a public URL once it finishes
   building.

Visit that URL for the chat booking page, and `/admin` for the dashboard.

## Run it locally instead

```bash
cd premium-cuts-ai-booking
npm install
cp .env.example .env   # then add your Square credentials
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
│   ├── miniAiAgent.js          Local rule-based slot-filling chat assistant
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
