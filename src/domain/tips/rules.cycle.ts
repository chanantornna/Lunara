import type { TipRule } from './types';
import { getCycleLengths } from '@/domain/cycle';
import { recentCheckins } from './helpers';
import { daysBetween } from '@/lib/date';

const MENSTRUAL_PHASE: TipRule = {
  id: 'cycle.phase.menstrual',
  category: 'cycle',
  evaluate: (ctx) => {
    if (ctx.phase !== 'menstrual') return null;
    return {
      id: 'cycle.phase.menstrual',
      category: 'cycle',
      level: 'info',
      title: 'ช่วงมีประจำเดือน',
      body: 'พลังงานมักต่ำลง เลือกอาหารที่มีธาตุเหล็ก (ผักใบเขียว เนื้อแดง ตับ) ดื่มน้ำให้พอ และออกกำลังกายเบา ๆ เมื่อปวดท้อง',
    };
  },
};

const LUTEAL_PMS: TipRule = {
  id: 'cycle.phase.luteal',
  category: 'cycle',
  evaluate: (ctx) => {
    if (ctx.phase !== 'luteal') return null;
    return {
      id: 'cycle.phase.luteal',
      category: 'cycle',
      level: 'info',
      title: 'ช่วงก่อนมีประจำเดือน',
      body: 'อาจมีอาการ PMS เช่น หงุดหงิดหรือเหนื่อยง่าย ลองพักผ่อนให้พอ ลดคาเฟอีน และดูแลตัวเองอย่างอ่อนโยน',
    };
  },
};

const PERIOD_APPROACHING: TipRule = {
  id: 'cycle.approaching',
  category: 'cycle',
  evaluate: (ctx) => {
    const d = ctx.daysUntilNextPeriod;
    if (d == null || d < 0 || d > 3) return null;
    return {
      id: 'cycle.approaching',
      category: 'cycle',
      level: 'info',
      title: `ใกล้ถึงประจำเดือน (อีก ~${d} วัน)`,
      body: 'เตรียมผ้าอนามัยไว้ได้เลย ช่วงนี้ดูแลตัวเองช่วง PMS ด้วยการนอนพอ ดื่มน้ำ และลดอาหารเค็มจัด',
    };
  },
};

const PERIOD_LATE: TipRule = {
  id: 'cycle.late',
  category: 'cycle',
  evaluate: (ctx) => {
    const d = ctx.daysUntilNextPeriod;
    if (d == null || d > -7) return null;
    // Had unprotected sex recently? Strengthen the suggestion.
    const hadUnprotected = ctx.sexLogs.some(
      (s) => s.protection === 'none' && daysBetween(ctx.today, s.date) <= 35
    );
    return {
      id: 'cycle.late',
      category: 'cycle',
      level: 'warn',
      title: `ประจำเดือนช้ากว่าคาด ${-d} วัน`,
      body: hadUnprotected
        ? 'มีบันทึกเพศสัมพันธ์ที่ไม่ได้ป้องกันในช่วงที่ผ่านมา แนะนำลองตรวจครรภ์และปรึกษาแพทย์/เภสัชกร การคาดการณ์เป็นค่าประมาณเท่านั้น'
        : 'ประจำเดือนมาช้าได้จากหลายสาเหตุ เช่น ความเครียดหรือการพักผ่อน หากมีเพศสัมพันธ์ควรพิจารณาตรวจครรภ์ และหากช้ามากควรปรึกษาแพทย์',
    };
  },
};

const ABNORMAL_CYCLE_LENGTH: TipRule = {
  id: 'cycle.abnormalLength',
  category: 'cycle',
  evaluate: (ctx) => {
    const lengths = getCycleLengths(ctx.periods);
    if (lengths.length < 2) return null;
    const recent = lengths.slice(-3);
    const allShort = recent.every((l) => l < 21);
    const allLong = recent.every((l) => l > 35);
    if (!allShort && !allLong) return null;
    return {
      id: 'cycle.abnormalLength',
      category: 'cycle',
      level: 'doctor',
      title: allShort ? 'รอบเดือนสั้นผิดปกติซ้ำ ๆ' : 'รอบเดือนยาวผิดปกติซ้ำ ๆ',
      body: 'รอบที่สั้นกว่า 21 วันหรือยาวกว่า 35 วันต่อเนื่องอาจต้องได้รับการตรวจ แนะนำปรึกษาแพทย์เพื่อหาสาเหตุ (ข้อมูลนี้ไม่ใช่การวินิจฉัย)',
    };
  },
};

const MISSED_3_MONTHS: TipRule = {
  id: 'cycle.amenorrhea',
  category: 'cycle',
  evaluate: (ctx) => {
    if (ctx.periods.length === 0) return null;
    const starts = ctx.periods.map((p) => p.startDate).sort();
    const last = starts[starts.length - 1];
    if (daysBetween(ctx.today, last) < 90) return null;
    if (ctx.profile.onBirthControl) return null; // expected on some regimens
    return {
      id: 'cycle.amenorrhea',
      category: 'cycle',
      level: 'doctor',
      title: 'ไม่มีประจำเดือนเกิน 3 เดือน',
      body: 'การขาดประจำเดือนต่อเนื่องควรได้รับการตรวจเพื่อหาสาเหตุ แนะนำปรึกษาแพทย์',
    };
  },
};

const HEAVY_FLOW: TipRule = {
  id: 'cycle.heavyFlow',
  category: 'cycle',
  evaluate: (ctx) => {
    // Heavy flow on 3+ days within the last 10 days, or clots reported.
    const recent = recentCheckins(ctx.checkins, ctx.today, 10);
    // periodDays aren't in context; approximate via symptoms + severe pain.
    const severePain = recent.filter((c) => (c.painLevel ?? 0) >= 8).length;
    if (severePain < 2) return null;
    return {
      id: 'cycle.heavyFlow',
      category: 'cycle',
      level: 'doctor',
      title: 'ปวดประจำเดือนรุนแรงซ้ำ ๆ',
      body: 'มีบันทึกความปวดระดับสูงหลายวัน หากปวดรุนแรงหรือประจำเดือนมามากผิดปกติ (มีลิ่มเลือด) ควรปรึกษาแพทย์',
    };
  },
};

export const cycleRules: TipRule[] = [
  PERIOD_LATE,
  ABNORMAL_CYCLE_LENGTH,
  MISSED_3_MONTHS,
  HEAVY_FLOW,
  PERIOD_APPROACHING,
  MENSTRUAL_PHASE,
  LUTEAL_PMS,
];
