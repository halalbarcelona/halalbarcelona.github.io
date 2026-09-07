import { useNavigate } from "react-router-dom";
import { Sparkles, TriangleAlert } from "lucide-react";
import type { Review } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import { ResponseStatusBadge } from "@/components/ui/ResponseStatusBadge";
import { formatDateEs } from "@/lib/utils/date";

export function AlertCard({ review }: { review: Review }) {
  const navigate = useNavigate();
  const isUrgent = review.priority === "urgente";

  return (
    <Card className={isUrgent ? "border-danger-bg" : "border-warning-bg"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <StarRating rating={review.rating} size={15} />
          <div>
            <p className="text-[13.5px] font-semibold text-ink">{review.author}</p>
            <p className="text-[12px] text-ink-faint">{formatDateEs(review.date)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SentimentBadge sentiment={review.sentiment} />
          <ResponseStatusBadge status={review.responseStatus} />
        </div>
      </div>

      <p className="mt-4 text-[13.5px] leading-relaxed text-ink">{review.text}</p>

      {review.flagReason && (
        <div
          className={
            "mt-4 flex gap-2.5 rounded-lg px-3.5 py-3 " +
            (isUrgent ? "bg-danger-bg/60" : "bg-warning-bg/60")
          }
        >
          <TriangleAlert
            width={15}
            height={15}
            className={"mt-0.5 shrink-0 " + (isUrgent ? "text-danger" : "text-warning")}
          />
          <div>
            <p className="text-[12px] font-semibold text-ink">Por qué se marcó</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{review.flagReason}</p>
          </div>
        </div>
      )}

      {review.suggestedAction && (
        <div className="mt-3 rounded-lg bg-surface-muted px-3.5 py-3">
          <p className="text-[12px] font-semibold text-ink">Acción sugerida</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{review.suggestedAction}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => navigate(`/resenas?review=${review.id}`)}>
          Ver reseña
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<Sparkles width={13} height={13} />}
          onClick={() => navigate(`/resenas?review=${review.id}`)}
        >
          Generar respuesta
        </Button>
      </div>
    </Card>
  );
}
