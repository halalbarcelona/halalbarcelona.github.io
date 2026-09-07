import { useNavigate } from "react-router-dom";
import { BellOff, CheckCheck, FileText, MessageSquarePlus, TriangleAlert } from "lucide-react";
import type { AppNotification, NotificationType } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeEs } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: typeof MessageSquarePlus }> = {
  nueva_resena: { label: "Nueva reseña", icon: MessageSquarePlus },
  resena_negativa: { label: "Reseña negativa", icon: TriangleAlert },
  requiere_atencion: { label: "Requiere atención", icon: TriangleAlert },
  informe_semanal: { label: "Informe semanal", icon: FileText },
};

function NotificationRow({ notification }: { notification: AppNotification }) {
  const navigate = useNavigate();
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const { label, icon: Icon } = TYPE_CONFIG[notification.type];

  const handleClick = () => {
    markNotificationRead(notification.id);
    if (notification.reviewId) {
      navigate(`/resenas?review=${notification.reviewId}`);
    } else if (notification.type === "informe_semanal") {
      navigate("/informe-semanal");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-surface-muted sm:px-5",
        !notification.read && "bg-accent-50/40"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          notification.priority === "urgente"
            ? "bg-danger-bg text-danger"
            : notification.priority === "atencion"
              ? "bg-warning-bg text-warning"
              : "bg-brand-50 text-brand-700"
        )}
      >
        <Icon width={16} height={16} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13.5px] font-semibold text-ink">{notification.title}</p>
          {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{notification.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-ink-faint">{label}</span>
          <span className="text-ink-faint">·</span>
          <span className="text-[11.5px] text-ink-faint">{formatRelativeEs(notification.timestamp)}</span>
          {notification.priority !== "normal" && <PriorityBadge priority={notification.priority} />}
        </div>
      </div>
    </button>
  );
}

export function Notifications() {
  const notifications = useAppStore((s) => s.notifications);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const sorted = [...notifications].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Notificaciones</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-soft">
            {unreadCount > 0 ? `${unreadCount} sin leer` : "Estás al día"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" icon={<CheckCheck width={14} height={14} />} onClick={markAllNotificationsRead}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <Card padded={false}>
        {sorted.length === 0 ? (
          <EmptyState icon={<BellOff width={22} height={22} />} title="No hay notificaciones" />
        ) : (
          <div className="divide-y divide-line-soft">
            {sorted.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
