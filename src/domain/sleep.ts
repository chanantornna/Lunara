/**
 * Compute hours slept between a bedtime and wake time (HH:mm strings).
 * Handles crossing midnight (e.g. 23:30 → 06:30 = 7h). Returns 0 on bad input.
 */
export function sleepHours(bedtime: string, wake: string): number {
  const b = parseHHmm(bedtime);
  const w = parseHHmm(wake);
  if (b == null || w == null) return 0;
  let diff = w - b;
  if (diff <= 0) diff += 24 * 60; // crossed midnight
  return +(diff / 60).toFixed(1);
}

function parseHHmm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export const SHORT_SLEEP_THRESHOLD = 6; // hours
