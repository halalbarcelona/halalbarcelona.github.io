# Regnex Reputation

Reputation management dashboard built by **Regnex AI** for **Rincón de Cornellà**.
Monitors Google reviews, flags what needs attention, and drafts responses in
Spanish — currently running entirely on realistic demo data so it can be
demoed without a live Google Business Profile connection.

## Run it locally

```bash
npm install
npm run dev
```

Open the printed URL and click **"Entrar en demo"** — no credentials needed.

## Build

```bash
npm run build   # type-checks then builds to dist/
npm run preview # serve the production build locally
```

## Project structure

```
src/
  components/   UI primitives, layout shell, review/insight components, charts
  pages/        One file per route (Resumen, Reseñas, Alertas, Insights, …)
  lib/
    ai/         AI abstraction (generateReviewResponse, analyzeReview,
                generateInsights, generateWeeklyReport) — deterministic demo
                logic today, behind an interface a real LLM provider can
                implement later without touching the UI
    services/   googleBusinessProfileService — the integration point for
                Google Business Profile; currently a documented stub, not a
                fake connection
  store/        Zustand store (localStorage-persisted) for reviews,
                notifications, settings
  data/         Demo restaurant profile, 34 realistic Spanish reviews,
                notifications
  types/        Shared TypeScript types
```

## Connecting Google Business Profile later

`src/lib/services/googleBusinessProfileService.ts` documents the intended
architecture: OAuth 2.0 handled by a backend service (credentials never in
the browser), this frontend calling that backend instead of Google directly,
and replies only marked "respondida" after the backend confirms Google
accepted them. Wiring it up is a matter of implementing that interface —
no UI changes required.
