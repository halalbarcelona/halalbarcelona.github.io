import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, children, ...rest }: SelectProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-[12px] font-medium text-ink-soft">{label}</span>}
      <span className="relative">
        <select
          className={cn(
            "h-9 w-full appearance-none rounded-lg border border-line bg-surface pl-3 pr-8 text-[13px] text-ink",
            "focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100",
            className
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          width={14}
          height={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
      </span>
    </label>
  );
}
