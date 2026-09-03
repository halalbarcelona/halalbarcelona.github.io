# Growbot

Our own version of [Growbot](https://github.com/stanzhengdev/growbot) - the
Slack bot that gives teammates kudos/props for a job well done.

The original Growbot matches hardcoded keywords like "props" or "kudos".
This one is "smart": every message that @-mentions a teammate is sent to
Claude, which decides whether it's genuine recognition (thanks, praise,
credit) rather than a keyword match - so "great job on the deploy @sara"
gets counted even without the word "kudos", and "@sara can you deploy this"
does not.

When Growbot detects recognition it:
- reacts to the message with :seedling:
- posts a thread reply confirming the kudos
- logs it so `/growbot leaderboard` and `/growbot stats` can report on it

## Setup

### 1. Create the Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) -> **Create New App** -> **From scratch**.
2. Under **Socket Mode**, enable it and generate an app-level token with the
   `connections:write` scope. This is your `SLACK_APP_TOKEN` (starts with `xapp-`).
3. Under **OAuth & Permissions**, add these Bot Token Scopes:
   - `chat:write`
   - `reactions:write`
   - `channels:history` (and `groups:history` / `im:history` / `mpim:history`
     if Growbot should also watch private channels/DMs)
   - `commands`
4. Under **Event Subscriptions**, enable events and subscribe to bot event
   `message.channels` (plus `message.groups` / `message.im` / `message.mpim`
   as needed).
5. Under **Slash Commands**, create `/growbot` (Socket Mode doesn't need a
   Request URL).
6. Install the app to your workspace. Copy the **Bot User OAuth Token**
   (starts with `xoxb-`) as `SLACK_BOT_TOKEN`.
7. Invite the bot to whichever channels it should watch: `/invite @Growbot`.

### 2. Configure

```bash
cp .env.example .env
# fill in SLACK_BOT_TOKEN, SLACK_APP_TOKEN, ANTHROPIC_API_KEY
```

### 3. Run

```bash
npm install
npm start
```

## Commands

- `/growbot leaderboard` - top 5 most-recognized teammates
- `/growbot stats @teammate` - how many kudos someone has received

## Notes

- Kudos are stored in `data/kudos.json` (gitignored). This is an MVP,
  file-based store - fine for a small team, but swap in a real database
  before relying on it at scale.
- Recognition detection only considers messages that @-mention someone;
  plain-name shoutouts ("great job, Sara!") aren't resolved to a Slack user.
