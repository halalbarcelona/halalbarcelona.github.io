import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent" | "brand";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-ink-soft",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  accent: "bg-accent-50 text-accent-700",
  brand: "bg-brand-50 text-brand-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ children, tone = "neutral", dot = false, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}
