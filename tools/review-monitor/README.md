# Review monitor

Watches your Google Business Profile listing for new reviews, runs every
6 hours via GitHub Actions (`.github/workflows/review-monitor.yml`), and for
each new review:

- **Auto-replies** with a Claude-drafted reply, if the review looks like a
  genuine, non-negative review.
- **Holds it and emails you** instead, with no auto-reply, if it's flagged as:
  - hate speech, harassment, or a threat
  - a likely fake or defamatory review
  - spam or competitor content
  - 1/2-star or otherwise clearly negative

State (which reviews have already been handled, and their outcome) is kept in
`state.json`, which the workflow commits back to the repo after each run so
reviews are never double-processed.

## One-time setup

### 1. Google Business Profile API access

Reviews are managed through Google's legacy "My Business API"
(`mybusiness.googleapis.com/v4`). Access to it is gated by Google — you need
to:

1. Have (or create) a Google Cloud project, enable the **My Business
   Business Information API** and request access to the **My Business
   Review Management** scope/API via Google's access request form
   (https://developers.google.com/my-business/content/prereqs). This step
   is manual on Google's side and can take a few days.
2. Create an OAuth 2.0 **Client ID** (type: Desktop or Web) for that
   project, and note the client ID + client secret.
3. Run an OAuth consent flow once, as the Google account that manages your
   Business Profile listing, with scope
   `https://www.googleapis.com/auth/business.manage`, to obtain a
   **refresh token**. (Google's OAuth Playground, https://developers.google.com/oauthplayground,
   is the quickest way to do this: plug in your client ID/secret under its
   settings gear, authorize the scope above, then exchange for tokens.)
4. Find your **account ID** and **location ID**: call
   `https://mybusinessaccountmanagement.googleapis.com/v1/accounts` and then
   `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations`
   with a valid access token, or use Google's API Explorer.

### 2. Anthropic API key

Create a key at https://console.anthropic.com/ for review classification and
reply drafting.

### 3. Notification email

Any Gmail address works as the sender. Create a 16-character
[App Password](https://myaccount.google.com/apppasswords) for it (requires
2-Step Verification to be on) — do not use your real Google password.

### 4. GitHub repository secrets

Add these under Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `GBP_CLIENT_ID` | Google OAuth client ID |
| `GBP_CLIENT_SECRET` | Google OAuth client secret |
| `GBP_REFRESH_TOKEN` | Refresh token from step 1.3 |
| `GBP_ACCOUNT_ID` | Business Profile account ID |
| `GBP_LOCATION_ID` | Business Profile location ID |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `NOTIFY_FROM_EMAIL` | Gmail address used to send alerts |
| `NOTIFY_FROM_EMAIL_APP_PASSWORD` | App password for that Gmail address |
| `NOTIFY_TO_EMAIL` | Where alerts should be sent (e.g. imran.dcs@gmail.com) |

Scheduled workflows only run from the repository's **default branch**, so
this needs to be merged there before the cron schedule takes effect. Until
then, you can still test it via the "Run workflow" button on the Actions tab
(`workflow_dispatch`).

## Customizing

- `BUSINESS_CONTEXT` (optional env var in the workflow) — a sentence or two
  describing the business, used to ground Claude's drafted replies. Defaults
  to a short description of Halal Barcelona.
- `ANTHROPIC_MODEL` (optional) — defaults to `claude-sonnet-5`.
- The harmful/safe criteria and reply tone live in `CLASSIFY_SYSTEM_PROMPT`
  inside `review_monitor.py` — edit it directly to change what counts as
  harmful or how replies should sound.

## Running locally

```bash
pip install -r requirements.txt
export GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=...
export GBP_ACCOUNT_ID=... GBP_LOCATION_ID=...
export ANTHROPIC_API_KEY=...
export EMAIL_ADDRESS=... EMAIL_APP_PASSWORD=... NOTIFY_EMAIL=...
python review_monitor.py
```
