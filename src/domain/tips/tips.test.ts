import { describe, it, expect } from 'vitest';
import type { TipContext } from './types';
import { runTips, ALL_RULES } from './engine';
import { cycleRules } from './rules.cycle';
import { bodyRules } from './rules.body';
import { sexRules } from './rules.sex';
import { lifestyleRules } from './rules.lifestyle';

const TODAY = '2026-02-15';

function baseCtx(overrides: Partial<TipContext> = {}): TipContext {
  return {
    today: TODAY,
    profile: { id: 1, birthDate: '1996-01-01', onBirthControl: false },
    periods: [],
    checkins: [],
    weights: [],
    workouts: [],
    sleeps: [],
    meals: [],
    water: [],
    sexLogs: [],
    emergencyPills: [],
    avgCycleLength: 28,
    cycleDay: 10,
    daysUntilNextPeriod: 18,
    phase: 'follicular',
    ...overrides,
  };
}

function findTip(id: string, ctx: TipContext) {
  const rule = ALL_RULES.find((r) => r.id === id)!;
  return rule.evaluate(ctx);
}

// ---------- engine behavior ----------
describe('runTips engine', () => {
  it('an empty context only surfaces the gentle "move a bit" nudge', () => {
    // No data logged at all: the only rule that fires is the non-judgmental
    // workout nudge (0% of weekly goal). Nothing alarming should appear.
    const tips = runTips(baseCtx());
    expect(tips.map((t) => t.id)).toEqual(['lifestyle.workoutBehind']);
    expect(tips.every((t) => t.level === 'info')).toBe(true);
  });

  it('a fully neutral context (goal already met) surfaces positive streak only', () => {
    const ctx = baseCtx({ workouts: [{ date: TODAY, minutes: 150, calories: 0 }] });
    const tips = runTips(ctx);
    expect(tips.map((t) => t.id)).toContain('lifestyle.positive');
  });

  it('sorts by severity: doctor before warn before info', () => {
    const ctx = baseCtx({
      phase: 'menstrual', // info: ironMenstrual + menstrual phase
      daysUntilNextPeriod: -8, // warn: late
      sexLogs: [{ date: '2026-02-01', protection: 'none' }],
    });
    const tips = runTips(ctx);
    const levels = tips.map((t) => t.level);
    // ensure it's non-increasing severity order
    const order = { doctor: 0, warn: 1, info: 2 };
    for (let i = 1; i < levels.length; i++) {
      expect(order[levels[i]]).toBeGreaterThanOrEqual(order[levels[i - 1]]);
    }
  });

  it('respects disabled categories', () => {
    const ctx = baseCtx({ phase: 'menstrual' });
    const all = runTips(ctx);
    const noLifestyle = runTips(ctx, { lifestyle: false });
    expect(all.length).toBeGreaterThan(noLifestyle.length);
    expect(noLifestyle.every((t) => t.category !== 'lifestyle')).toBe(true);
  });

  it('treats a missing category key as enabled', () => {
    const ctx = baseCtx({ phase: 'menstrual' });
    expect(runTips(ctx, {}).length).toBe(runTips(ctx).length);
  });
});

// ---------- cycle rules ----------
describe('cycle rules', () => {
  it('menstrual phase tip', () => {
    expect(findTip('cycle.phase.menstrual', baseCtx({ phase: 'menstrual' }))).not.toBeNull();
    expect(findTip('cycle.phase.menstrual', baseCtx({ phase: 'luteal' }))).toBeNull();
  });

  it('approaching period within 3 days', () => {
    expect(findTip('cycle.approaching', baseCtx({ daysUntilNextPeriod: 2 }))).not.toBeNull();
    expect(findTip('cycle.approaching', baseCtx({ daysUntilNextPeriod: 5 }))).toBeNull();
  });

  it('late period 7+ days, stronger when unprotected sex present', () => {
    const plain = findTip('cycle.late', baseCtx({ daysUntilNextPeriod: -7 }));
    expect(plain).not.toBeNull();
    const withSex = findTip(
      'cycle.late',
      baseCtx({
        daysUntilNextPeriod: -8,
        sexLogs: [{ date: '2026-02-05', protection: 'none' }],
      })
    );
    expect(withSex?.body).toContain('ตรวจครรภ์');
  });

  it('abnormal cycle length (all short) -> doctor', () => {
    const periods = [
      { startDate: '2026-01-01' },
      { startDate: '2026-01-19' }, // 18
      { startDate: '2026-02-06' }, // 18
      { startDate: '2026-02-24' }, // 18
    ];
    const tip = findTip('cycle.abnormalLength', baseCtx({ periods }));
    expect(tip?.level).toBe('doctor');
  });

  it('amenorrhea > 3 months -> doctor (not on birth control)', () => {
    const periods = [{ startDate: '2025-10-01' }];
    expect(findTip('cycle.amenorrhea', baseCtx({ periods }))?.level).toBe('doctor');
    expect(
      findTip(
        'cycle.amenorrhea',
        baseCtx({ periods, profile: { id: 1, onBirthControl: true } })
      )
    ).toBeNull();
  });
});

// ---------- body (discharge/acne/mood) rules ----------
describe('body rules', () => {
  it('green/abnormal discharge -> doctor', () => {
    const ctx = baseCtx({
      checkins: [{ date: TODAY, discharge: { type: 'green' } }],
    });
    expect(findTip('discharge.infection', ctx)?.level).toBe('doctor');
  });

  it('itch/burning discharge symptoms -> doctor', () => {
    const ctx = baseCtx({
      checkins: [{ date: TODAY, discharge: { type: 'creamy', symptoms: ['itch'] } }],
    });
    expect(findTip('discharge.infection', ctx)).not.toBeNull();
  });

  it('bloody spotting outside period on 2+ days -> warn', () => {
    const ctx = baseCtx({
      phase: 'follicular',
      checkins: [
        { date: '2026-02-14', discharge: { type: 'bloody' } },
        { date: '2026-02-12', discharge: { type: 'bloody' } },
      ],
    });
    expect(findTip('discharge.spotting', ctx)?.level).toBe('warn');
  });

  it('sustained low mood (7+ of 14 days) -> doctor with hotline link', () => {
    const checkins = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-02-${String(8 + i).padStart(2, '0')}`,
      moodScore: 2,
    }));
    const tip = findTip('mood.lowSustained', baseCtx({ checkins }));
    expect(tip?.level).toBe('doctor');
    expect(tip?.link?.href).toContain('1323');
  });

  it('premenstrual acne -> info (luteal only)', () => {
    const ctx = baseCtx({
      phase: 'luteal',
      checkins: [{ date: TODAY, acne: { severity: 'moderate' } }],
    });
    expect(findTip('acne.premenstrual', ctx)?.level).toBe('info');
  });
});

// ---------- sex rules ----------
describe('sex rules', () => {
  it('unprotected within 3 days -> warn', () => {
    const ctx = baseCtx({ sexLogs: [{ date: '2026-02-14', protection: 'none' }] });
    expect(findTip('sex.unprotected', ctx)?.level).toBe('warn');
  });

  it('pain/bleeding twice in 60 days -> doctor', () => {
    const ctx = baseCtx({
      sexLogs: [
        { date: '2026-02-10', feeling: ['pain'] },
        { date: '2026-01-25', feeling: ['bleeding'] },
      ],
    });
    expect(findTip('sex.painBleeding', ctx)?.level).toBe('doctor');
  });

  it('annual checkup only when age >= 21 and activity exists', () => {
    const withActivity = baseCtx({
      sexLogs: [{ date: '2026-02-01', protection: 'condom' }],
    });
    expect(findTip('sex.annualCheckup', withActivity)).not.toBeNull();
    const young = baseCtx({
      profile: { id: 1, birthDate: '2010-01-01' },
      sexLogs: [{ date: '2026-02-01' }],
    });
    expect(findTip('sex.annualCheckup', young)).toBeNull();
  });
});

// ---------- lifestyle rules ----------
describe('lifestyle rules', () => {
  it('short sleep 3 nights -> warn', () => {
    const sleeps = [0, 1, 2].map((i) => ({
      date: `2026-02-${String(15 - i).padStart(2, '0')}`,
      hours: 5,
    }));
    expect(findTip('lifestyle.shortSleep', baseCtx({ sleeps }))?.level).toBe('warn');
  });

  it('weight change > 5% in 30 days -> warn', () => {
    const weights = [
      { date: '2026-01-20', weightKg: 60 },
      { date: '2026-02-14', weightKg: 56 }, // -6.7%
    ];
    expect(findTip('lifestyle.weightChange', baseCtx({ weights }))?.level).toBe('warn');
  });

  it('positive streak when weekly goal met', () => {
    const workouts = [{ date: TODAY, minutes: 150, calories: 0 }];
    expect(findTip('lifestyle.positive', baseCtx({ workouts }))).not.toBeNull();
  });

  it('low water nudge only when some water logged today', () => {
    const none = findTip('lifestyle.lowWater', baseCtx({ water: [] }));
    expect(none).toBeNull();
    const low = findTip(
      'lifestyle.lowWater',
      baseCtx({ water: [{ date: TODAY, ml: 300 }] })
    );
    expect(low).not.toBeNull();
  });
});

// ---------- meta: every rule has a unique id and a test touches each file ----------
describe('rule registry integrity', () => {
  it('all rule ids are unique', () => {
    const ids = ALL_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('registry includes every category group', () => {
    expect(cycleRules.length).toBeGreaterThan(0);
    expect(bodyRules.length).toBeGreaterThan(0);
    expect(sexRules.length).toBeGreaterThan(0);
    expect(lifestyleRules.length).toBeGreaterThan(0);
  });
});
