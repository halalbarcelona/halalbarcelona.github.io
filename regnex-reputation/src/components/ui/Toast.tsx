import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastTone = "success" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
};

const TONE_CLASSES: Record<ToastTone, string> = {
  success: "text-success",
  info: "text-brand-500",
  warning: "text-warning",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((t) => {
          const Icon = TONE_ICON[t.tone];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 shadow-popover animate-toast-in"
            >
              <Icon width={18} height={18} className={cn("mt-0.5 shrink-0", TONE_CLASSES[t.tone])} />
              <p className="flex-1 text-[13px] leading-snug text-ink">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="shrink-0 text-ink-faint hover:text-ink"
              >
                <X width={14} height={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
