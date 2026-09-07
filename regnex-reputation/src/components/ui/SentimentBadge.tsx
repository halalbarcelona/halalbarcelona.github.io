import { Frown, Meh, Smile } from "lucide-react";
import type { Sentiment } from "@/types";
import { Badge } from "./Badge";

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; tone: "success" | "warning" | "danger"; Icon: typeof Smile }> = {
  positivo: { label: "Positivo", tone: "success", Icon: Smile },
  neutral: { label: "Neutral", tone: "warning", Icon: Meh },
  negativo: { label: "Negativo", tone: "danger", Icon: Frown },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const { label, tone, Icon } = SENTIMENT_CONFIG[sentiment];
  return (
    <Badge tone={tone}>
      <Icon width={12} height={12} strokeWidth={2} />
      {label}
    </Badge>
  );
}
