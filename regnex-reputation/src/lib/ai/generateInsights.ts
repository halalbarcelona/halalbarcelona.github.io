import type { Review, ReviewTopic } from "@/types";
import type { InsightItem, ReviewInsights, SentimentTrendPoint } from "./types";
import { TOPIC_LABELS } from "./topics";
import { addDays, startOfWeek, weekRangeLabelEs } from "@/lib/utils/date";

interface TopicStat {
  positive: number;
  neutral: number;
  negative: number;
  positiveExample?: string;
  negativeExample?: string;
}

function truncate(text: string, max = 96): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function collectTopicStats(reviews: Review[]): Map<ReviewTopic, TopicStat> {
  const stats = new Map<ReviewTopic, TopicStat>();

  for (const review of reviews) {
    for (const topic of review.topics) {
      const entry = stats.get(topic) ?? { positive: 0, neutral: 0, negative: 0 };
      if (review.sentiment === "positivo") {
        entry.positive += 1;
        entry.positiveExample = entry.positiveExample ?? truncate(review.text);
      } else if (review.sentiment === "neutral") {
        entry.neutral += 1;
      } else {
        entry.negative += 1;
        entry.negativeExample = entry.negativeExample ?? truncate(review.text);
      }
      stats.set(topic, entry);
    }
  }

  return stats;
}

function buildSentimentTrend(reviews: Review[], weeks = 6): SentimentTrendPoint[] {
  if (reviews.length === 0) return [];

  const latest = reviews.reduce((max, r) => (r.date > max ? r.date : max), reviews[0].date);
  const latestWeekStart = startOfWeek(new Date(latest));

  const buckets: { start: Date; end: Date; label: string }[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = addDays(latestWeekStart, -7 * i);
    buckets.push({ start, end: addDays(start, 7), label: weekRangeLabelEs(start) });
  }

  return buckets.map(({ start, end, label }) => {
    const inBucket = reviews.filter((r) => {
      const t = new Date(r.date).getTime();
      return t >= start.getTime() && t < end.getTime();
    });
    return {
      weekLabel: label,
      positivo: inBucket.filter((r) => r.sentiment === "positivo").length,
      neutral: inBucket.filter((r) => r.sentiment === "neutral").length,
      negativo: inBucket.filter((r) => r.sentiment === "negativo").length,
    };
  });
}

/**
 * Deterministic stand-in for an LLM-based topic/theme summarizer: aggregates
 * the topics already attached to each review (see `analyzeReview`) instead
 * of re-reading free text, so results stay stable across renders.
 */
export function generateInsights(reviews: Review[]): ReviewInsights {
  const total = reviews.length;
  const stats = collectTopicStats(reviews);

  const toItem = (topic: ReviewTopic, stat: TopicStat, example: string): InsightItem => {
    const mentionCount = stat.positive + stat.neutral + stat.negative;
    return {
      topic,
      label: TOPIC_LABELS[topic],
      mentionCount,
      shareOfReviews: total > 0 ? mentionCount / total : 0,
      examplePhrase: example,
    };
  };

  const strengths = [...stats.entries()]
    .filter(([, s]) => s.positive >= 2 && s.positive >= s.negative)
    .sort((a, b) => b[1].positive - a[1].positive)
    .slice(0, 4)
    .map(([topic, s]) => toItem(topic, s, s.positiveExample ?? ""));

  const watchouts = [...stats.entries()]
    .filter(([, s]) => s.negative >= 2)
    .sort((a, b) => b[1].negative - a[1].negative)
    .slice(0, 3)
    .map(([topic, s]) => toItem(topic, s, s.negativeExample ?? ""));

  return {
    strengths,
    watchouts,
    sentimentTrend: buildSentimentTrend(reviews),
  };
}
