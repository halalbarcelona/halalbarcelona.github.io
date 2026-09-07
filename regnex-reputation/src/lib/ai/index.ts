import type { Review } from "@/types";
import type { AIProvider, GenerateResponseOptions } from "./types";
import { generateReviewResponse } from "./generateReviewResponse";
import { analyzeReview } from "./analyzeReview";
import { generateInsights } from "./generateInsights";
import { generateWeeklyReport } from "./generateWeeklyReport";

export * from "./types";
export { TOPIC_LABELS, TOPIC_PHRASES } from "./topics";

/**
 * Fully deterministic, offline implementation of {@link AIProvider}. This is
 * what powers the product today so it can be demoed with zero external
 * dependencies. Swapping in a real model later means writing a new class
 * that implements the same interface (routed through a backend endpoint that
 * holds the API key) and pointing `aiProvider` at it — nothing in the UI
 * layer needs to change.
 */
export class DemoAIProvider implements AIProvider {
  generateReviewResponse(review: Review, options: GenerateResponseOptions): string {
    return generateReviewResponse(review, options);
  }

  analyzeReview(text: string, rating: Review["rating"]) {
    return analyzeReview(text, rating);
  }

  generateInsights(reviews: Review[]) {
    return generateInsights(reviews);
  }

  generateWeeklyReport(reviews: Review[], periodLabel: string) {
    return generateWeeklyReport(reviews, periodLabel);
  }
}

export const aiProvider: AIProvider = new DemoAIProvider();
