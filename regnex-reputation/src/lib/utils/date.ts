const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const WEEKDAYS_LONG = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

export function formatDateEs(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTimeEs(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDateEs(iso)} · ${hh}:${mm}`;
}

export function formatWeekdayEs(iso: string): string {
  const d = new Date(iso);
  return WEEKDAYS_LONG[d.getDay()];
}

/** e.g. "hace 3 horas", "hace 2 días" */
export function formatRelativeEs(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "ahora mismo";
  if (diffMin < 60) return `hace ${diffMin} min`;

  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;

  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) return `hace ${diffWeeks} semana${diffWeeks > 1 ? "s" : ""}`;

  return formatDateEs(iso);
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as first day
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(d: Date, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

export function weekRangeLabelEs(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startLabel = `${weekStart.getDate()}`;
  const endLabel = sameMonth
    ? `${weekEnd.getDate()} ${MONTHS_SHORT[weekEnd.getMonth()]}`
    : `${weekEnd.getDate()} ${MONTHS_SHORT[weekEnd.getMonth()]}`;
  const startFull = sameMonth ? startLabel : `${startLabel} ${MONTHS_SHORT[weekStart.getMonth()]}`;
  return `${startFull}–${endLabel}`;
}

export function isWithinLastDays(iso: string, days: number, now: Date = new Date()): boolean {
  const then = new Date(iso).getTime();
  return now.getTime() - then <= days * 24 * 60 * 60 * 1000;
}
