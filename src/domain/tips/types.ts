import type {
  Profile,
  Period,
  Checkin,
  WeightEntry,
} from '@/domain/types';
import type {
  Workout,
  Sleep,
  Meal,
  WaterLog,
  SexLog,
  EmergencyPill,
} from '@/db/db';

export type TipLevel = 'info' | 'warn' | 'doctor';

export type TipCategory =
  | 'cycle'
  | 'discharge_acne_mood'
  | 'sex'
  | 'lifestyle';

export interface Tip {
  id: string;
  category: TipCategory;
  level: TipLevel;
  title: string;
  body?: string;
  link?: { label: string; href: string };
}

/**
 * Everything a rule may inspect. All fields are plain data so rules stay pure
 * and testable. `today` is an ISO yyyy-MM-dd string.
 */
export interface TipContext {
  today: string;
  profile: Profile;
  periods: Period[];
  checkins: Checkin[]; // sorted ascending by date
  weights: WeightEntry[]; // sorted ascending by date
  workouts: Workout[];
  sleeps: Sleep[];
  meals: Meal[];
  water: WaterLog[];
  sexLogs: SexLog[];
  emergencyPills: EmergencyPill[];

  // Derived cycle facts (precomputed once by the runner).
  avgCycleLength: number;
  cycleDay: number | null;
  daysUntilNextPeriod: number | null;
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | null;
}

export interface TipRule {
  id: string;
  category: TipCategory;
  /** Return a Tip to surface it, or null to stay silent. */
  evaluate: (ctx: TipContext) => Tip | null;
}

export const TIP_LEVEL_ORDER: Record<TipLevel, number> = {
  doctor: 0,
  warn: 1,
  info: 2,
};
