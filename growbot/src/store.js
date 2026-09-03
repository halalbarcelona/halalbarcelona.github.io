import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(here, "..", "data", "kudos.json");

function load() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function recordKudos({ giver, receiver, reason, channel }) {
  const data = load();
  if (!data[receiver]) data[receiver] = { count: 0, entries: [] };
  data[receiver].count += 1;
  data[receiver].entries.push({
    giver,
    reason,
    channel,
    ts: new Date().toISOString(),
  });
  save(data);
  return data[receiver].count;
}

export function getStats(userId) {
  const data = load();
  return data[userId] ?? { count: 0, entries: [] };
}

export function getLeaderboard(limit = 5) {
  const data = load();
  return Object.entries(data)
    .map(([userId, stats]) => ({ userId, count: stats.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
