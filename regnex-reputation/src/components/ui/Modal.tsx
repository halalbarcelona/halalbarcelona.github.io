import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
}

export function Modal({ open, onClose, title, description, children, footer, maxWidthClassName = "max-w-md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px] animate-fade-up"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full rounded-2xl border border-line bg-surface p-6 shadow-popover animate-fade-up",
          maxWidthClassName
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-ink-soft">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X width={18} height={18} />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
