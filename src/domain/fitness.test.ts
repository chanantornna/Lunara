import { describe, it, expect } from 'vitest';
import type { Workout } from '@/db/db';
import {
  estimateWorkoutCalories,
  weeklyWorkoutSummary,
  DEFAULT_WEEKLY_GOAL_MIN,
} from './fitness';

describe('estimateWorkoutCalories', () => {
  it('uses MET * weight * hours * intensity', () => {
    // run MET 9, 60kg, 30min=0.5h, medium=1 -> 9*60*0.5 = 270
    expect(estimateWorkoutCalories('run', 30, 60, 'medium')).toBe(270);
  });
  it('applies intensity factor', () => {
    expect(estimateWorkoutCalories('run', 30, 60, 'high')).toBe(324);
    expect(estimateWorkoutCalories('run', 30, 60, 'low')).toBe(230); // 270*0.85=229.5->230
  });
  it('falls back to "other" MET for unknown type', () => {
    // other MET 4, 60kg, 1h -> 240
    expect(estimateWorkoutCalories('dance', 60, 60, 'medium')).toBe(240);
  });
  it('returns 0 on missing input', () => {
    expect(estimateWorkoutCalories('run', 0, 60)).toBe(0);
    expect(estimateWorkoutCalories('run', 30, 0)).toBe(0);
  });
});

function w(date: string, minutes: number, calories = 0): Workout {
  return { date, minutes, calories };
}

describe('weeklyWorkoutSummary', () => {
  const today = '2026-02-10';
  it('sums only the last 7 days', () => {
    const workouts = [
      w('2026-02-10', 30, 200),
      w('2026-02-07', 45, 300),
      w('2026-02-04', 60, 400), // 6 days ago -> included
      w('2026-02-03', 60, 400), // 7 days ago -> excluded
    ];
    const s = weeklyWorkoutSummary(workouts, today);
    expect(s.totalMinutes).toBe(135);
    expect(s.totalCalories).toBe(900);
    expect(s.sessions).toBe(3);
  });
  it('flags goal met and progress', () => {
    const workouts = [w('2026-02-10', 150, 0)];
    const s = weeklyWorkoutSummary(workouts, today);
    expect(s.goalMinutes).toBe(DEFAULT_WEEKLY_GOAL_MIN);
    expect(s.goalMet).toBe(true);
    expect(s.progressPct).toBe(100);
  });
  it('reports under-goal progress', () => {
    const s = weeklyWorkoutSummary([w('2026-02-10', 75, 0)], today);
    expect(s.goalMet).toBe(false);
    expect(s.progressPct).toBe(50);
  });
});
