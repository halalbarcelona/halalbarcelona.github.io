import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Side panel on desktop/tablet, full-screen panel on mobile. */
export function Drawer({ open, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-surface shadow-popover animate-fade-up sm:m-3 sm:h-[calc(100%-24px)] sm:rounded-2xl sm:border sm:border-line">
        <button
          onClick={onClose}
          aria-label="Cerrar panel"
          className="absolute right-4 top-4 z-10 rounded-md bg-surface p-1.5 text-ink-faint shadow-card transition-colors hover:bg-surface-muted hover:text-ink sm:right-5 sm:top-5"
        >
          <X width={18} height={18} />
        </button>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
