import { describe, it, expect } from 'vitest';
import type { EmergencyPill } from '@/db/db';
import {
  countInMonth,
  countInYear,
  shouldRemindPregnancyTest,
  ecpHoursRemaining,
} from './emergency';

const records: EmergencyPill[] = [
  { datetime: '2026-01-05T10:00:00' },
  { datetime: '2026-01-20T22:30:00' },
  { datetime: '2026-03-02T08:00:00' },
  { datetime: '2025-11-11T12:00:00' },
];

describe('countInMonth', () => {
  it('counts records in a given yyyy-MM', () => {
    expect(countInMonth(records, '2026-01')).toBe(2);
    expect(countInMonth(records, '2026-03')).toBe(1);
    expect(countInMonth(records, '2026-02')).toBe(0);
  });
});

describe('countInYear', () => {
  it('counts records in a given year', () => {
    expect(countInYear(records, '2026')).toBe(3);
    expect(countInYear(records, '2025')).toBe(1);
  });
});

describe('shouldRemindPregnancyTest', () => {
  it('false when unknown', () => {
    expect(shouldRemindPregnancyTest(null)).toBe(false);
  });
  it('false when not yet 7 days late', () => {
    expect(shouldRemindPregnancyTest(-6)).toBe(false);
    expect(shouldRemindPregnancyTest(3)).toBe(false);
  });
  it('true when 7+ days late', () => {
    expect(shouldRemindPregnancyTest(-7)).toBe(true);
    expect(shouldRemindPregnancyTest(-10)).toBe(true);
  });
});

describe('ecpHoursRemaining', () => {
  it('counts down from 72h', () => {
    expect(ecpHoursRemaining(0)).toBe(72);
    expect(ecpHoursRemaining(50)).toBe(22);
  });
  it('clamps at 0', () => {
    expect(ecpHoursRemaining(100)).toBe(0);
  });
});
