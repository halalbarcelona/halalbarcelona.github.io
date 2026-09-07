import { FlaskConical } from "lucide-react";
import { Badge } from "./Badge";

export function DemoModeBadge({ label = "Modo demostración" }: { label?: string }) {
  return (
    <Badge tone="accent">
      <FlaskConical width={12} height={12} strokeWidth={2} />
      {label}
    </Badge>
  );
}
