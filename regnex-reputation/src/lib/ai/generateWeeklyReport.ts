import type { Review } from "@/types";
import type { InsightItem, WeeklyReport, WeeklyReportRecommendation } from "./types";
import { generateInsights } from "./generateInsights";
import { isWithinLastDays } from "@/lib/utils/date";
import { TOPIC_LABELS, TOPIC_PHRASES } from "./topics";

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** A topic can show up as both a strength and a watchout; keep one entry per topic. */
function dedupeTopicsByHighestMentions(items: InsightItem[]): InsightItem[] {
  const byTopic = new Map<InsightItem["topic"], InsightItem>();
  for (const item of items) {
    const existing = byTopic.get(item.topic);
    if (!existing || item.mentionCount > existing.mentionCount) byTopic.set(item.topic, item);
  }
  return [...byTopic.values()];
}

function buildRecommendations(current: Review[], insights: ReturnType<typeof generateInsights>): WeeklyReportRecommendation[] {
  const recommendations: WeeklyReportRecommendation[] = [];

  const topWatchout = insights.watchouts[0];
  if (topWatchout) {
    recommendations.push({
      title: `Revisar ${TOPIC_PHRASES[topWatchout.topic]}`,
      detail: `${TOPIC_LABELS[topWatchout.topic]} aparece en ${topWatchout.mentionCount} reseñas de esta semana, varias de ellas negativas. Vale la pena comentarlo con el equipo antes de que se convierta en una tendencia.`,
    });
  }

  const pending = current.filter((r) => r.responseStatus === "sin_responder").length;
  if (pending > 0) {
    recommendations.push({
      title: "Poner al día las respuestas pendientes",
      detail: `Hay ${pending} reseña${pending > 1 ? "s" : ""} sin responder esta semana. Responder en las primeras 48 horas mejora la percepción de marca, incluso en reseñas positivas.`,
    });
  }

  const urgent = current.filter((r) => r.priority === "urgente").length;
  if (urgent > 0) {
    recommendations.push({
      title: "Priorizar las alertas urgentes",
      detail: `${urgent} reseña${urgent > 1 ? "s" : ""} de esta semana están marcadas como urgentes. Se recomienda una respuesta personalizada y, si aplica, contacto directo con el cliente.`,
    });
  }

  const topStrength = insights.strengths[0];
  if (topStrength) {
    recommendations.push({
      title: `Seguir cuidando ${TOPIC_PHRASES[topStrength.topic]}`,
      detail: `Es lo más valorado por tus clientes esta semana. Mantener el nivel aquí sigue siendo la base de las reseñas positivas.`,
    });
  }

  return recommendations;
}

/**
 * Deterministic stand-in for an LLM-generated weekly summary. Compares the
 * most recent 7-day window against the previous one using only fields
 * already present on each review — no figures are invented.
 */
export function generateWeeklyReport(reviews: Review[], periodLabel: string): WeeklyReport {
  const now = new Date();
  const current = reviews.filter((r) => isWithinLastDays(r.date, 7, now));
  const previous = reviews.filter(
    (r) => !isWithinLastDays(r.date, 7, now) && isWithinLastDays(r.date, 14, now)
  );

  const currentAvg = average(current.map((r) => r.rating));
  const previousAvg = average(previous.map((r) => r.rating));

  const respondedCount = current.filter(
    (r) => r.responseStatus === "respondida"
  ).length;

  const insights = generateInsights(current.length > 0 ? current : reviews);

  return {
    periodLabel,
    reviewsReceived: current.length,
    averageRating: Number(currentAvg.toFixed(1)),
    ratingChange: Number((currentAvg - previousAvg).toFixed(1)),
    positiveReviews: current.filter((r) => r.sentiment === "positivo").length,
    negativeReviews: current.filter((r) => r.sentiment === "negativo").length,
    responseRate: current.length > 0 ? respondedCount / current.length : 0,
    mostMentionedTopics: dedupeTopicsByHighestMentions([...insights.strengths, ...insights.watchouts])
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 5),
    reviewsNeedingAttention: current
      .filter((r) => r.priority !== "normal")
      .sort((a, b) => (a.priority === "urgente" ? -1 : 1)),
    recommendations: buildRecommendations(current, insights),
    generatedAt: now.toISOString(),
  };
}
