import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { todayISO } from '@/lib/date';
import {
  getAverageCycleLength,
  getCurrentCycleDay,
  daysUntilNextPeriod,
  getCyclePhase,
} from '@/domain/cycle';
import { runTips } from '@/domain/tips/engine';
import type { TipContext } from '@/domain/tips/types';
import type { Tip } from '@/domain/tips/types';

/** Load all data, build the tip context, and run the engine reactively. */
export function useTips(): Tip[] | undefined {
  const data = useLiveQuery(async () => {
    const [
      profile,
      periods,
      checkins,
      weights,
      workouts,
      sleeps,
      meals,
      water,
      sexLogs,
      emergencyPills,
      settings,
    ] = await Promise.all([
      db.profile.get(1),
      db.periods.orderBy('startDate').toArray(),
      db.checkins.orderBy('date').toArray(),
      db.weights.orderBy('date').toArray(),
      db.workouts.toArray(),
      db.sleeps.toArray(),
      db.meals.toArray(),
      db.waterLogs.toArray(),
      db.sexLogs.toArray(),
      db.emergencyPills.toArray(),
      db.settings.get(1),
    ]);
    return {
      profile: profile ?? { id: 1 },
      periods,
      checkins,
      weights,
      workouts,
      sleeps,
      meals,
      water,
      sexLogs,
      emergencyPills,
      enabled: settings?.tipCategories ?? {},
    };
  }, []);

  if (!data) return undefined;

  const today = todayISO();
  const avgCycleLength = getAverageCycleLength(
    data.periods,
    28,
    data.profile.avgCycleLengthOverride
  );
  const cycleDay = getCurrentCycleDay(data.periods, today);
  const until = daysUntilNextPeriod(data.periods, today, avgCycleLength);
  const phase = getCyclePhase(cycleDay, avgCycleLength);

  const ctx: TipContext = {
    today,
    profile: data.profile,
    periods: data.periods,
    checkins: data.checkins,
    weights: data.weights,
    workouts: data.workouts,
    sleeps: data.sleeps,
    meals: data.meals,
    water: data.water,
    sexLogs: data.sexLogs,
    emergencyPills: data.emergencyPills,
    avgCycleLength,
    cycleDay,
    daysUntilNextPeriod: until,
    phase,
  };

  return runTips(ctx, data.enabled);
}
