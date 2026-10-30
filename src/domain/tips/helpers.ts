import type { Checkin } from '@/domain/types';
import { daysBetween } from '@/lib/date';

/** Check-ins within the last `days` days (inclusive of today). */
export function recentCheckins(
  checkins: Checkin[],
  today: string,
  days: number
): Checkin[] {
  return checkins.filter((c) => {
    const d = daysBetween(today, c.date);
    return d >= 0 && d < days;
  });
}

/** True when a mood value appears in a check-in's moods array. */
export function hasMood(c: Checkin, mood: string): boolean {
  return !!c.moods?.includes(mood);
}

/** Count check-ins in a window that satisfy a predicate. */
export function countWhere(
  checkins: Checkin[],
  today: string,
  days: number,
  pred: (c: Checkin) => boolean
): number {
  return recentCheckins(checkins, today, days).filter(pred).length;
}

/** Number of distinct days in a window with a given discharge type. */
export function dischargeTypeOnDay(c: Checkin): string | undefined {
  return c.discharge?.type;
}
