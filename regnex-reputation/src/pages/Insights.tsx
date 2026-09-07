import { useMemo } from "react";
import { Sparkles, ThumbsUp, TriangleAlert } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { aiProvider } from "@/lib/ai";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InsightItemCard } from "@/components/insights/InsightItemCard";
import { SentimentTrendChart } from "@/components/charts/SentimentTrendChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { DemoModeBadge } from "@/components/ui/DemoModeBadge";

export function Insights() {
  const reviews = useAppStore((s) => s.reviews);
  const insights = useMemo(() => aiProvider.generateInsights(reviews), [reviews]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Insights</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-soft">
            Patrones detectados automáticamente en las reseñas de tus clientes.
          </p>
        </div>
        <DemoModeBadge label="Análisis generado sobre datos de demostración" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Lo que más valoran tus clientes</CardTitle>
              <CardDescription>Temas que aparecen sobre todo en reseñas positivas</CardDescription>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-bg text-success">
              <ThumbsUp width={15} height={15} />
            </span>
          </CardHeader>
          {insights.strengths.length === 0 ? (
            <EmptyState
              icon={<Sparkles width={20} height={20} />}
              title="Todavía no hay suficientes datos"
              description="A medida que lleguen más reseñas positivas, aquí aparecerán los temas más valorados."
            />
          ) : (
            <div className="space-y-3">
              {insights.strengths.map((item) => (
                <InsightItemCard key={item.topic} item={item} tone="strength" />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Lo que deberías vigilar</CardTitle>
              <CardDescription>Temas recurrentes en reseñas negativas o neutras</CardDescription>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning">
              <TriangleAlert width={15} height={15} />
            </span>
          </CardHeader>
          {insights.watchouts.length === 0 ? (
            <EmptyState
              icon={<Sparkles width={20} height={20} />}
              title="Nada que vigilar por ahora"
              description="No hay temas que se repitan en reseñas negativas de forma significativa."
            />
          ) : (
            <div className="space-y-3">
              {insights.watchouts.map((item) => (
                <InsightItemCard key={item.topic} item={item} tone="watchout" />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tendencias</CardTitle>
            <CardDescription>Reseñas positivas, neutras y negativas por semana</CardDescription>
          </div>
        </CardHeader>
        <SentimentTrendChart data={insights.sentimentTrend} />
      </Card>
    </div>
  );
}
