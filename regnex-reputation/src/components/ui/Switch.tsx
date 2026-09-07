import { cn } from "@/lib/utils/cn";

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
}

export function Switch({ checked, onChange, disabled, label, description }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-800" : "bg-line",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
