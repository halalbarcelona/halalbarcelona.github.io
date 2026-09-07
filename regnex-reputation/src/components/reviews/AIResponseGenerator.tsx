import { useEffect, useState } from "react";
import { Check, Copy, Pencil, Sparkles, RotateCw } from "lucide-react";
import type { Review } from "@/types";
import { aiProvider } from "@/lib/ai";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { DemoModeBadge } from "@/components/ui/DemoModeBadge";
import { useToast } from "@/components/ui/Toast";
import { formatDateTimeEs } from "@/lib/utils/date";

export function AIResponseGenerator({ review }: { review: Review }) {
  const tone = useAppStore((s) => s.responsePreferences.tone);
  const setReviewDraft = useAppStore((s) => s.setReviewDraft);
  const approveReviewResponse = useAppStore((s) => s.approveReviewResponse);
  const { showToast } = useToast();

  const [variant, setVariant] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(
    review.approvedResponse ?? review.aiResponseDraft ?? aiProvider.generateReviewResponse(review, { tone, variant: 0 })
  );

  useEffect(() => {
    if (!review.aiResponseDraft && !review.approvedResponse) {
      setReviewDraft(review.id, draftText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isApproved = review.responseStatus === "respondida";

  const handleRegenerate = () => {
    const nextVariant = variant + 1;
    setVariant(nextVariant);
    const text = aiProvider.generateReviewResponse(review, { tone, variant: nextVariant });
    setDraftText(text);
    setReviewDraft(review.id, text);
    showToast("Se ha generado una nueva propuesta de respuesta.", "info");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      showToast("Respuesta copiada al portapapeles.");
    } catch {
      showToast("No se pudo copiar automáticamente. Selecciona el texto manualmente.", "warning");
    }
  };

  const handleApprove = () => {
    approveReviewResponse(review.id, draftText);
    setIsEditing(false);
    showToast(
      "Respuesta marcada como aprobada. En modo demostración no se publica en Google.",
      "success"
    );
  };

  return (
    <div className="rounded-xl border border-line bg-surface-muted/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-800 text-accent-400">
            <Sparkles width={14} height={14} />
          </span>
          <span className="text-[13.5px] font-semibold text-ink">Respuesta sugerida por IA</span>
        </div>
        <DemoModeBadge />
      </div>

      {isApproved && !isEditing ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-success-bg bg-success-bg/60 px-3.5 py-3">
            <p className="text-[13.5px] leading-relaxed text-ink">{draftText}</p>
          </div>
          <p className="flex items-center gap-1.5 text-[12px] text-success">
            <Check width={13} height={13} />
            Aprobada el {review.respondedAt ? formatDateTimeEs(review.respondedAt) : ""} · no publicada en Google (modo demostración)
          </p>
          <Button variant="secondary" size="sm" icon={<Pencil width={13} height={13} />} onClick={() => setIsEditing(true)}>
            Editar respuesta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {isEditing ? (
            <textarea
              value={draftText}
              onChange={(e) => {
                setDraftText(e.target.value);
                setReviewDraft(review.id, e.target.value);
              }}
              rows={5}
              className="w-full rounded-lg border border-line bg-surface p-3 text-[13.5px] leading-relaxed text-ink focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
              autoFocus
            />
          ) : (
            <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
              <p className="text-[13.5px] leading-relaxed text-ink">{draftText}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<RotateCw width={13} height={13} />} onClick={handleRegenerate}>
              Regenerar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil width={13} height={13} />}
              onClick={() => setIsEditing((v) => !v)}
            >
              {isEditing ? "Vista previa" : "Editar"}
            </Button>
            <Button variant="secondary" size="sm" icon={<Copy width={13} height={13} />} onClick={handleCopy}>
              Copiar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Check width={13} height={13} />}
              onClick={handleApprove}
              className="ml-auto"
            >
              Marcar como aprobada
            </Button>
          </div>

          <p className="text-[12px] leading-relaxed text-ink-faint">
            Modo demostración: al aprobar, la respuesta queda guardada en Regnex Reputation pero{" "}
            <strong className="font-medium text-ink-soft">no se publica en Google</strong> hasta que conectes tu
            perfil de Google Business en Configuración.
          </p>
        </div>
      )}
    </div>
  );
}
