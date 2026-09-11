#!/usr/bin/env python3
"""
Google Business Profile review monitor.

For every new review on the configured Business Profile location:
  1. Ask Claude to classify it (hate/harassment/threats, fake or defamatory,
     spam/competitor content, or any low-star / negative-sentiment review).
  2. If it's flagged as harmful, hold it (no auto-reply) and email a
     notification with the review text and the reason(s) it was flagged.
  3. Otherwise, draft a reply with Claude and post it back to the review
     automatically.

State (which reviews have already been handled) is kept in state.json next
to this script so re-runs don't double-reply or double-notify.

Required environment variables are documented in README.md.
"""

from __future__ import annotations

import json
import os
import smtplib
import sys
import time
from email.mime.text import MIMEText
from pathlib import Path

import requests
from anthropic import Anthropic

STATE_PATH = Path(__file__).parent / "state.json"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GBP_API_BASE = "https://mybusiness.googleapis.com/v4"


def env(name: str, required: bool = True, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if required and not value:
        print(f"Missing required environment variable: {name}", file=sys.stderr)
        sys.exit(1)
    return value or ""


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text())
    return {"handled": {}}


def save_state(state: dict) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")


def get_google_access_token() -> str:
    resp = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": env("GOOGLE_CLIENT_ID"),
            "client_secret": env("GOOGLE_CLIENT_SECRET"),
            "refresh_token": env("GOOGLE_REFRESH_TOKEN"),
            "grant_type": "refresh_token",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def list_reviews(access_token: str) -> list[dict]:
    account_id = env("GBP_ACCOUNT_ID")
    location_id = env("GBP_LOCATION_ID")
    url = f"{GBP_API_BASE}/accounts/{account_id}/locations/{location_id}/reviews"
    headers = {"Authorization": f"Bearer {access_token}"}
    reviews: list[dict] = []
    params: dict = {"pageSize": 50}
    while True:
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        reviews.extend(data.get("reviews", []))
        next_page = data.get("nextPageToken")
        if not next_page:
            break
        params["pageToken"] = next_page
    return reviews


def post_reply(access_token: str, review_name: str, reply_text: str) -> None:
    url = f"{GBP_API_BASE}/{review_name}/reply"
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.put(url, headers=headers, json={"comment": reply_text}, timeout=30)
    resp.raise_for_status()


STAR_RATING_MAP = {
    "ONE": 1,
    "TWO": 2,
    "THREE": 3,
    "FOUR": 4,
    "FIVE": 5,
    "STAR_RATING_UNSPECIFIED": None,
}

CLASSIFY_SYSTEM_PROMPT = """\
You help moderate and respond to public reviews for a real local business. \
For the review given to you, decide whether it needs a human to handle it \
personally, or whether it is safe for an automatic, friendly reply to be \
posted on the business's behalf.

Flag the review as needing a human (harmful=true) if ANY of these apply:
- hate_harassment_threat: contains hate speech, harassment, or a threat \
against staff, customers, or the business.
- fake_defamatory: reads as a fake review (e.g. clearly not a real \
customer, describes a different business, or makes specific false \
factual claims) or is defamatory.
- spam_competitor: spam, an irrelevant promotion, or content that looks \
like it's from a competitor rather than a genuine customer.
- negative_low_rating: the star rating is 1 or 2, OR there is no star \
rating but the text is clearly negative/complaining about a bad \
experience.

If none of those apply, harmful=false, and you should also draft a short, \
warm, specific reply in the business's voice thanking the reviewer or \
addressing what they said. Keep the reply under 60 words, no emojis, no \
generic corporate filler, and do not invent facts not present in the \
review or the business context you were given.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "harmful": boolean,
  "reasons": {
    "hate_harassment_threat": boolean,
    "fake_defamatory": boolean,
    "spam_competitor": boolean,
    "negative_low_rating": boolean
  },
  "explanation": "one sentence explaining the decision",
  "reply": "the drafted reply text, or empty string if harmful is true"
}
"""


def classify_and_maybe_draft(client: Anthropic, model: str, business_context: str,
                              reviewer_name: str, star_rating: int | None,
                              comment: str) -> dict:
    star_text = f"{star_rating} star(s)" if star_rating is not None else "no star rating given"
    user_content = (
        f"Business context: {business_context}\n\n"
        f"Reviewer name: {reviewer_name or 'unknown'}\n"
        f"Rating: {star_text}\n"
        f"Review text: {comment or '(no text, rating only)'}"
    )
    message = client.messages.create(
        model=model,
        max_tokens=400,
        system=CLASSIFY_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    raw = "".join(block.text for block in message.content if block.type == "text").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start != -1 and end != -1:
            return json.loads(raw[start:end + 1])
        raise ValueError(f"Could not parse Claude response as JSON: {raw!r}")


def send_notification_email(review: dict, verdict: dict) -> None:
    to_addr = env("NOTIFY_EMAIL")
    from_addr = env("EMAIL_ADDRESS")
    app_password = env("EMAIL_APP_PASSWORD")

    reviewer = review.get("reviewer", {}).get("displayName", "unknown")
    star = STAR_RATING_MAP.get(review.get("starRating"), None)
    comment = review.get("comment", "(no text, rating only)")
    reasons = [k for k, v in verdict.get("reasons", {}).items() if v]
    review_url = f"https://business.google.com/reviews"

    body = (
        f"A review was held for your attention instead of being auto-replied.\n\n"
        f"Reviewer: {reviewer}\n"
        f"Rating: {star if star is not None else 'n/a'}\n"
        f"Flagged for: {', '.join(reasons) or 'unspecified'}\n"
        f"Why: {verdict.get('explanation', '')}\n\n"
        f"Review text:\n{comment}\n\n"
        f"Reply to it yourself here: {review_url}\n"
    )
    msg = MIMEText(body)
    msg["Subject"] = f"[Review alert] {', '.join(reasons) or 'Review needs attention'}"
    msg["From"] = from_addr
    msg["To"] = to_addr

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(from_addr, app_password)
        smtp.send_message(msg)


def main() -> None:
    business_context = env(
        "BUSINESS_CONTEXT",
        required=False,
        default="Halal Barcelona, a directory/community site helping people find "
        "halal restaurants, hotels, and mosques in Barcelona.",
    )
    model = env("ANTHROPIC_MODEL", required=False, default="claude-sonnet-5")

    state = load_state()
    handled = state.setdefault("handled", {})

    access_token = get_google_access_token()
    reviews = list_reviews(access_token)
    client = Anthropic(api_key=env("ANTHROPIC_API_KEY"))

    new_count = 0
    for review in reviews:
        review_name = review["name"]  # e.g. accounts/*/locations/*/reviews/*
        existing = handled.get(review_name)
        update_time = review.get("updateTime")
        if existing and existing.get("updateTime") == update_time:
            continue  # already handled this exact version of the review

        new_count += 1
        reviewer = review.get("reviewer", {}).get("displayName", "")
        star_rating = STAR_RATING_MAP.get(review.get("starRating"))
        comment = review.get("comment", "")

        verdict = classify_and_maybe_draft(
            client, model, business_context, reviewer, star_rating, comment
        )

        if verdict.get("harmful"):
            send_notification_email(review, verdict)
            handled[review_name] = {"status": "held", "updateTime": update_time}
            print(f"Held review {review_name} ({reviewer}) - notified by email.")
        else:
            reply_text = verdict.get("reply", "").strip()
            if reply_text:
                post_reply(access_token, review_name, reply_text)
            handled[review_name] = {"status": "replied", "updateTime": update_time}
            print(f"Replied to review {review_name} ({reviewer}).")

        time.sleep(1)  # be gentle with API rate limits

    save_state(state)
    print(f"Done. {new_count} review(s) processed, {len(reviews)} total fetched.")


if __name__ == "__main__":
    main()
