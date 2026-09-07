import type { Review } from "@/types";
import { addDays, isWithinLastDays, startOfWeek, weekRangeLabelEs } from "@/lib/utils/date";

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export interface OverviewMetrics {
  averageRating: number;
  averageRatingChange: number;
  totalReviews: number;
  newReviews: number;
  newReviewsChange: number;
  pendingResponses: number;
  negativeReviews: number;
  negativeReviewsChange: number;
  responseRate: number;
  responseRateChange: number;
}

export function computeOverviewMetrics(reviews: Review[], now: Date = new Date()): OverviewMetrics {
  const current = reviews.filter((r) => isWithinLastDays(r.date, 7, now));
  const previous = reviews.filter(
    (r) => !isWithinLastDays(r.date, 7, now) && isWithinLastDays(r.date, 14, now)
  );
  const excludingCurrent = reviews.filter((r) => !isWithinLastDays(r.date, 7, now));

  const overallAverage = average(reviews.map((r) => r.rating));
  const baselineAverage = average(excludingCurrent.map((r) => r.rating));

  const respondedTotal = reviews.filter((r) => r.responseStatus === "respondida").length;
  const respondedPrevious = excludingCurrent.filter((r) => r.responseStatus === "respondida").length;

  const negativeCurrent = current.filter((r) => r.sentiment === "negativo").length;
  const negativePrevious = previous.filter((r) => r.sentiment === "negativo").length;

  const responseRate = reviews.length > 0 ? respondedTotal / reviews.length : 0;
  const responseRatePrevious = excludingCurrent.length > 0 ? respondedPrevious / excludingCurrent.length : 0;

  return {
    averageRating: Number(overallAverage.toFixed(1)),
    averageRatingChange: Number((overallAverage - (baselineAverage || overallAverage)).toFixed(1)),
    totalReviews: reviews.length,
    newReviews: current.length,
    newReviewsChange: current.length - previous.length,
    pendingResponses: reviews.filter((r) => r.responseStatus === "sin_responder").length,
    negativeReviews: negativeCurrent,
    negativeReviewsChange: negativeCurrent - negativePrevious,
    responseRate,
    responseRateChange: responseRate - responseRatePrevious,
  };
}

export interface RatingTrendPoint {
  weekLabel: string;
  averageRating: number | null;
  reviewCount: number;
}

export function computeRatingTrend(reviews: Review[], weeks = 8, now: Date = new Date()): RatingTrendPoint[] {
  if (reviews.length === 0) return [];
  const latestWeekStart = startOfWeek(now);

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
      averageRating: inBucket.length > 0 ? Number(average(inBucket.map((r) => r.rating)).toFixed(2)) : null,
      reviewCount: inBucket.length,
    };
  });
}
