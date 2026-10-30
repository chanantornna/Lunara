import type { Meal, WaterLog } from '@/db/db';

export const DEFAULT_WATER_GOAL_ML = 2000;

/** Scale a food's nutrition by a portion multiplier, rounded. */
export function scalePortion(
  base: { calories: number; protein: number; carbs: number; fat: number },
  portion: number
) {
  return {
    calories: Math.round(base.calories * portion),
    protein: Math.round(base.protein * portion),
    carbs: Math.round(base.carbs * portion),
    fat: Math.round(base.fat * portion),
  };
}

export interface DayNutrition {
  eaten: number; // kcal
  protein: number;
  carbs: number;
  fat: number;
  burned: number; // kcal from workouts
  target: number; // safe calorie target
  net: number; // eaten - burned
  remaining: number; // target - net
}

/**
 * Summarize a day's intake vs target vs burned.
 * `target` should already be the safe target (>= max(BMR, 1200)).
 */
export function summarizeDay(
  meals: Meal[],
  burned: number,
  target: number
): DayNutrition {
  const eaten = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const protein = meals.reduce((s, m) => s + (m.protein ?? 0), 0);
  const carbs = meals.reduce((s, m) => s + (m.carbs ?? 0), 0);
  const fat = meals.reduce((s, m) => s + (m.fat ?? 0), 0);
  const net = eaten - burned;
  return {
    eaten,
    protein,
    carbs,
    fat,
    burned,
    target,
    net,
    remaining: target - net,
  };
}

/** Total water for a day in ml. */
export function totalWater(logs: WaterLog[]): number {
  return logs.reduce((s, w) => s + (w.ml ?? 0), 0);
}
