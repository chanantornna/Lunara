import Dexie, { type Table } from 'dexie';
import type {
  Profile,
  Period,
  PeriodDay,
  Checkin,
  WeightEntry,
} from '@/domain/types';

// --- Phase 2-4 tables (schema reserved now; UI added later) ---
export interface Pill {
  id?: number;
  brand?: string;
  packType?: '21' | '28';
  takeTime?: string; // HH:mm
  pillsRemaining?: number;
  startDate?: string;
}
export interface PillLog {
  id?: number;
  date: string; // ISO
  taken: boolean;
}
export interface EmergencyPill {
  id?: number;
  datetime: string; // ISO
  reason?: string;
}
export interface SexLog {
  id?: number;
  date: string;
  protection?: 'condom' | 'none' | 'other';
  feeling?: string[];
  libido?: number;
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
