import type { ResponseStatus } from "@/types";
import { Badge } from "./Badge";

const STATUS_CONFIG: Record<ResponseStatus, { label: string; tone: "neutral" | "accent" | "success" | "warning" }> = {
  sin_responder: { label: "Sin responder", tone: "neutral" },
  borrador_generado: { label: "Borrador generado", tone: "accent" },
  respondida: { label: "Respondida", tone: "success" },
  requiere_revision: { label: "Requiere revisión", tone: "warning" },
};

export function ResponseStatusBadge({ status }: { status: ResponseStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}
