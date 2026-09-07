import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-lg border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-ink-faint",
        "focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100",
        className
      )}
      {...rest}
    />
  )
);

Input.displayName = "Input";
