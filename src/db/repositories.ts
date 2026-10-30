import { db, type AppSettings } from './db';
import type {
  Profile,
  Period,
  PeriodDay,
  Checkin,
  WeightEntry,
} from '@/domain/types';

// ---- Profile (singleton id=1) ----
export async function getProfile(): Promise<Profile> {
  const p = await db.profile.get(1);
  return p ?? { id: 1 };
}

export async function saveProfile(patch: Partial<Profile>): Promise<void> {
  const current = await getProfile();
  await db.profile.put({ ...current, ...patch, id: 1 });
}

// ---- Settings (singleton id=1) ----
export async function getSettings(): Promise<AppSettings> {
  const s = await db.settings.get(1);
  return s ?? { id: 1, seedEnabled: false };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: 1 });
}

// ---- Periods ----
export async function addPeriod(period: Period): Promise<number> {
  return db.periods.add(period);
}

export async function updatePeriod(id: number, patch: Partial<Period>) {
  return db.periods.update(id, patch);
}

export async function deletePeriod(id: number) {
  return db.periods.delete(id);
}

export function listPeriods(): Promise<Period[]> {
  return db.periods.orderBy('startDate').toArray();
}

// ---- Period days ----
export async function upsertPeriodDay(day: PeriodDay): Promise<void> {
  const existing = await db.periodDays.where('date').equals(day.date).first();
  if (existing?.id) await db.periodDays.update(existing.id, day);
  else await db.periodDays.add(day);
}

export function listPeriodDays(): Promise<PeriodDay[]> {
  return db.periodDays.toArray();
}

// ---- Check-ins ----
export async function upsertCheckin(checkin: Checkin): Promise<void> {
  const existing = await db.checkins.where('date').equals(checkin.date).first();
  if (existing?.id) await db.checkins.put({ ...checkin, id: existing.id });
  else await db.checkins.add(checkin);
}

export function getCheckin(date: string): Promise<Checkin | undefined> {
  return db.checkins.where('date').equals(date).first();
}

export function listCheckins(): Promise<Checkin[]> {
  return db.checkins.orderBy('date').toArray();
}

// ---- Weights ----
export async function addWeight(entry: WeightEntry): Promise<number> {
  return db.weights.add(entry);
}

export async function deleteWeight(id: number) {
  return db.weights.delete(id);
}

export function listWeights(): Promise<WeightEntry[]> {
  return db.weights.orderBy('date').toArray();
}

// ---- Danger zone ----
export async function clearAllData(): Promise<void> {
  await Promise.all(db.tables.map((t) => t.clear()));
}
