import type { ActivityLevel, Goal } from './types';

export const MIN_SAFE_CALORIES = 1200;

export type BmiCategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese'
  | 'unknown';

/** BMI = kg / m^2. Returns NaN-safe 0 on invalid input. */
export function calcBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

/** WHO-style BMI category (ESTIMATE; UI uses non-judgmental wording). */
export function bmiCategory(bmi: number): BmiCategory {
  if (!bmi || bmi <= 0) return 'unknown';
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/** Age in whole years from an ISO birth date relative to `on` (default now). */
export function ageFromBirthDate(birthDateISO?: string, on = new Date()): number {
  if (!birthDateISO) return 0;
  const b = new Date(birthDateISO);
  if (Number.isNaN(b.getTime())) return 0;
  let age = on.getFullYear() - b.getFullYear();
  const m = on.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < b.getDate())) age--;
  return Math.max(0, age);
}

/**
 * Mifflin–St Jeor BMR. Defaults to the female equation since Lunara's audience
 * is women; sex kept as a parameter for flexibility.
 */
export function calcBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: 'female' | 'male' = 'female'
): number {
  if (!weightKg || !heightCm || !ageYears) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(base + (sex === 'male' ? 5 : -161));
}

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTDEE(bmr: number, activity: ActivityLevel): number {
  if (!bmr) return 0;
  return Math.round(bmr * ACTIVITY_FACTOR[activity]);
}

/**
 * Safe calorie target. Never returns below max(BMR, MIN_SAFE_CALORIES).
 * Deficit/surplus is modest and clamped.
 */
export function safeCalorieTarget(
  tdee: number,
  goal: Goal,
  bmr: number
): number {
  if (!tdee) return 0;
  let target = tdee;
  if (goal === 'lose') target = tdee - 400;
  else if (goal === 'gain') target = tdee + 300;
  const floor = Math.max(bmr || 0, MIN_SAFE_CALORIES);
  return Math.max(Math.round(target), floor);
}
