/** Utilidades de fecha. Trabajamos con `date` de Postgres = string "YYYY-MM-DD". */

const FMT_LARGA = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const FMT_MES = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
});

/** Parsea "YYYY-MM-DD" como fecha local (sin corrimiento de zona horaria). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function formatFecha(iso: string): string {
  return FMT_LARGA.format(parseISODate(iso));
}

export function formatMes(year: number, month0: number): string {
  return FMT_MES.format(new Date(year, month0, 1));
}

export const WEEKDAYS_MON = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export type MonthCell = { iso: string; day: number; inMonth: boolean };

/** Grilla de 6×7 celdas para un mes, empezando en lunes. */
export function buildMonthGrid(year: number, month0: number): MonthCell[] {
  const first = new Date(year, month0, 1);
  const startOffset = (first.getDay() + 6) % 7; // lunes = 0
  const start = new Date(year, month0, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { iso: toISODate(d), day: d.getDate(), inMonth: d.getMonth() === month0 };
  });
}

export function addMonths(year: number, month0: number, delta: number) {
  const d = new Date(year, month0 + delta, 1);
  return { year: d.getFullYear(), month0: d.getMonth() };
}
