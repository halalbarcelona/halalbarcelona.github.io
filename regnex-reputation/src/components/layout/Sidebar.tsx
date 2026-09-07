import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "./navItems";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/store/useAppStore";

export function Sidebar() {
  const logout = useAppStore((s) => s.logout);
  const restaurantName = useAppStore((s) => s.restaurantProfile.name);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-brand-800 lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-400 text-sm font-bold text-brand-900">
          R
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold text-white">Regnex Reputation</p>
          <p className="text-[11px] text-brand-300">Regnex AI</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                isActive ? "bg-white/10 text-white" : "text-brand-200 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <Icon width={17} height={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[12px] font-semibold text-white">
            {restaurantName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium text-white">{restaurantName}</p>
            <p className="text-[11px] text-brand-300">Cuenta de demostración</p>
          </div>
          <button
            onClick={logout}
            aria-label="Salir"
            className="shrink-0 rounded-md p-1.5 text-brand-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut width={15} height={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
