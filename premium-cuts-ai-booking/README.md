# Premium Cuts AI Booking — built by Ashworth

A full-stack demo: customers either chat with an AI receptionist or fill in
a plain form to book a barbershop appointment — both paths save to the same
local SQLite database, which is viewable on a simple admin dashboard.

## Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via the `sqlite3` package), a local file on disk
- **AI:** Google's Gemini, via the official `@google/genai` SDK, using
  function-calling so the model only ever saves a booking through a
  well-defined `book_appointment` function — it never writes to the
  database directly.
- **Frontend:** plain HTML/CSS/JS served as static files by Express — no
  build step, no framework.

## How the booking flow works

There are two ways to book, both landing in the same table:

```
Chat tab   ──POST /api/chat─────► Express ──► Gemini (function-calling)
                                                   │
                                        calls book_appointment
                                                   │
Manual tab ──POST /api/bookings─► Express ─────────┼──────► SQLite bookings table
                                        (shared validateBookingInput)
```

The server has no session store — the browser keeps the full conversation
history in memory and resends it with every message. Gemini collects the
customer's name, phone, service, date, and time conversationally, and only
calls `book_appointment` once the customer has confirmed all five details.

The manual form skips Gemini entirely and posts straight to
`POST /api/bookings`. Both paths run the same `validateBookingInput` check
(`src/bookingValidation.js`) before anything reaches the database, so a
saved booking always has real, validated data behind it regardless of
which way the customer chose to book.

## Get a public link (deploy to Render — one click)

This repo includes a `render.yaml` Blueprint at its root, so Render can set
up the whole service automatically:

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   (sign in with a Google account, no business verification needed).
2. In [Render](https://render.com/), click **New → Blueprint** and connect
   the `halalbarcelona/halalbarcelona.github.io` repo (branch
   `claude/untitled-nt7egw`, unless it's since been merged to the default
   branch).
3. Render reads `render.yaml` and pre-fills everything — root directory,
   build/start commands, free plan. The only thing it'll ask you for is the
   `GEMINI_API_KEY` value — paste in the key from step 1.
4. Click **Apply** / **Deploy**. Render gives you a public URL like
   `https://premium-cuts-ai-booking.onrender.com` once it finishes building.

Visit that URL for the chat booking page, and `/admin` for the dashboard.

(Note: the free tier's filesystem is ephemeral, so the SQLite database
resets on redeploy/restart — see "Known limitations" below.)

## Run it locally instead

```bash
cd premium-cuts-ai-booking
npm install
cp .env.example .env   # then add your Gemini API key
npm start
```

Then open:
- **http://localhost:3000** — the customer-facing chat booking page
- **http://localhost:3000/admin** — the bookings dashboard (not linked from
  the site's nav, but not password-protected either — see "Known
  limitations" below)

## Project layout

```
premium-cuts-ai-booking/
├── src/
│   ├── server.js            Express app: static files, routes, DB init
│   ├── db.js                 SQLite setup + insertBooking/getAllBookings
│   ├── bookingValidation.js   Shared validation used by both booking paths
│   ├── geminiAgent.js         System prompt, book_appointment function, chat loop
│   └── routes/
│       ├── chat.js           POST /api/chat
│       └── bookings.js       GET + POST /api/bookings
├── public/
│   ├── index.html            Customer page: chat tab + manual booking tab
│   ├── admin.html            Bookings dashboard
│   ├── chat.js                Chat tab logic
│   ├── manual.js               Manual booking form logic
│   ├── toggle.js                Switches between the chat and manual tabs
│   ├── admin.js                Admin dashboard logic
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
  the assistant is stored as-is.
- **Single SQLite file, no migrations** — fine for a demo; a real
  multi-instance deployment would want a hosted database instead.
- **No conversation persistence across page reloads** — history lives in
  the browser tab's memory only; refreshing the page starts a new chat.
