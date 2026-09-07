import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-800 text-white hover:bg-brand-900 active:bg-brand-900 disabled:bg-brand-200",
  secondary:
    "bg-surface text-ink border border-line hover:bg-surface-muted active:bg-surface-muted disabled:text-ink-faint",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-muted active:bg-surface-muted",
  danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/90 disabled:bg-danger/40",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, loading, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150",
          "disabled:cursor-not-allowed",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...rest}
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
