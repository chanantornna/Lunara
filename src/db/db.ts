import Dexie, { type Table } from 'dexie';
import type {
  Profile,
  Period,
  PeriodDay,
  Checkin,
  WeightEntry,
} from '@/domain/types';

// --- Phase 2 tables ---

/** The active birth-control plan (singleton id=1). */
export interface Pill {
  id?: number; // always 1
  brand?: string;
  packType?: '21' | '28'; // 21 = 7 placebo/break days, 28 = 7 inactive pills
  takeTime?: string; // HH:mm
  packStartDate?: string; // ISO date the current pack started
  active?: boolean;
}

/** One record per day: whether the active pill was taken. */
export interface PillLog {
  id?: number;
  date: string; // ISO, unique
  taken: boolean;
}

export interface EmergencyPill {
  id?: number;
  datetime: string; // ISO datetime
  reason?: string;
}

export interface SexLog {
  id?: number;
  date: string; // ISO
  protection?: 'condom' | 'none' | 'other';
  feeling?: string[]; // ok/pain/bleeding
  libido?: number; // 1-5, optional
  note?: string;
  private?: boolean;
}
export interface Workout {
  id?: number;
  date: string;
  type?: string;
  minutes?: number;
  intensity?: 'low' | 'medium' | 'high';
  calories?: number;
}
export interface Sleep {
  id?: number;
  date: string;
  bedtime?: string;
  wake?: string;
  hours?: number;
  quality?: number;
}
export interface Meal {
  id?: number;
  date: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}
export interface WaterLog {
  id?: number;
  date: string;
  ml: number;
}
export interface AppSettings {
  id: number; // always 1
  pinHash?: string;
  seedEnabled?: boolean;
  tipCategories?: Record<string, boolean>;
  notifications?: Record<string, { enabled: boolean; time?: string }>;
}

export class LunaraDB extends Dexie {
  profile!: Table<Profile, number>;
  periods!: Table<Period, number>;
  periodDays!: Table<PeriodDay, number>;
  checkins!: Table<Checkin, number>;
  weights!: Table<WeightEntry, number>;

  pills!: Table<Pill, number>;
  pillLogs!: Table<PillLog, number>;
  emergencyPills!: Table<EmergencyPill, number>;
  sexLogs!: Table<SexLog, number>;
  workouts!: Table<Workout, number>;
  sleeps!: Table<Sleep, number>;
  meals!: Table<Meal, number>;
  waterLogs!: Table<WaterLog, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('lunara');
    this.version(1).stores({
      profile: 'id',
      periods: '++id, startDate',
      periodDays: '++id, &date',
      checkins: '++id, &date',
      weights: '++id, date',
      pills: '++id',
      pillLogs: '++id, &date',
      emergencyPills: '++id, datetime',
      sexLogs: '++id, date',
      workouts: '++id, date',
      sleeps: '++id, date',
      meals: '++id, date',
      waterLogs: '++id, date',
      settings: 'id',
    });
  }
}

export const db = new LunaraDB();
