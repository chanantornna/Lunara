// Shared domain types for Lunara

export type Goal = 'maintain' | 'lose' | 'gain' | 'health';
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';
export type Theme = 'light' | 'dark' | 'system';
export type Locale = 'th' | 'en';

export interface Profile {
  id: number; // always 1
  birthDate?: string; // ISO yyyy-MM-dd
  heightCm?: number;
  startWeightKg?: number;
  goal?: Goal;
  activityLevel?: ActivityLevel;
  onBirthControl?: boolean;
  avgCycleLengthOverride?: number;
  locale?: Locale;
  theme?: Theme;
}

export type Flow = 'light' | 'medium' | 'heavy';
export type BloodType = 'fresh' | 'dark' | 'clots';

export interface Period {
  id?: number;
  startDate: string; // ISO yyyy-MM-dd
  endDate?: string;
}

export interface PeriodDay {
  id?: number;
  date: string; // ISO yyyy-MM-dd, unique
  flow?: Flow;
  bloodType?: BloodType;
}

export type DischargeType =
  | 'none'
  | 'sticky'
  | 'creamy'
  | 'eggwhite'
  | 'watery'
  | 'yellow'
  | 'green'
  | 'gray'
  | 'bloody';

export interface Discharge {
  type?: DischargeType;
  amount?: Flow;
  odor?: 'normal' | 'abnormal';
  symptoms?: string[]; // itch/burning/irritation/dysuria
}

export type AcneSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface Acne {
  severity?: AcneSeverity;
  locations?: string[];
  types?: string[];
}

export interface Checkin {
  id?: number;
  date: string; // ISO yyyy-MM-dd, unique
  moods?: string[];
  moodScore?: number; // 1-5
  energy?: number; // 1-5
  stress?: number; // 1-5
  symptoms?: string[];
  painLevel?: number; // 0-10
  temperatureC?: number;
  illness?: string[];
  note?: string;
  discharge?: Discharge;
  acne?: Acne;
}

export interface WeightEntry {
  id?: number;
  date: string; // ISO yyyy-MM-dd
  weightKg: number;
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type Regularity = 'regular' | 'irregular' | 'unknown';
export type PregnancyChance = 'high' | 'low' | 'unknown';

export interface FertileWindow {
  ovulation: string; // ISO
  fertileStart: string; // ISO
  fertileEnd: string; // ISO
  adjustedByDischarge?: boolean;
}
