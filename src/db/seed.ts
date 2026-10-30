import { db } from './db';
import { saveProfile, saveSettings } from './repositories';
import { todayISO, addDaysISO } from '@/lib/date';
import type { Checkin, Period, WeightEntry } from '@/domain/types';

/**
 * Populate the DB with sample data to exercise charts and (later) tips.
 * Idempotent-ish: clears sample-owned tables first so re-seeding is safe.
 */
export async function seedSampleData(): Promise<void> {
  await Promise.all([
    db.periods.clear(),
    db.periodDays.clear(),
    db.checkins.clear(),
    db.weights.clear(),
  ]);

  const today = todayISO();

  // 4 cycles, ~28 day spacing, most recent started 12 days ago.
  const starts = [
    addDaysISO(today, -12),
    addDaysISO(today, -40),
    addDaysISO(today, -68),
    addDaysISO(today, -97),
  ];
  const periods: Period[] = starts.map((startDate) => ({
    startDate,
    endDate: addDaysISO(startDate, 4),
  }));
  await db.periods.bulkAdd(periods);

  // Weights: gentle trend over ~12 weeks.
  const weights: WeightEntry[] = [];
  for (let i = 12; i >= 0; i--) {
    weights.push({
      date: addDaysISO(today, -i * 7),
      weightKg: +(58 + Math.sin(i / 2) * 0.8 - i * 0.05).toFixed(1),
    });
  }
  await db.weights.bulkAdd(weights);

  // A handful of recent check-ins.
  const moodsPool = [
    ['happy', 'calm'],
    ['tired', 'sensitive'],
    ['stressed', 'irritable'],
    ['calm'],
    ['anxious', 'tired'],
  ];
  const checkins: Checkin[] = [];
  for (let i = 0; i < 10; i++) {
    checkins.push({
      date: addDaysISO(today, -i),
      moods: moodsPool[i % moodsPool.length],
      moodScore: ((i * 2) % 5) + 1,
      energy: ((i * 3) % 5) + 1,
      stress: ((i + 1) % 5) + 1,
      symptoms: i % 3 === 0 ? ['cramps', 'bloating'] : [],
      painLevel: i % 3 === 0 ? 4 : 0,
      discharge:
        i % 4 === 0 ? { type: 'eggwhite', amount: 'medium', odor: 'normal' } : undefined,
      acne:
        i % 5 === 0 ? { severity: 'mild', locations: ['chin'], types: ['inflamed'] } : undefined,
    });
  }
  await db.checkins.bulkAdd(checkins);

  await saveProfile({
    birthDate: '1997-05-20',
    heightCm: 162,
    startWeightKg: 58,
    goal: 'health',
    activityLevel: 'moderate',
    onBirthControl: false,
  });

  await saveSettings({ seedEnabled: true });
}

export async function removeSampleData(): Promise<void> {
  await Promise.all([
    db.periods.clear(),
    db.periodDays.clear(),
    db.checkins.clear(),
    db.weights.clear(),
  ]);
  await saveSettings({ seedEnabled: false });
}
