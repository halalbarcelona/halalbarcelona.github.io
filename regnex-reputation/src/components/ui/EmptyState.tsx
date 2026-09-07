import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-faint">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && <p className="max-w-sm text-[13px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
