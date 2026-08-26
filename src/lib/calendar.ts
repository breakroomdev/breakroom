/** Small date-string helpers for the schedule calendar. All dates are "YYYY-MM-DD" in local time. */

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(s: string): Date {
  const [year, month, day] = s.split("-").map(Number);
  return new Date(year!, (month ?? 1) - 1, day ?? 1);
}

export function addDays(s: string, days: number): string {
  const d = fromISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function startOfWeek(s: string): string {
  const d = fromISODate(s);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return toISODate(d);
}

export function startOfMonth(s: string): string {
  const d = fromISODate(s);
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(s: string): string {
  const d = fromISODate(s);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function addMonths(s: string, months: number): string {
  const d = fromISODate(s);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + months, 1));
}

/** Returns a 6x7 grid of ISO dates covering the full weeks that overlap the given month. */
export function monthGrid(s: string): string[] {
  const start = startOfWeek(startOfMonth(s));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function weekDays(s: string): string[] {
  const start = startOfWeek(s);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/**
 * Compares against an explicit `today` (rather than calling `new Date()`
 * internally) so this stays deterministic between server render and client
 * hydration — the server and the browser sandbox can disagree on the local
 * timezone, which would otherwise make "today" resolve to different dates.
 */
export function isToday(s: string, today: string): boolean {
  return s === today;
}
