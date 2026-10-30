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

// ---- Pills (singleton plan id=1) ----
export async function getPillPlan() {
  return db.pills.get(1);
}

export async function savePillPlan(patch: Partial<import('./db').Pill>) {
  const current = (await db.pills.get(1)) ?? { id: 1 };
  await db.pills.put({ ...current, ...patch, id: 1 });
}

export async function setPillTaken(date: string, taken: boolean) {
  const existing = await db.pillLogs.where('date').equals(date).first();
  if (existing?.id) await db.pillLogs.update(existing.id, { taken });
  else await db.pillLogs.add({ date, taken });
}

export function listPillLogs() {
  return db.pillLogs.toArray();
}

// ---- Emergency pills ----
export async function addEmergencyPill(rec: import('./db').EmergencyPill) {
  return db.emergencyPills.add(rec);
}

export async function deleteEmergencyPill(id: number) {
  return db.emergencyPills.delete(id);
}

export function listEmergencyPills() {
  return db.emergencyPills.orderBy('datetime').reverse().toArray();
}

// ---- Sex logs ----
export async function addSexLog(rec: import('./db').SexLog) {
  return db.sexLogs.add(rec);
}

export async function deleteSexLog(id: number) {
  return db.sexLogs.delete(id);
}

export function listSexLogs() {
  return db.sexLogs.orderBy('date').reverse().toArray();
}

// ---- Workouts ----
export async function addWorkout(rec: import('./db').Workout) {
  return db.workouts.add(rec);
}
export async function deleteWorkout(id: number) {
  return db.workouts.delete(id);
}
export function listWorkouts() {
  return db.workouts.orderBy('date').reverse().toArray();
}

// ---- Sleep ----
export async function upsertSleep(rec: import('./db').Sleep) {
  const existing = await db.sleeps.where('date').equals(rec.date).first();
  if (existing?.id) await db.sleeps.put({ ...rec, id: existing.id });
  else await db.sleeps.add(rec);
}
export async function deleteSleep(id: number) {
  return db.sleeps.delete(id);
}
export function listSleeps() {
  return db.sleeps.orderBy('date').toArray();
}

// ---- Meals ----
export async function addMeal(rec: import('./db').Meal) {
  return db.meals.add(rec);
}
export async function deleteMeal(id: number) {
  return db.meals.delete(id);
}
export function listMealsByDate(date: string) {
  return db.meals.where('date').equals(date).toArray();
}
export function listMeals() {
  return db.meals.toArray();
}

// ---- Water ----
export async function addWater(date: string, ml: number) {
  return db.waterLogs.add({ date, ml });
}
export function listWaterByDate(date: string) {
  return db.waterLogs.where('date').equals(date).toArray();
}

// ---- Danger zone ----
export async function clearAllData(): Promise<void> {
  await Promise.all(db.tables.map((t) => t.clear()));
}
