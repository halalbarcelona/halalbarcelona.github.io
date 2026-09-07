import type { InsightItem } from "@/lib/ai";
import { TOPIC_PHRASES } from "@/lib/ai";
import { formatPercentEs } from "@/lib/utils/format";

interface InsightItemCardProps {
  item: InsightItem;
  tone: "strength" | "watchout";
}

export function InsightItemCard({ item, tone }: InsightItemCardProps) {
  const sentence =
    tone === "strength"
      ? `Los clientes mencionan frecuentemente ${TOPIC_PHRASES[item.topic]}, y casi siempre en positivo.`
      : `${item.label} aparece repetidamente en reseñas negativas recientes.`;

  return (
    <div className="rounded-xl border border-line-soft bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13.5px] font-semibold text-ink">{item.label}</p>
        <span className="tabular text-[12px] font-medium text-ink-faint">
          {item.mentionCount} menciones · {formatPercentEs(item.shareOfReviews)}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{sentence}</p>
      {item.examplePhrase && (
        <p className="mt-3 border-l-2 border-line pl-3 text-[12.5px] italic leading-relaxed text-ink-faint">
          “{item.examplePhrase}”
        </p>
      )}
    </div>
  );
}
