import "dotenv/config";
import pkg from "@slack/bolt";
const { App } = pkg;
import { classifyRecognition } from "./classify.js";
import { recordKudos, getStats, getLeaderboard } from "./store.js";

const REACTION = process.env.GROWBOT_REACTION || "seedling";
const MENTION_RE = /<@([A-Z0-9]+)>/g;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Passive listener: any message that @-mentions a teammate is checked for
// genuine recognition (thanks/praise/credit), not just a "props"/"kudos" keyword.
app.message(async ({ message, client, logger }) => {
  if (message.subtype || !message.text || !message.user) return;

  const mentions = [...message.text.matchAll(MENTION_RE)]
    .map((m) => m[1])
    .filter((userId, i, arr) => userId !== message.user && arr.indexOf(userId) === i);

  if (mentions.length === 0) return;

  let result;
  try {
    result = await classifyRecognition(message.text);
  } catch (err) {
    logger.error("Growbot classification failed:", err);
    return;
  }

  if (!result.is_recognition) return;

  for (const receiver of mentions) {
    recordKudos({
      giver: message.user,
      receiver,
      reason: result.reason,
      channel: message.channel,
    });
  }

  try {
    await client.reactions.add({
      channel: message.channel,
      timestamp: message.ts,
      name: REACTION,
    });
  } catch (err) {
    logger.warn("Growbot could not add reaction:", err.data?.error ?? err);
  }

  const receiverMentions = mentions.map((id) => `<@${id}>`).join(" ");
  await client.chat.postMessage({
    channel: message.channel,
    thread_ts: message.ts,
    text: `:${REACTION}: Growbot noted some kudos for ${receiverMentions}${
      result.reason ? ` - ${result.reason}` : ""
    }!`,
  });
});

app.command("/growbot", async ({ command, ack, respond }) => {
  await ack();
  const [sub, arg] = command.text.trim().split(/\s+/);

  if (sub === "stats") {
    const userId = arg?.replace(/[<@>]/g, "");
    if (!userId) {
      await respond("Usage: `/growbot stats @teammate`");
      return;
    }
    const stats = getStats(userId);
    await respond(`<@${userId}> has received *${stats.count}* kudos.`);
    return;
  }

  if (sub === "leaderboard" || !sub) {
    const leaderboard = getLeaderboard(5);
    if (leaderboard.length === 0) {
      await respond("No kudos logged yet - go recognize a teammate!");
      return;
    }
    const lines = leaderboard.map(
      (entry, i) => `${i + 1}. <@${entry.userId}> - ${entry.count} kudos`,
    );
    await respond(`*Growbot Leaderboard* :seedling:\n${lines.join("\n")}`);
    return;
  }

  await respond("Usage: `/growbot leaderboard` or `/growbot stats @teammate`");
});

(async () => {
  await app.start();
  app.logger.info("Growbot is running (Socket Mode)");
})();
