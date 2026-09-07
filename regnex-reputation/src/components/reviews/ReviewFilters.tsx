import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface ReviewFiltersState {
  search: string;
  rating: "todas" | "5" | "4" | "3" | "2" | "1";
  sentiment: "todas" | "positivo" | "neutral" | "negativo";
  status: "todas" | "sin_responder" | "borrador_generado" | "respondida" | "requiere_revision";
  date: "todas" | "7" | "30" | "90";
}

export const DEFAULT_REVIEW_FILTERS: ReviewFiltersState = {
  search: "",
  rating: "todas",
  sentiment: "todas",
  status: "todas",
  date: "todas",
};

interface ReviewFiltersProps {
  value: ReviewFiltersState;
  onChange: (value: ReviewFiltersState) => void;
  resultCount: number;
}

export function ReviewFilters({ value, onChange, resultCount }: ReviewFiltersProps) {
  const isFiltered = JSON.stringify(value) !== JSON.stringify(DEFAULT_REVIEW_FILTERS);
  const set = <K extends keyof ReviewFiltersState>(key: K, v: ReviewFiltersState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search width={15} height={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <Input
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Buscar por cliente o contenido de la reseña…"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-end">
        <Select label="Valoración" value={value.rating} onChange={(e) => set("rating", e.target.value as any)}>
          <option value="todas">Todas</option>
          <option value="5">5 estrellas</option>
          <option value="4">4 estrellas</option>
          <option value="3">3 estrellas</option>
          <option value="2">2 estrellas</option>
          <option value="1">1 estrella</option>
        </Select>

        <Select label="Sentimiento" value={value.sentiment} onChange={(e) => set("sentiment", e.target.value as any)}>
          <option value="todas">Todos</option>
          <option value="positivo">Positivo</option>
          <option value="neutral">Neutral</option>
          <option value="negativo">Negativo</option>
        </Select>

        <Select label="Estado" value={value.status} onChange={(e) => set("status", e.target.value as any)}>
          <option value="todas">Todos</option>
          <option value="sin_responder">Sin responder</option>
          <option value="borrador_generado">Borrador generado</option>
          <option value="respondida">Respondida</option>
          <option value="requiere_revision">Requiere revisión</option>
        </Select>

        <Select label="Fecha" value={value.date} onChange={(e) => set("date", e.target.value as any)}>
          <option value="todas">Todo el tiempo</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </Select>

        {isFiltered && (
          <button
            onClick={() => onChange(DEFAULT_REVIEW_FILTERS)}
            className="inline-flex h-9 items-center gap-1 self-end rounded-lg px-2 text-[12.5px] font-medium text-ink-faint hover:text-ink"
          >
            <X width={13} height={13} />
            Limpiar filtros
          </button>
        )}
      </div>

      <p className="text-[12.5px] text-ink-faint">
        {resultCount} reseña{resultCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
