import type { Review } from "@/types";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import { ResponseStatusBadge } from "@/components/ui/ResponseStatusBadge";
import { AIResponseGenerator } from "./AIResponseGenerator";
import { TOPIC_LABELS } from "@/lib/ai";
import { formatDateTimeEs } from "@/lib/utils/date";
import { TriangleAlert } from "lucide-react";

export function ReviewDetailPanel({ review }: { review: Review }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-6 pb-5 pt-6">
        <p className="pr-8 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Reseña de Google</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">{review.author}</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-faint">{formatDateTimeEs(review.date)}</p>
          </div>
          <StarRating rating={review.rating} size={17} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SentimentBadge sentiment={review.sentiment} />
          <PriorityBadge priority={review.priority} />
          <ResponseStatusBadge status={review.responseStatus} />
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <div>
          <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-faint">Reseña completa</p>
          <p className="text-[14.5px] leading-relaxed text-ink">{review.text}</p>
        </div>

        {review.topics.length > 0 && (
          <div>
            <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-faint">Temas mencionados</p>
            <div className="flex flex-wrap gap-1.5">
              {review.topics.map((topic) => (
                <Badge key={topic} tone="neutral">
                  {TOPIC_LABELS[topic]}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {review.flagReason && (
          <div className="flex gap-2.5 rounded-lg border border-warning-bg bg-warning-bg/60 px-3.5 py-3">
            <TriangleAlert width={16} height={16} className="mt-0.5 shrink-0 text-warning" />
            <div>
              <p className="text-[12.5px] font-semibold text-ink">Por qué se marcó esta reseña</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{review.flagReason}</p>
            </div>
          </div>
        )}

        <AIResponseGenerator review={review} />
      </div>
    </div>
  );
}
