import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "./Card";

type DeltaDirection = "up" | "down" | "flat";

interface StatTileProps {
  label: string;
  value: string;
  icon: ReactNode;
  delta?: {
    value: string;
    direction: DeltaDirection;
    /** Whether an "up" delta should read as good news (default true). Set false for metrics like "reseñas negativas". */
    upIsGood?: boolean;
  };
  deltaCaption?: string;
}

export function StatTile({ label, value, icon, delta, deltaCaption = "vs. periodo anterior" }: StatTileProps) {
  const isGood =
    delta &&
    (delta.direction === "flat"
      ? null
      : delta.direction === "up"
        ? (delta.upIsGood ?? true)
        : !(delta.upIsGood ?? true));

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink">{value}</span>
        {delta && (
          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                "tabular inline-flex items-center gap-0.5 text-xs font-semibold",
                isGood === null && "text-ink-faint",
                isGood === true && "text-success",
                isGood === false && "text-danger"
              )}
            >
              {delta.direction === "up" && <ArrowUp width={12} height={12} />}
              {delta.direction === "down" && <ArrowDown width={12} height={12} />}
              {delta.direction === "flat" && <Minus width={12} height={12} />}
              {delta.direction === "flat" ? "Estable" : delta.value}
            </span>
            <span className="text-[11px] text-ink-faint">{deltaCaption}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
