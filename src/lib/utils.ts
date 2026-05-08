import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  format,
} from 'date-fns';

export function formatHours(hours: number): string {
  if (hours === 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':');
}

export function getWeekDates(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthWeeks(date: Date): Date[][] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  return weekStarts.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const clampedEnd = weekEnd > end ? end : weekEnd;
    const clampedStart = weekStart < start ? start : weekStart;
    return eachDayOfInterval({ start: clampedStart, end: clampedEnd });
  });
}

export function hoursToDecimal(h: number, m: number): number {
  return Math.round((h + m / 60) * 100) / 100;
}

export function formatDateLabel(date: Date): string {
  return format(date, 'MMM d');
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
