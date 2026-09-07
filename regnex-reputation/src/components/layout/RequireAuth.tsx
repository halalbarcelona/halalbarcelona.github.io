import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
