import type {
  Period,
  CyclePhase,
  Regularity,
  PregnancyChance,
  FertileWindow,
} from './types';
import { daysBetween, addDaysISO, toISO } from '@/lib/date';

export const DEFAULT_CYCLE_LENGTH = 28;
export const LUTEAL_PHASE_LENGTH = 14; // ovulation ≈ nextPeriod - 14

/** Sort periods ascending by start date and return ISO start strings. */
export function sortedStarts(periods: Period[]): string[] {
  return periods
    .map((p) => p.startDate)
    .filter(Boolean)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Lengths (days) between consecutive period starts. Needs >= 2 periods. */
export function getCycleLengths(periods: Period[]): number[] {
  const starts = sortedStarts(periods);
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetween(starts[i], starts[i - 1]);
    if (len > 0) lengths.push(len);
  }
  return lengths;
}

/** Average cycle length, falling back to default when insufficient data. */
export function getAverageCycleLength(
  periods: Period[],
  fallback = DEFAULT_CYCLE_LENGTH,
  override?: number
): number {
  if (override && override >= 15 && override <= 60) return override;
  const lengths = getCycleLengths(periods);
  if (lengths.length === 0) return fallback;
  const sum = lengths.reduce((a, b) => a + b, 0);
  return Math.round(sum / lengths.length);
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Regularity based on spread of cycle lengths and whether any cycle falls
 * outside a typical 21–35 day range.
 */
export function getCycleRegularity(periods: Period[]): Regularity {
  const lengths = getCycleLengths(periods);
  if (lengths.length < 2) return 'unknown';
  const sd = standardDeviation(lengths);
  const anyOutOfRange = lengths.some((l) => l < 21 || l > 35);
  if (sd <= 4 && !anyOutOfRange) return 'regular';
  return 'irregular';
}

/** Predict next period start (ISO). Null if no periods recorded. */
export function predictNextPeriod(
  periods: Period[],
  avgLen = DEFAULT_CYCLE_LENGTH
): string | null {
  const starts = sortedStarts(periods);
  if (starts.length === 0) return null;
  const last = starts[starts.length - 1];
  return addDaysISO(last, avgLen);
}

/**
 * Current cycle day (1-based) relative to the most recent period start on or
 * before `today`. Null if none.
 */
export function getCurrentCycleDay(
  periods: Period[],
  today: string
): number | null {
  const starts = sortedStarts(periods).filter((s) => s <= today);
  if (starts.length === 0) return null;
  const last = starts[starts.length - 1];
  return daysBetween(today, last) + 1;
}

/**
 * Fertile window estimate. Returns null (with no window) when on birth control
 * — ovulation prediction does not apply in the usual way.
 */
export function getFertileWindow(
  periods: Period[],
  avgLen = DEFAULT_CYCLE_LENGTH,
  opts: { onBirthControl?: boolean; hasEggwhiteDischargeToday?: boolean } = {}
): FertileWindow | null {
  if (opts.onBirthControl) return null;
  const next = predictNextPeriod(periods, avgLen);
  if (!next) return null;

  let ovulation = addDaysISO(next, -LUTEAL_PHASE_LENGTH);
  let adjustedByDischarge = false;

  // Eggwhite-type discharge is a near-ovulation signal; nudge the window to
  // start today if that produces a (slightly) earlier fertile start.
  const fertileStartBase = addDaysISO(ovulation, -5);
  const fertileEnd = addDaysISO(ovulation, 1);
  let fertileStart = fertileStartBase;
  if (opts.hasEggwhiteDischargeToday) {
    adjustedByDischarge = true;
  }

  return { ovulation, fertileStart, fertileEnd, adjustedByDischarge };
}

/** Rough pregnancy chance (ESTIMATE). Never claims a "safe" window. */
export function getPregnancyChance(
  today: string,
  window: FertileWindow | null
): PregnancyChance {
  if (!window) return 'unknown';
  if (today >= window.fertileStart && today <= window.fertileEnd) return 'high';
  return 'low';
}

/** Phase of the current cycle. */
export function getCyclePhase(
  cycleDay: number | null,
  avgLen = DEFAULT_CYCLE_LENGTH,
  periodLength = 5
): CyclePhase | null {
  if (cycleDay == null || cycleDay < 1) return null;
  const ovulationDay = avgLen - LUTEAL_PHASE_LENGTH;
  if (cycleDay <= periodLength) return 'menstrual';
  if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1)
    return 'ovulation';
  if (cycleDay < ovulationDay - 1) return 'follicular';
  return 'luteal';
}

/** Days until the next predicted period (negative = late). Null if unknown. */
export function daysUntilNextPeriod(
  periods: Period[],
  today: string,
  avgLen = DEFAULT_CYCLE_LENGTH
): number | null {
  const next = predictNextPeriod(periods, avgLen);
  if (!next) return null;
  return daysBetween(next, today);
}

export { toISO };
