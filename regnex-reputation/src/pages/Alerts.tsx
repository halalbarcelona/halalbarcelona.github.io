import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { AlertCard } from "@/components/reviews/AlertCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export function Alerts() {
  const reviews = useAppStore((s) => s.reviews);

  const { urgent, attention } = useMemo(() => {
    const flagged = reviews
      .filter((r) => r.priority !== "normal")
      .sort((a, b) => b.date.localeCompare(a.date));
    return {
      urgent: flagged.filter((r) => r.priority === "urgente"),
      attention: flagged.filter((r) => r.priority === "atencion"),
    };
  }, [reviews]);

  const total = urgent.length + attention.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Alertas</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">
          Reseñas negativas que Regnex ha marcado para que no se te pasen por alto.
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<ShieldCheck width={24} height={24} />}
          title="Sin alertas activas"
          description="No hay reseñas negativas o urgentes pendientes de revisión ahora mismo."
        />
      ) : (
        <>
          {urgent.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-ink">Urgentes</h2>
                <Badge tone="danger" dot>
                  {urgent.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {urgent.map((review) => (
                  <AlertCard key={review.id} review={review} />
                ))}
              </div>
            </section>
          )}

          {attention.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-ink">Requieren atención</h2>
                <Badge tone="warning" dot>
                  {attention.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {attention.map((review) => (
                  <AlertCard key={review.id} review={review} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
