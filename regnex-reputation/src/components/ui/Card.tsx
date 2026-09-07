import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  padded?: boolean;
}

export function Card({ children, className, hoverable = false, padded = true, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-card",
        hoverable && "transition-shadow duration-200 hover:shadow-card-hover",
        padded && "p-5 sm:p-6",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-[15px] font-semibold text-ink", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-1 text-[13px] text-ink-soft", className)}>{children}</p>;
}
