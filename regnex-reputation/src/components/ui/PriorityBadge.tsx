import type { Priority } from "@/types";
import { Badge } from "./Badge";

const PRIORITY_CONFIG: Record<Priority, { label: string; tone: "danger" | "warning" | "success" }> = {
  urgente: { label: "Urgente", tone: "danger" },
  atencion: { label: "Atención", tone: "warning" },
  normal: { label: "Normal", tone: "success" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, tone } = PRIORITY_CONFIG[priority];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
