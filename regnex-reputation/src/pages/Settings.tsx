import { useState } from "react";
import { Link2, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { googleBusinessProfileService } from "@/lib/services/googleBusinessProfileService";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { DemoModeBadge } from "@/components/ui/DemoModeBadge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { ResponseTone } from "@/types";

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-ink-soft">{label}</span>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Settings() {
  const profile = useAppStore((s) => s.restaurantProfile);
  const updateRestaurantProfile = useAppStore((s) => s.updateRestaurantProfile);
  const preferences = useAppStore((s) => s.responsePreferences);
  const updateResponsePreferences = useAppStore((s) => s.updateResponsePreferences);
  const { showToast } = useToast();

  const [form, setForm] = useState(profile);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const connectionState = googleBusinessProfileService.getConnectionState();

  const isDirty = JSON.stringify(form) !== JSON.stringify(profile);

  const handleSaveProfile = () => {
    updateRestaurantProfile(form);
    showToast("Datos del restaurante actualizados.");
  };

  const handleConnectGoogle = async () => {
    try {
      await googleBusinessProfileService.connect();
    } catch {
      setShowGoogleModal(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Configuración</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">Datos del restaurante, conexión con Google y preferencias de IA.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Restaurante</CardTitle>
            <CardDescription>Estos datos aparecen en tus informes y comunicaciones.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Dirección" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        </div>
        <div className="mt-5 flex justify-end">
          <Button size="sm" disabled={!isDirty} onClick={handleSaveProfile}>
            Guardar cambios
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Google Business Profile</CardTitle>
            <CardDescription>La conexión permite leer reseñas reales y publicar respuestas aprobadas.</CardDescription>
          </div>
        </CardHeader>

        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-line-soft bg-surface-muted px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-ink-soft shadow-card">
              <Link2 width={17} height={17} />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-ink">Estado de la conexión</p>
              {connectionState.status === "demo" && <DemoModeBadge label="Modo demostración" />}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleConnectGoogle}>
            Conectar Google Business Profile
          </Button>
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
          Mientras no haya una conexión activa, Regnex Reputation funciona con reseñas de demostración y ninguna
          respuesta se publica en Google.
        </p>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Preferencias de respuestas</CardTitle>
            <CardDescription>Cómo genera Regnex las respuestas sugeridas por IA.</CardDescription>
          </div>
        </CardHeader>

        <div className="mb-5">
          <p className="mb-2 text-[12.5px] font-medium text-ink-soft">Tono de las respuestas</p>
          <div className="flex gap-2">
            {(["cercano", "profesional"] as ResponseTone[]).map((tone) => (
              <button
                key={tone}
                onClick={() => updateResponsePreferences({ tone })}
                className={
                  "rounded-lg border px-4 py-2 text-[13px] font-medium capitalize transition-colors " +
                  (preferences.tone === tone
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-muted")
                }
              >
                {tone === "cercano" ? "Tono cercano" : "Tono profesional"}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-line-soft">
          <Switch
            label="Respuestas automáticas"
            description="Publicar respuestas sin revisión manual. Desactivado mientras el producto está en fase inicial."
            checked={preferences.autoResponsesEnabled}
            disabled
          />
          <Switch
            label="Revisión manual requerida"
            description="Toda respuesta debe aprobarse manualmente antes de considerarse lista para publicar."
            checked={preferences.manualReviewRequired}
            onChange={(v) => updateResponsePreferences({ manualReviewRequired: v })}
          />
          <Switch
            label="Alertas para reseñas de 1–2 estrellas"
            description="Recibir una notificación inmediata cuando llegue una reseña de una o dos estrellas."
            checked={preferences.alertOnLowRating}
            onChange={(v) => updateResponsePreferences({ alertOnLowRating: v })}
          />
        </div>
      </Card>

      <Modal
        open={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        title="Conexión con Google Business Profile"
        description="Esta integración todavía no está activa."
        footer={<Button size="sm" onClick={() => setShowGoogleModal(false)}>Entendido</Button>}
      >
        <div className="flex gap-3 rounded-lg bg-surface-muted p-3.5">
          <ShieldCheck width={18} height={18} className="mt-0.5 shrink-0 text-brand-700" />
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Conectar Google Business Profile requiere autenticación OAuth 2.0 gestionada desde un servidor, para que
            las credenciales nunca viajen al navegador. Esa parte de backend aún no está desplegada para{" "}
            {profile.name}. Cuando lo esté, este botón iniciará el proceso real de conexión.
          </p>
        </div>
      </Modal>
    </div>
  );
}
