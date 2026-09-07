import {
  Bell,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Resumen", icon: LayoutDashboard },
  { to: "/resenas", label: "Reseñas", icon: MessageSquareText },
  { to: "/alertas", label: "Alertas", icon: TriangleAlert },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/informe-semanal", label: "Informe semanal", icon: FileText },
  { to: "/notificaciones", label: "Notificaciones", icon: Bell },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];
