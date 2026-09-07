import { useMemo, type ReactNode } from "react";
import { Download, Lightbulb, Star, TriangleAlert } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { aiProvider } from "@/lib/ai";
import { restaurantProfile } from "@/data/restaurant";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { TOPIC_LABELS } from "@/lib/ai";
import { formatDateEs, weekRangeLabelEs, startOfWeek, addDays } from "@/lib/utils/date";
import { formatDecimalEs, formatPercentEs, formatSignedDecimalEs } from "@/lib/utils/format";

export function WeeklyReport() {
  const reviews = useAppStore((s) => s.reviews);

  const periodLabel = useMemo(() => {
    const start = startOfWeek(new Date());
    return `${weekRangeLabelEs(start)} de ${addDays(start, 6).getFullYear()}`;
  }, []);

  const report = useMemo(() => aiProvider.generateWeeklyReport(reviews, periodLabel), [reviews, periodLabel]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Informe semanal</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-soft">
            Un resumen listo para compartir con el resto del equipo.
          </p>
        </div>
        <Button icon={<Download width={15} height={15} />} onClick={() => window.print()}>
          Descargar informe
        </Button>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <div className="border-b border-line-soft pb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-accent-400">
              R
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">Regnex Reputation</p>
              <p className="text-[11px] text-ink-faint">Informe semanal de reputación online</p>
            </div>
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">{restaurantProfile.name}</h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            Periodo: {report.periodLabel} · Generado el {formatDateEs(report.generatedAt)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-4">
          <ReportStat label="Reseñas recibidas" value={String(report.reviewsReceived)} />
          <ReportStat
            label="Valoración media"
            value={`⭐ ${formatDecimalEs(report.averageRating)}`}
            caption={`${formatSignedDecimalEs(report.ratingChange)} vs. semana anterior`}
          />
          <ReportStat label="Reseñas positivas" value={String(report.positiveReviews)} />
          <ReportStat label="Reseñas negativas" value={String(report.negativeReviews)} />
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-line-soft pt-6 lg:grid-cols-2">
          <div>
            <SectionTitle icon={<Star width={14} height={14} />}>Temas más mencionados</SectionTitle>
            {report.mostMentionedTopics.length === 0 ? (
              <p className="text-[13px] text-ink-faint">No hay suficientes datos esta semana.</p>
            ) : (
              <ul className="space-y-2">
                {report.mostMentionedTopics.map((topic) => (
                  <li key={topic.topic} className="flex items-center justify-between text-[13.5px]">
                    <span className="text-ink">{TOPIC_LABELS[topic.topic]}</span>
                    <span className="tabular text-ink-faint">{topic.mentionCount} menciones</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[13px] text-ink-soft">
              Tasa de respuesta esta semana: <strong className="font-semibold text-ink">{formatPercentEs(report.responseRate)}</strong>
            </p>
          </div>

          <div>
            <SectionTitle icon={<TriangleAlert width={14} height={14} />}>Reseñas que requieren atención</SectionTitle>
            {report.reviewsNeedingAttention.length === 0 ? (
              <p className="text-[13px] text-ink-faint">Ninguna reseña marcada esta semana.</p>
            ) : (
              <ul className="space-y-2.5">
                {report.reviewsNeedingAttention.map((review) => (
                  <li key={review.id} className="flex items-start justify-between gap-3 text-[13.5px]">
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={12} />
                      <span className="text-ink">{review.author}</span>
                    </div>
                    <PriorityBadge priority={review.priority} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-line-soft pt-6">
          <SectionTitle icon={<Lightbulb width={14} height={14} />}>Recomendaciones de Regnex</SectionTitle>
          <div className="space-y-3">
            {report.recommendations.map((rec) => (
              <div key={rec.title} className="rounded-lg bg-surface-muted px-4 py-3">
                <p className="text-[13.5px] font-semibold text-ink">{rec.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{rec.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 border-t border-line-soft pt-4 text-[11px] leading-relaxed text-ink-faint">
          Informe generado automáticamente por Regnex Reputation sobre datos de demostración de{" "}
          {restaurantProfile.name}. Al conectar Google Business Profile, este informe reflejará reseñas reales.
        </p>
      </Card>
    </div>
  );
}

function ReportStat({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold text-ink">{value}</p>
      {caption && <p className="mt-0.5 text-[11.5px] text-ink-faint">{caption}</p>}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
      {icon}
      {children}
    </div>
  );
}
