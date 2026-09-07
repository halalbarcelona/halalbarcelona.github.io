import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RatingTrendPoint } from "@/lib/metrics";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point: RatingTrendPoint = payload[0].payload;
  if (point.averageRating === null) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-popover">
      <p className="text-[11px] font-medium text-ink-faint">{label}</p>
      <p className="tabular text-[13px] font-semibold text-ink">
        ⭐ {point.averageRating.toFixed(1)}{" "}
        <span className="font-normal text-ink-faint">
          · {point.reviewCount} reseña{point.reviewCount !== 1 ? "s" : ""}
        </span>
      </p>
    </div>
  );
}

export function RatingTrendChart({ data }: { data: RatingTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B87A1F" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#B87A1F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#E4E7EC" />
        <XAxis
          dataKey="weekLabel"
          tick={{ fontSize: 11, fill: "#8A93A0" }}
          tickLine={false}
          axisLine={{ stroke: "#E4E7EC" }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[3, 5]}
          ticks={[3, 4, 5]}
          tick={{ fontSize: 11, fill: "#8A93A0" }}
          tickLine={false}
          axisLine={false}
          width={24}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="averageRating"
          stroke="#B87A1F"
          strokeWidth={2.25}
          fill="url(#ratingFill)"
          connectNulls
          dot={{ r: 3, fill: "#B87A1F", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
