import type { TipRule } from './types';
import { recentCheckins, countWhere, hasMood } from './helpers';

const DISCHARGE_INFECTION: TipRule = {
  id: 'discharge.infection',
  category: 'discharge_acne_mood',
  evaluate: (ctx) => {
    const recent = recentCheckins(ctx.checkins, ctx.today, 5);
    const concerning = recent.find((c) => {
      const t = c.discharge?.type;
      const odor = c.discharge?.odor === 'abnormal';
      const sym = c.discharge?.symptoms ?? [];
      const irritated =
        sym.includes('itch') || sym.includes('burning') || sym.includes('irritation');
      return t === 'green' || t === 'gray' || odor || irritated;
    });
    if (!concerning) return null;
    return {
      id: 'discharge.infection',
      category: 'discharge_acne_mood',
      level: 'doctor',
      title: 'ตกขาวอาจมีสัญญาณการติดเชื้อ',
      body: 'ตกขาวสีเขียว/เทา มีกลิ่นผิดปกติ หรือมีอาการคัน/แสบร่วม อาจเป็นสัญญาณของการติดเชื้อ ควรปรึกษาแพทย์ (ไม่ใช่การวินิจฉัย)',
    };
  },
};

const DISCHARGE_SPOTTING: TipRule = {
  id: 'discharge.spotting',
  category: 'discharge_acne_mood',
  evaluate: (ctx) => {
    // Bloody discharge outside a menstrual phase on 2+ recent days.
    if (ctx.phase === 'menstrual') return null;
    const count = countWhere(
      ctx.checkins,
      ctx.today,
      14,
      (c) => c.discharge?.type === 'bloody'
    );
    if (count < 2) return null;
    return {
      id: 'discharge.spotting',
      category: 'discharge_acne_mood',
      level: 'warn',
      title: 'มีเลือดปนในตกขาวนอกช่วงมีประจำเดือน',
      body: 'หากมีเลือดออกกะปริดกะปรอยนอกรอบประจำเดือนซ้ำ ๆ แนะนำปรึกษาแพทย์เพื่อหาสาเหตุ',
    };
  },
};

const ACNE_BEFORE_PERIOD: TipRule = {
  id: 'acne.premenstrual',
  category: 'discharge_acne_mood',
  evaluate: (ctx) => {
    if (ctx.phase !== 'luteal') return null;
    const hasAcne = recentCheckins(ctx.checkins, ctx.today, 5).some(
      (c) => c.acne && c.acne.severity && c.acne.severity !== 'none'
    );
    if (!hasAcne) return null;
    return {
      id: 'acne.premenstrual',
      category: 'discharge_acne_mood',
      level: 'info',
      title: 'สิวช่วงก่อนมีประจำเดือน',
      body: 'สิวที่ขึ้นช่วงก่อนมีประจำเดือนเป็นรูปแบบที่พบได้ทั่วไปจากการเปลี่ยนแปลงของฮอร์โมน ลองล้างหน้าอ่อนโยน เลี่ยงการบีบ และพักผ่อนให้พอ',
    };
  },
};

const LOW_MOOD_SUSTAINED: TipRule = {
  id: 'mood.lowSustained',
  category: 'discharge_acne_mood',
  evaluate: (ctx) => {
    // Low mood / anxiety across many days in the past 2 weeks.
    const lowDays = countWhere(
      ctx.checkins,
      ctx.today,
      14,
      (c) =>
        (c.moodScore != null && c.moodScore <= 2) ||
        hasMood(c, 'sad') ||
        hasMood(c, 'anxious')
    );
    if (lowDays < 7) return null;
    return {
      id: 'mood.lowSustained',
      category: 'discharge_acne_mood',
      level: 'doctor',
      title: 'ดูเหมือนช่วงนี้จะหนักใจต่อเนื่อง',
      body: 'คุณบันทึกอารมณ์ต่ำหรือวิตกกังวลหลายวันในช่วง 2 สัปดาห์ที่ผ่านมา คุณไม่ได้อยู่คนเดียวนะ ลองคุยกับคนที่ไว้ใจหรือผู้เชี่ยวชาญ',
      link: { label: 'สายด่วนสุขภาพจิต 1323 (กรมสุขภาพจิต)', href: 'tel:1323' },
    };
  },
};

const MOOD_PATTERN: TipRule = {
  id: 'mood.pattern',
  category: 'discharge_acne_mood',
  evaluate: (ctx) => {
    // Simple pattern: in the 5 days before period, often irritable + low sleep.
    const d = ctx.daysUntilNextPeriod;
    if (d == null || d < 0 || d > 5) return null;
    const irritableDays = countWhere(ctx.checkins, ctx.today, 7, (c) =>
      hasMood(c, 'irritable')
    );
    if (irritableDays < 2) return null;
    return {
      id: 'mood.pattern',
      category: 'discharge_acne_mood',
      level: 'info',
      title: 'รูปแบบที่สังเกตได้',
      body: 'ช่วงก่อนมีประจำเดือน คุณมักบันทึกว่าหงุดหงิด การรู้ทันรูปแบบนี้ช่วยให้วางแผนดูแลตัวเองล่วงหน้าได้',
    };
  },
};

export const bodyRules: TipRule[] = [
  DISCHARGE_INFECTION,
  DISCHARGE_SPOTTING,
  LOW_MOOD_SUSTAINED,
  MOOD_PATTERN,
  ACNE_BEFORE_PERIOD,
];
