import { describe, it, expect } from 'vitest';
import type { Period } from './types';
import {
  getCycleLengths,
  getAverageCycleLength,
  getCycleRegularity,
  predictNextPeriod,
  getCurrentCycleDay,
  getFertileWindow,
  getPregnancyChance,
  getCyclePhase,
  daysUntilNextPeriod,
  DEFAULT_CYCLE_LENGTH,
} from './cycle';

function periods(...starts: string[]): Period[] {
  return starts.map((startDate) => ({ startDate }));
}

describe('getCycleLengths', () => {
  it('returns gaps between consecutive starts', () => {
    expect(getCycleLengths(periods('2026-01-01', '2026-01-29', '2026-02-26')))
      .toEqual([28, 28]);
  });
  it('returns empty with fewer than 2 periods', () => {
    expect(getCycleLengths(periods('2026-01-01'))).toEqual([]);
  });
  it('ignores order of input', () => {
    expect(getCycleLengths(periods('2026-02-26', '2026-01-01', '2026-01-29')))
      .toEqual([28, 28]);
  });
});

describe('getAverageCycleLength', () => {
  it('falls back to default with no data', () => {
    expect(getAverageCycleLength([])).toBe(DEFAULT_CYCLE_LENGTH);
  });
  it('averages and rounds', () => {
    // gaps: 28, 30 -> avg 29
    expect(getAverageCycleLength(periods('2026-01-01', '2026-01-29', '2026-02-28')))
      .toBe(29);
  });
  it('honors a valid override', () => {
    expect(getAverageCycleLength([], 28, 30)).toBe(30);
  });
  it('ignores an out-of-range override', () => {
    expect(getAverageCycleLength([], 28, 5)).toBe(28);
  });
});

describe('getCycleRegularity', () => {
  it('unknown with insufficient data', () => {
    expect(getCycleRegularity(periods('2026-01-01'))).toBe('unknown');
  });
  it('regular when tight spread and in range', () => {
    expect(
      getCycleRegularity(periods('2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26'))
    ).toBe('regular');
  });
  it('irregular when a cycle is out of 21-35 range', () => {
    // gaps: 28, 40
    expect(
      getCycleRegularity(periods('2026-01-01', '2026-01-29', '2026-03-10'))
    ).toBe('irregular');
  });
});

describe('predictNextPeriod', () => {
  it('null with no periods', () => {
    expect(predictNextPeriod([])).toBeNull();
  });
  it('adds avg length to last start', () => {
    expect(predictNextPeriod(periods('2026-01-01'), 28)).toBe('2026-01-29');
  });
});

describe('getCurrentCycleDay', () => {
  it('is 1-based from last start on/before today', () => {
    expect(getCurrentCycleDay(periods('2026-01-01'), '2026-01-01')).toBe(1);
    expect(getCurrentCycleDay(periods('2026-01-01'), '2026-01-14')).toBe(14);
  });
  it('null when no period on/before today', () => {
    expect(getCurrentCycleDay(periods('2026-02-01'), '2026-01-15')).toBeNull();
  });
});

describe('getFertileWindow', () => {
  it('null when on birth control', () => {
    expect(
      getFertileWindow(periods('2026-01-01'), 28, { onBirthControl: true })
    ).toBeNull();
  });
  it('centers ovulation ~14 days before next period', () => {
    // next period = 2026-01-29, ovulation = 2026-01-15
    const w = getFertileWindow(periods('2026-01-01'), 28);
    expect(w?.ovulation).toBe('2026-01-15');
    expect(w?.fertileStart).toBe('2026-01-10');
    expect(w?.fertileEnd).toBe('2026-01-16');
  });
  it('flags adjustment when eggwhite discharge present', () => {
    const w = getFertileWindow(periods('2026-01-01'), 28, {
      hasEggwhiteDischargeToday: true,
    });
    expect(w?.adjustedByDischarge).toBe(true);
  });
});

describe('getPregnancyChance', () => {
  it('unknown without a window', () => {
    expect(getPregnancyChance('2026-01-15', null)).toBe('unknown');
  });
  it('high inside the fertile window', () => {
    const w = getFertileWindow(periods('2026-01-01'), 28)!;
    expect(getPregnancyChance('2026-01-15', w)).toBe('high');
  });
  it('low outside the fertile window', () => {
    const w = getFertileWindow(periods('2026-01-01'), 28)!;
    expect(getPregnancyChance('2026-01-25', w)).toBe('low');
  });
});

describe('getCyclePhase', () => {
  it('menstrual during the first days', () => {
    expect(getCyclePhase(2, 28)).toBe('menstrual');
  });
  it('ovulation around day 14 of a 28-day cycle', () => {
    expect(getCyclePhase(14, 28)).toBe('ovulation');
  });
  it('follicular before ovulation', () => {
    expect(getCyclePhase(9, 28)).toBe('follicular');
  });
  it('luteal after ovulation', () => {
    expect(getCyclePhase(22, 28)).toBe('luteal');
  });
  it('null when cycle day unknown', () => {
    expect(getCyclePhase(null, 28)).toBeNull();
  });
});

describe('daysUntilNextPeriod', () => {
  it('positive before predicted date', () => {
    expect(daysUntilNextPeriod(periods('2026-01-01'), '2026-01-20', 28)).toBe(9);
  });
  it('negative when late', () => {
    expect(daysUntilNextPeriod(periods('2026-01-01'), '2026-02-05', 28)).toBe(-7);
  });
});
