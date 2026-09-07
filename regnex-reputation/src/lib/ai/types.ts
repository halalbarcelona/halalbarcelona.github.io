import type { Priority, Review, ReviewTopic, Sentiment } from "@/types";
import type { ResponseTone } from "@/types";

export interface GenerateResponseOptions {
  tone: ResponseTone;
  /** Cycled by "Regenerar" to produce a different phrasing deterministically. */
  variant?: number;
}

export interface ReviewAnalysis {
  sentiment: Sentiment;
  priority: Priority;
  topics: ReviewTopic[];
  flagReason?: string;
}

export interface InsightItem {
  topic: ReviewTopic;
  label: string;
  mentionCount: number;
  shareOfReviews: number;
  examplePhrase: string;
}

export interface SentimentTrendPoint {
  weekLabel: string;
  positivo: number;
  neutral: number;
  negativo: number;
}

export interface ReviewInsights {
  strengths: InsightItem[];
  watchouts: InsightItem[];
  sentimentTrend: SentimentTrendPoint[];
}

export interface WeeklyReportRecommendation {
  title: string;
  detail: string;
}

export interface WeeklyReport {
  periodLabel: string;
  reviewsReceived: number;
  averageRating: number;
  ratingChange: number;
  positiveReviews: number;
  negativeReviews: number;
  responseRate: number;
  mostMentionedTopics: InsightItem[];
  reviewsNeedingAttention: Review[];
  recommendations: WeeklyReportRecommendation[];
  generatedAt: string;
}

/**
 * Abstraction over the AI capabilities the product needs. `DemoAIProvider`
 * implements this with deterministic, template-based logic so the app works
 * end to end without any API key or network call. A future
 * `ClaudeAIProvider` (or similar) can implement the same interface and be
 * swapped in via `setAIProvider` — the UI layer never needs to change.
 *
 * IMPORTANT: a real LLM-backed provider must call a backend endpoint, never
 * the model API directly from the browser — that is the only place an API
 * key may live.
 */
export interface AIProvider {
  generateReviewResponse(review: Review, options: GenerateResponseOptions): string;
  analyzeReview(text: string, rating: Review["rating"]): ReviewAnalysis;
  generateInsights(reviews: Review[]): ReviewInsights;
  generateWeeklyReport(reviews: Review[], periodLabel: string): WeeklyReport;
}
