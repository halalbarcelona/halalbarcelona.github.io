import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./navItems";
import { cn } from "@/lib/utils/cn";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="flex h-14 items-center justify-between border-b border-line bg-surface px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-800 text-xs font-bold text-accent-400">
            R
          </span>
          <p className="text-[13px] font-semibold text-ink">Regnex Reputation</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-md p-2 text-ink-soft hover:bg-surface-muted"
        >
          <Menu width={20} height={20} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-brand-800 shadow-popover animate-fade-up">
            <div className="flex h-14 items-center justify-between px-4">
              <p className="text-[13px] font-semibold text-white">Menú</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white"
              >
                <X width={18} height={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 px-3 py-2">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-medium transition-colors",
                      isActive ? "bg-white/10 text-white" : "text-brand-200 hover:bg-white/5 hover:text-white"
                    )
                  }
                >
                  <Icon width={18} height={18} strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
