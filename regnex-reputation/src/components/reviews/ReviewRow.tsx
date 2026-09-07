import { ChevronRight } from "lucide-react";
import type { Review } from "@/types";
import { StarRating } from "@/components/ui/StarRating";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import { ResponseStatusBadge } from "@/components/ui/ResponseStatusBadge";
import { formatDateEs } from "@/lib/utils/date";

export function ReviewRow({ review, onOpen }: { review: Review; onOpen: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpen(review.id)}
      className="grid w-full grid-cols-1 items-center gap-2.5 px-4 py-4 text-left transition-colors hover:bg-surface-muted sm:grid-cols-[168px_1fr_104px_120px_150px_16px] sm:gap-4 sm:px-5"
    >
      <div className="flex items-center gap-2.5 sm:min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">
          {review.author
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium text-ink">{review.author}</p>
          <StarRating rating={review.rating} size={12} className="mt-0.5" />
        </div>
      </div>

      <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-soft sm:line-clamp-1">{review.text}</p>

      <p className="text-[12.5px] text-ink-faint">{formatDateEs(review.date)}</p>

      <div>
        <SentimentBadge sentiment={review.sentiment} />
      </div>

      <div>
        <ResponseStatusBadge status={review.responseStatus} />
      </div>

      <ChevronRight width={16} height={16} className="hidden shrink-0 text-ink-faint sm:block" />
    </button>
  );
}
