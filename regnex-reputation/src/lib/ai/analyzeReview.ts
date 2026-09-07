import type { Priority, Review, Sentiment } from "@/types";
import type { ReviewAnalysis } from "./types";
import { extractTopics, TOPIC_PHRASES } from "./topics";

const SEVERE_KEYWORDS = [
  "pelo", "asco", "sucio", "sucia", "grosero", "grosera", "insecto",
  "intoxicación", "vómito", "cucaracha", "nunca más", "denunciar",
];

function sentimentFromRating(rating: Review["rating"]): Sentiment {
  if (rating >= 4) return "positivo";
  if (rating === 3) return "neutral";
  return "negativo";
}

function priorityFor(rating: Review["rating"], text: string): Priority {
  const lower = text.toLowerCase();
  const hasSevereSignal = SEVERE_KEYWORDS.some((keyword) => lower.includes(keyword));
  if (rating === 1 || (rating === 2 && hasSevereSignal)) return "urgente";
  if (rating === 2) return "atencion";
  return "normal";
}

function buildFlagReason(rating: Review["rating"], topics: ReturnType<typeof extractTopics>): string | undefined {
  if (rating > 2) return undefined;
  const topicPhrase = topics.map((t) => TOPIC_PHRASES[t]).join(" y ");
  return `Cliente insatisfecho con ${topicPhrase}. Se recomienda responder de forma personalizada y revisar internamente el problema mencionado.`;
}

/**
 * Deterministic stand-in for an LLM-based classifier. Runs on new reviews
 * as they come in (via the ingestion pipeline / demo seed) to derive
 * sentiment, priority and topics without any external call.
 */
export function analyzeReview(text: string, rating: Review["rating"]): ReviewAnalysis {
  const topics = extractTopics(text);
  const sentiment = sentimentFromRating(rating);
  const priority = priorityFor(rating, text);
  const flagReason = priority !== "normal" ? buildFlagReason(rating, topics) : undefined;

  return { sentiment, priority, topics, flagReason };
}
