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
    db.pills.clear(),
    db.pillLogs.clear(),
    db.emergencyPills.clear(),
    db.sexLogs.clear(),
    db.workouts.clear(),
    db.sleeps.clear(),
    db.meals.clear(),
    db.waterLogs.clear(),
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

  // Phase 2 sample data: an active 28-day pill pack started 5 days ago,
  // with the last few days ticked as taken.
  await db.pills.put({
    id: 1,
    brand: 'ตัวอย่าง',
    packType: '28',
    takeTime: '08:00',
    packStartDate: addDaysISO(today, -5),
    active: true,
  });
  await db.pillLogs.bulkAdd(
    [1, 2, 3, 4].map((i) => ({ date: addDaysISO(today, -i), taken: true }))
  );

  await db.sexLogs.bulkAdd([
    { date: addDaysISO(today, -3), protection: 'condom', feeling: ['ok'], private: true },
    { date: addDaysISO(today, -11), protection: 'none', feeling: ['ok'], private: true },
  ]);

  await db.emergencyPills.add({
    datetime: new Date(`${addDaysISO(today, -11)}T23:00:00`).toISOString(),
    reason: 'ตัวอย่าง: ถุงยางแตก',
  });

  // Phase 3 sample data
  await db.workouts.bulkAdd([
    { date: addDaysISO(today, -1), type: 'walk', minutes: 40, intensity: 'low', calories: 160 },
    { date: addDaysISO(today, -2), type: 'yoga', minutes: 30, intensity: 'medium', calories: 90 },
    { date: addDaysISO(today, -4), type: 'run', minutes: 25, intensity: 'high', calories: 270 },
  ]);
  await db.sleeps.bulkAdd(
    [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const h = 6.5 + Math.sin(i) * 1.2;
      return {
        date: addDaysISO(today, -i),
        bedtime: '23:00',
        wake: '06:30',
        hours: +h.toFixed(1),
        quality: ((i + 2) % 5) + 1,
      };
    })
  );
  await db.meals.bulkAdd([
    { date: today, name: 'ข้าวสวย', calories: 160, protein: 3, carbs: 35, fat: 0 },
    { date: today, name: 'ผัดกะเพราไก่', calories: 440, protein: 28, carbs: 18, fat: 28 },
    { date: today, name: 'ชาเย็น', calories: 230, protein: 3, carbs: 40, fat: 6 },
  ]);
  await db.waterLogs.bulkAdd([
    { date: today, ml: 500 },
    { date: today, ml: 300 },
  ]);

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
    db.pills.clear(),
    db.pillLogs.clear(),
    db.emergencyPills.clear(),
    db.sexLogs.clear(),
    db.workouts.clear(),
    db.sleeps.clear(),
    db.meals.clear(),
    db.waterLogs.clear(),
  ]);
  await saveSettings({ seedEnabled: false });
}
