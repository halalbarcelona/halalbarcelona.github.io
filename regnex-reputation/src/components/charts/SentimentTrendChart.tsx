import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SentimentTrendPoint } from "@/lib/ai";

const SERIES: { key: keyof Omit<SentimentTrendPoint, "weekLabel">; label: string; color: string }[] = [
  { key: "positivo", label: "Positivo", color: "#16A34A" },
  { key: "neutral", label: "Neutral", color: "#D97706" },
  { key: "negativo", label: "Negativo", color: "#DC2626" },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-popover">
      <p className="mb-1 text-[11px] font-medium text-ink-faint">{label}</p>
      {SERIES.map(({ key, label: seriesLabel, color }) => {
        const entry = payload.find((p: any) => p.dataKey === key);
        if (!entry) return null;
        return (
          <p key={key} className="tabular flex items-center gap-1.5 text-[12px] text-ink">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {seriesLabel}: {entry.value}
          </p>
        );
      })}
    </div>
  );
}

export function SentimentTrendChart({ data }: { data: SentimentTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={18}>
        <CartesianGrid vertical={false} stroke="#E4E7EC" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: "#8A93A0" }} tickLine={false} axisLine={{ stroke: "#E4E7EC" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8A93A0" }} tickLine={false} axisLine={false} width={28} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(21,26,33,0.03)" }} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-[12px] text-ink-soft">{value}</span>}
        />
        {SERIES.map(({ key, label, color }, i) => (
          <Bar
            key={key}
            dataKey={key}
            name={label}
            stackId="sentiment"
            fill={color}
            radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : undefined}
            maxBarSize={36}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
