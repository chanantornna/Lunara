import {
  format,
  parseISO,
  differenceInCalendarDays,
  addDays,
  startOfDay,
} from 'date-fns';

export const ISO = 'yyyy-MM-dd';

/** Normalize anything date-ish into an ISO yyyy-MM-dd string. */
export function toISO(d: Date | string): string {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, ISO);
}

export function fromISO(iso: string): Date {
  return startOfDay(parseISO(iso));
}

export function todayISO(): string {
  return format(new Date(), ISO);
}

/** Whole-day difference a - b (a later than b => positive). */
export function daysBetween(a: Date | string, b: Date | string): number {
  const da = typeof a === 'string' ? fromISO(a) : startOfDay(a);
  const db = typeof b === 'string' ? fromISO(b) : startOfDay(b);
  return differenceInCalendarDays(da, db);
}

export function addDaysISO(iso: string, days: number): string {
  return toISO(addDays(fromISO(iso), days));
}

export { addDays, differenceInCalendarDays, parseISO, format };
