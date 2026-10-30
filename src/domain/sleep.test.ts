import { describe, it, expect } from 'vitest';
import { sleepHours } from './sleep';

describe('sleepHours', () => {
  it('computes within the same day', () => {
    expect(sleepHours('22:00', '23:30')).toBe(1.5);
  });
  it('handles crossing midnight', () => {
    expect(sleepHours('23:30', '06:30')).toBe(7);
    expect(sleepHours('23:00', '07:00')).toBe(8);
  });
  it('treats equal times as a full 24h is avoided -> wraps to 24', () => {
    expect(sleepHours('22:00', '22:00')).toBe(24);
  });
  it('returns 0 on invalid input', () => {
    expect(sleepHours('bad', '07:00')).toBe(0);
    expect(sleepHours('25:00', '07:00')).toBe(0);
    expect(sleepHours('22:00', '07:99')).toBe(0);
  });
});
