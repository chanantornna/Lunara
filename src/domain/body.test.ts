import { describe, it, expect } from 'vitest';
import {
  calcBMI,
  bmiCategory,
  ageFromBirthDate,
  calcBMR,
  calcTDEE,
  safeCalorieTarget,
  MIN_SAFE_CALORIES,
} from './body';

describe('calcBMI', () => {
  it('computes kg/m^2 rounded to 1 decimal', () => {
    expect(calcBMI(60, 165)).toBe(22);
    expect(calcBMI(55, 160)).toBe(21.5);
  });
  it('returns 0 on invalid input', () => {
    expect(calcBMI(0, 165)).toBe(0);
    expect(calcBMI(60, 0)).toBe(0);
  });
});

describe('bmiCategory', () => {
  it('maps ranges', () => {
    expect(bmiCategory(17)).toBe('underweight');
    expect(bmiCategory(22)).toBe('normal');
    expect(bmiCategory(27)).toBe('overweight');
    expect(bmiCategory(32)).toBe('obese');
    expect(bmiCategory(0)).toBe('unknown');
  });
});

describe('ageFromBirthDate', () => {
  it('computes whole years before birthday not yet reached', () => {
    expect(ageFromBirthDate('2000-12-31', new Date('2026-06-01'))).toBe(25);
  });
  it('computes whole years after birthday', () => {
    expect(ageFromBirthDate('2000-01-01', new Date('2026-06-01'))).toBe(26);
  });
  it('0 when missing', () => {
    expect(ageFromBirthDate(undefined)).toBe(0);
  });
});

describe('calcBMR (Mifflin-St Jeor, female default)', () => {
  it('matches known value', () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
    expect(calcBMR(60, 165, 30)).toBe(1320);
  });
  it('male variant adds 5 instead of -161', () => {
    expect(calcBMR(60, 165, 30, 'male')).toBe(1486);
  });
});

describe('calcTDEE', () => {
  it('applies activity factor', () => {
    expect(calcTDEE(1320, 'sedentary')).toBe(1584);
    expect(calcTDEE(1320, 'moderate')).toBe(2046);
  });
});

describe('safeCalorieTarget', () => {
  it('applies a modest deficit for weight loss', () => {
    expect(safeCalorieTarget(2000, 'lose', 1320)).toBe(1600);
  });
  it('never drops below BMR', () => {
    expect(safeCalorieTarget(1500, 'lose', 1400)).toBe(1400);
  });
  it('never drops below the 1200 kcal floor', () => {
    expect(safeCalorieTarget(1300, 'lose', 1000)).toBe(MIN_SAFE_CALORIES);
  });
  it('adds a surplus for gain', () => {
    expect(safeCalorieTarget(2000, 'gain', 1320)).toBe(2300);
  });
});
