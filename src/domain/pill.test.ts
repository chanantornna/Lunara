import { describe, it, expect } from 'vitest';
import {
  getPackDay,
  isBreakDay,
  activePillsRemaining,
  isRunningLow,
  nextPackStartDate,
  missedPillGuidance,
} from './pill';

const plan21 = { packType: '21' as const, packStartDate: '2026-01-01' };

describe('getPackDay', () => {
  it('is 1-based from pack start', () => {
    expect(getPackDay(plan21, '2026-01-01')).toBe(1);
    expect(getPackDay(plan21, '2026-01-21')).toBe(21);
    expect(getPackDay(plan21, '2026-01-28')).toBe(28);
  });
  it('wraps into the next pack cycle', () => {
    expect(getPackDay(plan21, '2026-01-29')).toBe(1);
    expect(getPackDay(plan21, '2026-02-11')).toBe(14);
  });
  it('null before the pack starts', () => {
    expect(getPackDay(plan21, '2025-12-31')).toBeNull();
  });
});

describe('isBreakDay', () => {
  it('false during active pills (days 1-21)', () => {
    expect(isBreakDay(plan21, '2026-01-21')).toBe(false);
  });
  it('true during the break week (days 22-28)', () => {
    expect(isBreakDay(plan21, '2026-01-22')).toBe(true);
    expect(isBreakDay(plan21, '2026-01-28')).toBe(true);
  });
});

describe('activePillsRemaining', () => {
  it('counts down across the active days', () => {
    expect(activePillsRemaining(plan21, '2026-01-01')).toBe(21);
    expect(activePillsRemaining(plan21, '2026-01-19')).toBe(3);
    expect(activePillsRemaining(plan21, '2026-01-21')).toBe(1);
  });
  it('is 0 during the break week', () => {
    expect(activePillsRemaining(plan21, '2026-01-25')).toBe(0);
  });
});

describe('isRunningLow', () => {
  it('false when plenty remain', () => {
    expect(isRunningLow(plan21, '2026-01-10')).toBe(false);
  });
  it('true at or below 3 active pills left', () => {
    expect(isRunningLow(plan21, '2026-01-19')).toBe(true); // 3 left
    expect(isRunningLow(plan21, '2026-01-21')).toBe(true); // 1 left
  });
  it('false during the break week', () => {
    expect(isRunningLow(plan21, '2026-01-25')).toBe(false);
  });
});

describe('nextPackStartDate', () => {
  it('returns day 1 of the following cycle', () => {
    expect(nextPackStartDate(plan21, '2026-01-10')).toBe('2026-01-29');
  });
  it('accounts for multiple elapsed cycles', () => {
    expect(nextPackStartDate(plan21, '2026-02-15')).toBe('2026-02-26');
  });
});

describe('missedPillGuidance', () => {
  it('info when nothing missed', () => {
    expect(missedPillGuidance(0).level).toBe('info');
  });
  it('warns and defers for a single miss', () => {
    const g = missedPillGuidance(1);
    expect(g.level).toBe('warn');
    expect(g.body).toContain('เภสัชกร');
  });
  it('escalates for multiple misses', () => {
    const g = missedPillGuidance(2);
    expect(g.level).toBe('warn');
    expect(g.title).toContain('มากกว่า 1');
  });
});
