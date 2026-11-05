import { dateKey } from "./seed";

function localDate(key: string) {
  const date = new Date(`${key}T12:00:00`);
  if (!Number.isFinite(date.getTime()) || dateKey(date) !== key) throw new Error("Invalid calendar date");
  return date;
}
export function historyYears(registeredAt?: string, now = new Date()): number[] {
  if (!registeredAt) return [];
  const registered = new Date(registeredAt);
  if (!Number.isFinite(registered.getTime()) || registered > now) return [];
  const anniversary = new Date(registered);
  anniversary.setFullYear(anniversary.getFullYear() + 1);
  if (now <= anniversary) return [];
  return Array.from({ length: now.getFullYear() - registered.getFullYear() + 1 }, (_, index) => now.getFullYear() - index);
}
export function historyWindow(today: string, weeks: number, year: number | null = null) {
  if (![8,16,26,52].includes(weeks)) throw new Error("Invalid week range");
  const current = localDate(today);
  let start = new Date(current), last = new Date(current);
  let visibleStart: string, visibleEnd: string;
  if (year !== null) {
    if (!Number.isInteger(year) || year < 1000 || year > current.getFullYear()) throw new Error("Invalid history year");
    start = localDate(`${year}-01-01`); last = localDate(`${year}-12-31`);
    visibleStart = dateKey(start); visibleEnd = dateKey(last) < today ? dateKey(last) : today;
    start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    last.setDate(last.getDate() + 6 - (last.getDay() + 6) % 7);
  } else {
    start.setDate(start.getDate() - (start.getDay() + 6) % 7 - (weeks - 1) * 7);
    last = new Date(start); last.setDate(start.getDate() + weeks * 7 - 1);
    visibleStart = dateKey(start); visibleEnd = today;
  }
  const days: string[] = [];
  for (const day = new Date(start); day <= last; day.setDate(day.getDate() + 1)) days.push(dateKey(day));
  return { days, columns: days.length / 7, visibleStart, visibleEnd };
}
export function historyGeometry(width: number, referenceColumns: number, referenceGap: number, columns: number) {
  const referenceCell = Math.max(1, (width - (referenceColumns - 1) * referenceGap) / referenceColumns);
  const gap = Math.min(referenceGap, width / (columns * 3));
  const cell = Math.max(1, Math.min(referenceCell, (width - (columns - 1) * gap) / columns));
  return { height: referenceCell * 7 + referenceGap * 6, cell, gap };
}
