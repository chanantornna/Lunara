import { daysBetween } from '@/lib/date';

export const PACK_LENGTH = 28; // full cycle length for both 21 and 28 packs
export const ACTIVE_PILLS_21 = 21;
export const BREAK_DAYS = 7;
export const LOW_PILL_THRESHOLD = 3; // warn when this many active pills (or fewer) remain

export interface PillPlan {
  packType: '21' | '28';
  packStartDate: string; // ISO
}

/**
 * 1-based day within the current pack cycle (1..28), relative to packStartDate.
 * Wraps automatically into the next pack. Returns null if not started yet.
 */
export function getPackDay(plan: PillPlan, today: string): number | null {
  const diff = daysBetween(today, plan.packStartDate);
  if (diff < 0) return null;
  return (diff % PACK_LENGTH) + 1;
}

/**
 * Is `today` a break/placebo day?
 * - 21-pack: days 22–28 are pill-free break days.
 * - 28-pack: days 22–28 are inactive (placebo) pills — still "taken" daily,
 *   but no active hormone; we flag them so the UI can label them.
 */
export function isBreakDay(plan: PillPlan, today: string): boolean {
  const day = getPackDay(plan, today);
  if (day == null) return false;
  return day > ACTIVE_PILLS_21;
}

/** Active pills remaining in the current pack (0 during the break week). */
export function activePillsRemaining(plan: PillPlan, today: string): number {
  const day = getPackDay(plan, today);
  if (day == null) return ACTIVE_PILLS_21;
  if (day > ACTIVE_PILLS_21) return 0;
  return ACTIVE_PILLS_21 - day + 1;
}

/** True when the active pills remaining are at or below the low threshold. */
export function isRunningLow(plan: PillPlan, today: string): boolean {
  const remaining = activePillsRemaining(plan, today);
  const day = getPackDay(plan, today);
  if (day == null || day > ACTIVE_PILLS_21) return false;
  return remaining <= LOW_PILL_THRESHOLD;
}

/** ISO date the next pack should start (day 1 of the following cycle). */
export function nextPackStartDate(plan: PillPlan, today: string): string | null {
  const diff = daysBetween(today, plan.packStartDate);
  if (diff < 0) return null;
  const cyclesElapsed = Math.floor(diff / PACK_LENGTH);
  const daysToAdd = (cyclesElapsed + 1) * PACK_LENGTH;
  // addDays via daysBetween helper's sibling
  const d = new Date(plan.packStartDate);
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

export type MissedGuidance = {
  level: 'info' | 'warn';
  title: string;
  body: string;
};

/**
 * General (non-prescriptive) guidance for missed pills. We never give a
 * definitive instruction — always defer to the leaflet / a pharmacist.
 */
export function missedPillGuidance(missedCount: number): MissedGuidance {
  if (missedCount <= 0) {
    return {
      level: 'info',
      title: 'ยังไม่มีการลืมกิน',
      body: 'เยี่ยมมาก พยายามกินให้ตรงเวลาเดิมทุกวันเพื่อประสิทธิภาพสูงสุด',
    };
  }
  if (missedCount === 1) {
    return {
      level: 'warn',
      title: 'ลืมกิน 1 เม็ด',
      body: 'โดยทั่วไปเมื่อลืม 1 เม็ด มักให้กินทันทีที่นึกได้ แล้วกินเม็ดต่อไปตามเวลาปกติ แต่คำแนะนำขึ้นกับชนิดยาและช่วงของแผง โปรดอ่านเอกสารกำกับยาหรือปรึกษาเภสัชกร',
    };
  }
  return {
    level: 'warn',
    title: `ลืมกินมากกว่า 1 เม็ด (${missedCount} เม็ด)`,
    body: 'เมื่อลืมตั้งแต่ 2 เม็ดขึ้นไป ประสิทธิภาพการคุมกำเนิดอาจลดลง ควรพิจารณาใช้การป้องกันเสริม (เช่น ถุงยาง) และอ่านเอกสารกำกับยาหรือปรึกษาเภสัชกร/แพทย์ ข้อมูลนี้เป็นคำแนะนำทั่วไป ไม่ใช่คำสั่งทางการแพทย์',
  };
}
