import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck, MessageSquareText, Star, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { computeOverviewMetrics, computeRatingTrend } from "@/lib/metrics";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { RatingTrendChart } from "@/components/charts/RatingTrendChart";
import { AttentionReviewCard } from "@/components/reviews/AttentionReviewCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatDecimalEs,
  formatPercentEs,
  formatSignedDecimalEs,
  formatSignedInt,
  formatSignedPercentPoints,
} from "@/lib/utils/format";
import { restaurantProfile } from "@/data/restaurant";

function useGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function Dashboard() {
  const reviews = useAppStore((s) => s.reviews);
  const greeting = useGreeting();

  const metrics = useMemo(() => computeOverviewMetrics(reviews), [reviews]);
  const trend = useMemo(() => computeRatingTrend(reviews), [reviews]);

  const attentionReviews = useMemo(
    () =>
      reviews
        .filter((r) => r.priority !== "normal" && r.responseStatus !== "respondida")
        .sort((a, b) => {
          const rank = { urgente: 0, atencion: 1, normal: 2 } as const;
          if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
          return b.date.localeCompare(a.date);
        })
        .slice(0, 4),
    [reviews]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[26px]">
          {greeting}, {restaurantProfile.name}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">Tu reputación online, de un vistazo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Valoración media"
          value={`⭐ ${formatDecimalEs(metrics.averageRating)}`}
          icon={<Star width={16} height={16} />}
          delta={{
            value: formatSignedDecimalEs(metrics.averageRatingChange),
            direction: metrics.averageRatingChange > 0 ? "up" : metrics.averageRatingChange < 0 ? "down" : "flat",
          }}
        />
        <StatTile
          label="Total de reseñas"
          value={String(metrics.totalReviews)}
          icon={<Users width={16} height={16} />}
        />
        <StatTile
          label="Reseñas nuevas"
          value={String(metrics.newReviews)}
          icon={<MessageSquareText width={16} height={16} />}
          delta={{
            value: formatSignedInt(metrics.newReviewsChange),
            direction: metrics.newReviewsChange > 0 ? "up" : metrics.newReviewsChange < 0 ? "down" : "flat",
          }}
        />
        <StatTile
          label="Pendientes de responder"
          value={String(metrics.pendingResponses)}
          icon={<TriangleAlert width={16} height={16} />}
        />
        <StatTile
          label="Reseñas negativas"
          value={String(metrics.negativeReviews)}
          icon={<TriangleAlert width={16} height={16} />}
          delta={{
            value: formatSignedInt(metrics.negativeReviewsChange),
            direction: metrics.negativeReviewsChange > 0 ? "up" : metrics.negativeReviewsChange < 0 ? "down" : "flat",
            upIsGood: false,
          }}
        />
        <StatTile
          label="Tasa de respuesta"
          value={formatPercentEs(metrics.responseRate)}
          icon={<CircleCheck width={16} height={16} />}
          delta={{
            value: formatSignedPercentPoints(metrics.responseRateChange),
            direction: metrics.responseRateChange > 0 ? "up" : metrics.responseRateChange < 0 ? "down" : "flat",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Evolución de tu valoración</CardTitle>
              <CardDescription>Media semanal de las últimas 8 semanas</CardDescription>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
              <TrendingUp width={16} height={16} />
            </span>
          </CardHeader>
          <RatingTrendChart data={trend} />
        </Card>

        <Card className="flex flex-col xl:col-span-2" padded={false}>
          <div className="flex items-start justify-between gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
            <div>
              <CardTitle>Atención requerida</CardTitle>
              <CardDescription>Las reseñas más importantes que necesitan una respuesta</CardDescription>
            </div>
          </div>

          <div className="flex-1 px-5 sm:px-6">
            {attentionReviews.length === 0 ? (
              <EmptyState
                icon={<CircleCheck width={22} height={22} />}
                title="Todo al día"
                description="No hay reseñas urgentes pendientes de respuesta en este momento."
              />
            ) : (
              <div className="divide-y-0">
                {attentionReviews.map((review) => (
                  <AttentionReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>

          <Link
            to="/alertas"
            className="flex items-center justify-center gap-1.5 border-t border-line-soft px-5 py-3.5 text-[13px] font-semibold text-brand-700 hover:bg-surface-muted sm:px-6"
          >
            Ver todas las alertas
            <ArrowRight width={14} height={14} />
          </Link>
        </Card>
      </div>
    </div>
  );
}
