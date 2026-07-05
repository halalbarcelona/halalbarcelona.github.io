# Premium Cuts AI Booking — built by Ashworth

A full-stack demo: customers chat with an AI receptionist to book a
barbershop appointment, which gets saved to a local SQLite database and
is viewable on a simple admin dashboard.

## Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via the `sqlite3` package), a local file on disk
- **AI:** Anthropic's Claude, via the official `@anthropic-ai/sdk`, using
  tool-calling so the model only ever saves a booking through a well-defined
  `book_appointment` function — it never writes to the database directly.
- **Frontend:** plain HTML/CSS/JS served as static files by Express — no
  build step, no framework.

## How the booking flow works

```
Browser chat UI ──POST /api/chat──► Express ──► Claude (tool-calling)
                                                     │
                                          calls book_appointment
                                                     │
                                                     ▼
                                          SQLite bookings table
```

The server has no session store — the browser keeps the full conversation
history in memory and resends it with every message. Claude collects the
customer's name, phone, service, date, and time conversationally, and only
calls `book_appointment` once the customer has confirmed all five details.
The handler for that tool is the only thing that ever writes to the
database, so a saved booking always has real, validated data behind it.

## Setup

```bash
cd premium-cuts-ai-booking
npm install
cp .env.example .env   # then add your Anthropic API key
npm start
```

Then open:
- **http://localhost:3000** — the customer-facing chat booking page
- **http://localhost:3000/admin** — the bookings dashboard (not linked from
  the site's nav, but not password-protected either — see "Known
  limitations" below)

Get an API key at [console.anthropic.com](https://console.anthropic.com/)
and put it in `.env` as `ANTHROPIC_API_KEY`.

## Project layout

```
premium-cuts-ai-booking/
├── src/
│   ├── server.js            Express app: static files, routes, DB init
│   ├── db.js                 SQLite setup + insertBooking/getAllBookings
│   ├── anthropicAgent.js      System prompt, book_appointment tool, chat loop
│   └── routes/
│       ├── chat.js           POST /api/chat
│       └── bookings.js       GET /api/bookings
├── public/
│   ├── index.html            Customer chat booking page
│   ├── admin.html            Bookings dashboard
│   ├── chat.js / admin.js    Frontend logic for each page
│   └── styles.css            Shared styling
└── data/
    └── bookings.db            SQLite database file (created on first run, gitignored)
```

## Known limitations

- **`/admin` has no authentication.** It's "hidden" only in the sense that
  it isn't linked anywhere — anyone who finds the URL can view all
  bookings (names, phone numbers, appointment times). Add real
  authentication (even simple HTTP basic auth) before putting this in
  front of real customer data.
- **No phone number validation/formatting** — whatever the customer tells
  Claude is stored as-is.
- **Single SQLite file, no migrations** — fine for a demo; a real
  multi-instance deployment would want a hosted database instead.
- **No conversation persistence across page reloads** — history lives in
  the browser tab's memory only; refreshing the page starts a new chat.
