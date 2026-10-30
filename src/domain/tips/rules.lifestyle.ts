import type { TipRule } from './types';
import { daysBetween } from '@/lib/date';
import { weeklyWorkoutSummary } from '@/domain/fitness';
import { SHORT_SLEEP_THRESHOLD } from '@/domain/sleep';
import { totalWater, DEFAULT_WATER_GOAL_ML } from '@/domain/nutrition';

const IRON_DURING_PERIOD: TipRule = {
  id: 'lifestyle.ironMenstrual',
  category: 'lifestyle',
  evaluate: (ctx) => {
    if (ctx.phase !== 'menstrual') return null;
    return {
      id: 'lifestyle.ironMenstrual',
      category: 'lifestyle',
      level: 'info',
      title: 'โภชนาการช่วงมีประจำเดือน',
      body: 'ช่วงนี้แนะนำอาหารที่มีธาตุเหล็ก เช่น เนื้อแดง ตับ ผักใบเขียว และดื่มน้ำให้เพียงพอ ออกกำลังกายเบา ๆ ได้ถ้าไหว',
    };
  },
};

const WORKOUT_BEHIND: TipRule = {
  id: 'lifestyle.workoutBehind',
  category: 'lifestyle',
  evaluate: (ctx) => {
    const s = weeklyWorkoutSummary(ctx.workouts, ctx.today);
    if (s.goalMet || s.progressPct >= 50) return null;
    return {
      id: 'lifestyle.workoutBehind',
      category: 'lifestyle',
      level: 'info',
      title: 'ชวนขยับตัวสักหน่อย',
      body: 'สัปดาห์นี้ยังไม่ถึงครึ่งของเป้า ลองเริ่มจากเดินเบา ๆ 10–15 นาที ค่อย ๆ เพิ่มได้ ไม่ต้องกดดันตัวเอง',
    };
  },
};

const SHORT_SLEEP: TipRule = {
  id: 'lifestyle.shortSleep',
  category: 'lifestyle',
  evaluate: (ctx) => {
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      const date = ctx.sleeps.find(
        (s) => daysBetween(ctx.today, s.date) === i
      );
      if (date && (date.hours ?? 0) < SHORT_SLEEP_THRESHOLD) streak++;
      else if (date) break;
      else if (i > 0) break;
    }
    if (streak < 3) return null;
    return {
      id: 'lifestyle.shortSleep',
      category: 'lifestyle',
      level: 'warn',
      title: `นอนน้อยกว่า 6 ชม. ${streak} คืนติด`,
      body: 'ลองเข้านอนเวลาเดิมทุกวัน ลดจอและคาเฟอีนก่อนนอน การนอนพอช่วยทั้งอารมณ์ ฮอร์โมน และสุขภาพโดยรวม',
    };
  },
};

const LOW_WATER: TipRule = {
  id: 'lifestyle.lowWater',
  category: 'lifestyle',
  evaluate: (ctx) => {
    const todayWater = ctx.water.filter((w) => w.date === ctx.today);
    if (todayWater.length === 0) return null; // no data, don't nag
    const total = totalWater(todayWater);
    if (total >= DEFAULT_WATER_GOAL_ML * 0.6) return null;
    return {
      id: 'lifestyle.lowWater',
      category: 'lifestyle',
      level: 'info',
      title: 'ดื่มน้ำเพิ่มอีกนิด',
      body: 'วันนี้ดื่มน้ำยังไม่มากนัก ลองจิบน้ำบ่อย ๆ ระหว่างวันนะ',
    };
  },
};

const WEIGHT_CHANGE: TipRule = {
  id: 'lifestyle.weightChange',
  category: 'lifestyle',
  evaluate: (ctx) => {
    // >5% unintentional change within ~30 days.
    const within = ctx.weights.filter(
      (w) => daysBetween(ctx.today, w.date) <= 30
    );
    if (within.length < 2) return null;
    const first = within[0].weightKg;
    const last = within[within.length - 1].weightKg;
    if (!first) return null;
    const pct = Math.abs((last - first) / first) * 100;
    if (pct < 5) return null;
    return {
      id: 'lifestyle.weightChange',
      category: 'lifestyle',
      level: 'warn',
      title: 'น้ำหนักเปลี่ยนค่อนข้างมากในช่วงสั้น',
      body: 'น้ำหนักเปลี่ยนมากกว่า 5% ภายในราวหนึ่งเดือน หากไม่ได้ตั้งใจ แนะนำปรึกษาแพทย์เพื่อความสบายใจ',
    };
  },
};

const POSITIVE_STREAK: TipRule = {
  id: 'lifestyle.positive',
  category: 'lifestyle',
  evaluate: (ctx) => {
    const s = weeklyWorkoutSummary(ctx.workouts, ctx.today);
    if (!s.goalMet) return null;
    return {
      id: 'lifestyle.positive',
      category: 'lifestyle',
      level: 'info',
      title: 'ทำได้ดีมาก! 🎉',
      body: 'สัปดาห์นี้คุณออกกำลังกายถึงเป้าแล้ว ภูมิใจในตัวเองได้เลย',
    };
  },
};

export const lifestyleRules: TipRule[] = [
  SHORT_SLEEP,
  WEIGHT_CHANGE,
  IRON_DURING_PERIOD,
  WORKOUT_BEHIND,
  LOW_WATER,
  POSITIVE_STREAK,
];
