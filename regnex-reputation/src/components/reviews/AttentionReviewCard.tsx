import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Review } from "@/types";
import { StarRating } from "@/components/ui/StarRating";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import { formatRelativeEs } from "@/lib/utils/date";

export function AttentionReviewCard({ review }: { review: Review }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 border-b border-line-soft py-4 last:border-0 last:pb-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <StarRating rating={review.rating} />
          <span className="text-[13.5px] font-medium text-ink">{review.author}</span>
        </div>
        <span className="text-[12px] text-ink-faint">{formatRelativeEs(review.date)}</span>
      </div>

      <p className="text-[13.5px] leading-relaxed text-ink-soft">{review.text}</p>

      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={review.priority} />
        <SentimentBadge sentiment={review.sentiment} />
      </div>

      {review.suggestedAction && (
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">Acción sugerida: </span>
          {review.suggestedAction}
        </p>
      )}

      <button
        onClick={() => navigate(`/resenas?review=${review.id}`)}
        className="inline-flex items-center gap-1 self-start text-[12.5px] font-semibold text-brand-700 hover:text-brand-900"
      >
        Ver reseña
        <ArrowRight width={13} height={13} />
      </button>
    </div>
  );
}
