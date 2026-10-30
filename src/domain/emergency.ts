import type { EmergencyPill } from '@/db/db';

export const ECP_WINDOW_HOURS = 72; // effective window (sooner is better)
export const LATE_PERIOD_ALERT_DAYS = 7; // days past prediction → test reminder

/** Count ECP records whose date falls within the given ISO month (yyyy-MM). */
export function countInMonth(records: EmergencyPill[], ym: string): number {
  return records.filter((r) => r.datetime.slice(0, 7) === ym).length;
}

/** Count ECP records within the given ISO year (yyyy). */
export function countInYear(records: EmergencyPill[], y: string): number {
  return records.filter((r) => r.datetime.slice(0, 4) === y).length;
}

/**
 * Should we surface a pregnancy-test reminder? True when the period is at
 * least LATE_PERIOD_ALERT_DAYS late. `daysUntilNext` is negative when late.
 */
export function shouldRemindPregnancyTest(
  daysUntilNextPeriod: number | null
): boolean {
  if (daysUntilNextPeriod == null) return false;
  return daysUntilNextPeriod <= -LATE_PERIOD_ALERT_DAYS;
}

/** Hours remaining in the effectiveness window given hours since unprotected sex. */
export function ecpHoursRemaining(hoursSince: number): number {
  return Math.max(0, ECP_WINDOW_HOURS - hoursSince);
}
