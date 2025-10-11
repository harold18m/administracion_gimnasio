import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilities de fechas robustos para evitar desfase de un día por zonas horarias
// Parsean la parte de fecha (YYYY-MM-DD) en horario local, ignorando la zona horaria del string
export function parseISODateToLocal(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // Extraer sólo la parte YYYY-MM-DD del string
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    // Fallback: intentar new Date convencional
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  const [_, y, m, d] = match;
  // Crear fecha en horario local (Date(year, monthIndex, day))
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function formatISODate(
  dateStr: string | null | undefined,
  locale: string = "es-ES",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseISODateToLocal(dateStr);
  if (!d) return "";
  return d.toLocaleDateString(locale, options);
}

export function diffDaysFromTodayLocal(dateStr: string | null | undefined): number | null {
  const end = parseISODateToLocal(dateStr);
  if (!end) return null;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((startOfEnd.getTime() - startOfToday.getTime()) / msPerDay);
}
