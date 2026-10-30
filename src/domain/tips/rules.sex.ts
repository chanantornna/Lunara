import type { TipRule } from './types';
import { daysBetween } from '@/lib/date';
import { ageFromBirthDate } from '@/domain/body';

const UNPROTECTED_RECENT: TipRule = {
  id: 'sex.unprotected',
  category: 'sex',
  evaluate: (ctx) => {
    const recent = ctx.sexLogs.find(
      (s) => s.protection === 'none' && daysBetween(ctx.today, s.date) <= 3
    );
    if (!recent) return null;
    return {
      id: 'sex.unprotected',
      category: 'sex',
      level: 'warn',
      title: 'มีเพศสัมพันธ์ที่ไม่ได้ป้องกันเมื่อเร็ว ๆ นี้',
      body: 'หากไม่ต้องการตั้งครรภ์ ยาคุมฉุกเฉินควรรีบกินภายใน 72 ชั่วโมง ยิ่งเร็วยิ่งดี และควรพิจารณาตรวจโรคติดต่อทางเพศสัมพันธ์',
    };
  },
};

const PAIN_BLEEDING: TipRule = {
  id: 'sex.painBleeding',
  category: 'sex',
  evaluate: (ctx) => {
    const concern = ctx.sexLogs
      .filter((s) => daysBetween(ctx.today, s.date) <= 60)
      .filter(
        (s) => s.feeling?.includes('pain') || s.feeling?.includes('bleeding')
      );
    if (concern.length < 2) return null;
    return {
      id: 'sex.painBleeding',
      category: 'sex',
      level: 'doctor',
      title: 'เจ็บหรือมีเลือดออกหลังมีเพศสัมพันธ์ซ้ำ ๆ',
      body: 'มีการบันทึกอาการเจ็บหรือเลือดออกหลายครั้ง แนะนำปรึกษาแพทย์เพื่อตรวจหาสาเหตุ',
    };
  },
};

const ANNUAL_CHECKUP: TipRule = {
  id: 'sex.annualCheckup',
  category: 'sex',
  evaluate: (ctx) => {
    const age = ageFromBirthDate(ctx.profile.birthDate);
    // Pap smear generally suggested from 21/25+ depending on guidelines.
    if (age < 21) return null;
    // Only surface when there is sexual activity recorded.
    if (ctx.sexLogs.length === 0) return null;
    return {
      id: 'sex.annualCheckup',
      category: 'sex',
      level: 'info',
      title: 'ตรวจสุขภาพทางเพศประจำปี',
      body: 'การตรวจภายใน/คัดกรองมะเร็งปากมดลูก (Pap smear) ตามช่วงที่แพทย์แนะนำช่วยดูแลสุขภาพในระยะยาว ลองนัดตรวจประจำปี',
    };
  },
};

const SAFE_SEX_TIP: TipRule = {
  id: 'sex.generalTip',
  category: 'sex',
  evaluate: (ctx) => {
    // Gentle general tip when there is recent activity and no condom use.
    const recent = ctx.sexLogs.filter(
      (s) => daysBetween(ctx.today, s.date) <= 14
    );
    if (recent.length === 0) return null;
    const anyCondom = recent.some((s) => s.protection === 'condom');
    if (anyCondom) return null;
    return {
      id: 'sex.generalTip',
      category: 'sex',
      level: 'info',
      title: 'ดูแลสุขภาพทางเพศ',
      body: 'ถุงยางช่วยป้องกันทั้งการตั้งครรภ์และโรคติดต่อทางเพศสัมพันธ์ และการปัสสาวะหลังมีเพศสัมพันธ์ช่วยลดโอกาสติดเชื้อทางเดินปัสสาวะ',
    };
  },
};

export const sexRules: TipRule[] = [
  PAIN_BLEEDING,
  UNPROTECTED_RECENT,
  ANNUAL_CHECKUP,
  SAFE_SEX_TIP,
];
