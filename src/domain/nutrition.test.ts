import { describe, it, expect } from 'vitest';
import type { Meal, WaterLog } from '@/db/db';
import { scalePortion, summarizeDay, totalWater } from './nutrition';

describe('scalePortion', () => {
  it('scales and rounds', () => {
    expect(scalePortion({ calories: 160, protein: 3, carbs: 35, fat: 0 }, 1.5)).toEqual(
      { calories: 240, protein: 5, carbs: 53, fat: 0 }
    );
  });
});

function meal(calories: number, protein = 0, carbs = 0, fat = 0): Meal {
  return { date: '2026-02-10', name: 'x', calories, protein, carbs, fat };
}

describe('summarizeDay', () => {
  it('sums intake and computes net/remaining', () => {
    const meals = [meal(500, 20, 60, 15), meal(300, 10, 40, 8)];
    const s = summarizeDay(meals, 200, 1800);
    expect(s.eaten).toBe(800);
    expect(s.protein).toBe(30);
    expect(s.burned).toBe(200);
    expect(s.net).toBe(600); // 800 - 200
    expect(s.remaining).toBe(1200); // 1800 - 600
  });
  it('handles an empty day', () => {
    const s = summarizeDay([], 0, 1500);
    expect(s.eaten).toBe(0);
    expect(s.remaining).toBe(1500);
  });
});

describe('totalWater', () => {
  it('sums ml', () => {
    const logs: WaterLog[] = [
      { date: '2026-02-10', ml: 250 },
      { date: '2026-02-10', ml: 500 },
    ];
    expect(totalWater(logs)).toBe(750);
  });
});
