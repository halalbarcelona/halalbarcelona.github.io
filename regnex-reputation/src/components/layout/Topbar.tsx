import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { NAV_ITEMS } from "./navItems";
import { useAppStore } from "@/store/useAppStore";
import { DemoModeBadge } from "@/components/ui/DemoModeBadge";

export function Topbar() {
  const location = useLocation();
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const current = NAV_ITEMS.find((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
  );

  return (
    <div className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 sm:px-6 lg:px-8">
      <p className="text-[13px] font-medium text-ink-faint">{current?.label ?? "Regnex Reputation"}</p>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex">
          <DemoModeBadge label="Datos de demostración" />
        </span>
        <Link
          to="/notificaciones"
          aria-label="Notificaciones"
          className="relative rounded-lg p-2 text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <Bell width={18} height={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
