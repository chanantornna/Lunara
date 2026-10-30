import type { Workout } from '@/db/db';
import { daysBetween } from '@/lib/date';

export const DEFAULT_WEEKLY_GOAL_MIN = 150; // WHO general guidance

// Rough MET values by activity type (approximate; for estimation only).
const MET: Record<string, number> = {
  walk: 3.5,
  run: 9.0,
  yoga: 3.0,
  weights: 5.0,
  swim: 7.0,
  cycling: 7.5,
  other: 4.0,
};

const INTENSITY_FACTOR = { low: 0.85, medium: 1, high: 1.2 } as const;

/**
 * Estimated calories burned = MET * weightKg * hours * intensityFactor.
 * Returns 0 when inputs are insufficient. This is an ESTIMATE only.
 */
export function estimateWorkoutCalories(
  type: string,
  minutes: number,
  weightKg: number,
  intensity: 'low' | 'medium' | 'high' = 'medium'
): number {
  if (!minutes || !weightKg) return 0;
  const met = MET[type] ?? MET.other;
  const hours = minutes / 60;
  return Math.round(met * weightKg * hours * INTENSITY_FACTOR[intensity]);
}

export interface WeeklySummary {
  totalMinutes: number;
  totalCalories: number;
  sessions: number;
  goalMinutes: number;
  goalMet: boolean;
  progressPct: number; // 0-100+
}

/** Summarize workouts within the last 7 days (inclusive of today). */
export function weeklyWorkoutSummary(
  workouts: Workout[],
  today: string,
  goalMinutes = DEFAULT_WEEKLY_GOAL_MIN
): WeeklySummary {
  const recent = workouts.filter((w) => {
    const diff = daysBetween(today, w.date);
    return diff >= 0 && diff < 7;
  });
  const totalMinutes = recent.reduce((s, w) => s + (w.minutes ?? 0), 0);
  const totalCalories = recent.reduce((s, w) => s + (w.calories ?? 0), 0);
  const progressPct = goalMinutes
    ? Math.round((totalMinutes / goalMinutes) * 100)
    : 0;
  return {
    totalMinutes,
    totalCalories,
    sessions: recent.length,
    goalMinutes,
    goalMet: totalMinutes >= goalMinutes,
    progressPct,
  };
}
