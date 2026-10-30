import { useEffect, useState } from 'react';
import { Card, SectionTitle } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { RatingScale } from '@/components/RatingScale';
import { getCheckin, upsertCheckin } from '@/db/repositories';
import { todayISO } from '@/lib/date';
import { thShortDate } from '@/lib/format';
import type { Checkin } from '@/domain/types';
import { t } from '@/i18n';

const MOODS = [
  { value: 'happy', label: 'มีความสุข', emoji: '😊' },
  { value: 'calm', label: 'สงบ', emoji: '😌' },
  { value: 'stressed', label: 'เครียด', emoji: '😖' },
  { value: 'irritable', label: 'หงุดหงิด', emoji: '😤' },
  { value: 'sad', label: 'เศร้า', emoji: '😢' },
  { value: 'anxious', label: 'วิตกกังวล', emoji: '😰' },
  { value: 'tired', label: 'เหนื่อย', emoji: '😴' },
  { value: 'sensitive', label: 'ไวต่อความรู้สึก', emoji: '🥺' },
];

const SYMPTOMS = [
  { value: 'cramps', label: 'ปวดท้องประจำเดือน' },
  { value: 'headache', label: 'ปวดหัว/ไมเกรน' },
  { value: 'backache', label: 'ปวดหลัง' },
  { value: 'breast_tender', label: 'เจ็บหน้าอก' },
  { value: 'bloating', label: 'ท้องอืด' },
  { value: 'nausea', label: 'คลื่นไส้' },
  { value: 'dizzy', label: 'เวียนหัว' },
  { value: 'water_retention', label: 'บวมน้ำ' },
  { value: 'insomnia', label: 'นอนไม่หลับ' },
  { value: 'cravings', label: 'อยากอาหารผิดปกติ' },
];

const ILLNESS = [
  { value: 'fever', label: 'ไข้' },
  { value: 'cold', label: 'หวัด' },
  { value: 'infection', label: 'ติดเชื้อ' },
];

const DISCHARGE_TYPES = [
  { value: 'none', label: 'ไม่มี/แห้ง' },
  { value: 'sticky', label: 'เหนียวข้น' },
  { value: 'creamy', label: 'ครีมขาวขุ่น' },
  { value: 'eggwhite', label: 'ใสลื่นคล้ายไข่ขาว' },
  { value: 'watery', label: 'ใสเหลว' },
  { value: 'yellow', label: 'สีเหลือง' },
  { value: 'green', label: 'สีเขียว' },
  { value: 'gray', label: 'สีเทา' },
  { value: 'bloody', label: 'มีเลือดปน/น้ำตาล' },
];

const DISCHARGE_SYMPTOMS = [
  { value: 'itch', label: 'คัน' },
  { value: 'burning', label: 'แสบ' },
  { value: 'irritation', label: 'ระคายเคือง' },
  { value: 'dysuria', label: 'เจ็บเวลาปัสสาวะ' },
];

const ACNE_LOCATIONS = [
  { value: 'forehead', label: 'หน้าผาก' },
  { value: 'cheek', label: 'แก้ม' },
  { value: 'jaw', label: 'คาง-กราม' },
  { value: 'back', label: 'หลัง' },
  { value: 'chest', label: 'อก' },
];

const ACNE_TYPES = [
  { value: 'whitehead', label: 'หัวขาว' },
  { value: 'blackhead', label: 'หัวดำ' },
  { value: 'inflamed', label: 'อักเสบ' },
  { value: 'cystic', label: 'สิวหัวช้าง' },
];

export function LogPage() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<Checkin>({ date });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getCheckin(date).then((c) => {
      if (active) setData(c ?? { date });
    });
    return () => {
      active = false;
    };
  }, [date]);

  function patch(p: Partial<Checkin>) {
    setData((d) => ({ ...d, ...p }));
    setSaved(false);
  }

  async function save() {
    await upsertCheckin({ ...data, date });
    setSaved(true);
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
          Daily Check-in
        </h1>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-slate-800"
        />
      </div>
      <p className="-mt-2 text-sm text-slate-400">{thShortDate(date)} · ข้ามฟิลด์ที่ไม่อยากกรอกได้</p>

      {/* อารมณ์ */}
      <Card>
        <SectionTitle>อารมณ์</SectionTitle>
        <div className="space-y-4">
          <ChipGroup
            multiple
            options={MOODS}
            value={data.moods}
            onChange={(v) => patch({ moods: v })}
          />
          <RatingScale
            label="ระดับอารมณ์โดยรวม (1-5)"
            max={5}
            value={data.moodScore}
            onChange={(v) => patch({ moodScore: v })}
          />
        </div>
      </Card>

      {/* สุขภาพวันนี้ */}
      <Card>
        <SectionTitle>สุขภาพวันนี้</SectionTitle>
        <div className="space-y-4">
          <RatingScale
            label="ระดับพลังงาน (1-5)"
            max={5}
            value={data.energy}
            onChange={(v) => patch({ energy: v })}
          />
          <RatingScale
            label="ระดับความเครียด (1-5)"
            max={5}
            value={data.stress}
            onChange={(v) => patch({ stress: v })}
          />
          <ChipGroup
            label="อาการทางกาย"
            multiple
            options={SYMPTOMS}
            value={data.symptoms}
            onChange={(v) => patch({ symptoms: v })}
          />
          <RatingScale
            label="ระดับความปวด (0-10)"
            min={0}
            max={10}
            value={data.painLevel}
            onChange={(v) => patch({ painLevel: v })}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              อุณหภูมิร่างกาย (°C) · {t.common.optional}
            </p>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="เช่น 36.8"
              value={data.temperatureC ?? ''}
              onChange={(e) =>
                patch({
                  temperatureC: e.target.value ? +e.target.value : undefined,
                })
              }
              className="w-32 rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
          </div>
          <ChipGroup
            label="ไม่สบายอื่น ๆ"
            multiple
            options={ILLNESS}
            value={data.illness}
            onChange={(v) => patch({ illness: v })}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              หมายเหตุ · {t.common.optional}
            </p>
            <textarea
              rows={2}
              value={data.note ?? ''}
              onChange={(e) => patch({ note: e.target.value || undefined })}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
          </div>
        </div>
      </Card>

      {/* ตกขาว */}
      <Card>
        <SectionTitle>ตกขาว</SectionTitle>
        <div className="space-y-4">
          <ChipGroup
            label="ลักษณะ"
            options={DISCHARGE_TYPES}
            value={data.discharge?.type}
            onChange={(v) =>
              patch({ discharge: { ...data.discharge, type: v as any } })
            }
          />
          <ChipGroup
            label="ปริมาณ"
            options={[
              { value: 'light', label: 'น้อย' },
              { value: 'medium', label: 'ปานกลาง' },
              { value: 'heavy', label: 'มาก' },
            ]}
            value={data.discharge?.amount}
            onChange={(v) =>
              patch({ discharge: { ...data.discharge, amount: v as any } })
            }
          />
          <ChipGroup
            label="กลิ่น"
            options={[
              { value: 'normal', label: 'ปกติ' },
              { value: 'abnormal', label: 'ผิดปกติ' },
            ]}
            value={data.discharge?.odor}
            onChange={(v) =>
              patch({ discharge: { ...data.discharge, odor: v as any } })
            }
          />
          <ChipGroup
            label="อาการร่วม"
            multiple
            options={DISCHARGE_SYMPTOMS}
            value={data.discharge?.symptoms}
            onChange={(v) =>
              patch({ discharge: { ...data.discharge, symptoms: v } })
            }
          />
          {data.discharge?.type === 'eggwhite' && (
            <p className="text-xs text-lunara-rose">
              ตกขาวใสลื่นคล้ายไข่ขาวอาจเป็นสัญญาณช่วงใกล้ไข่ตก (ค่าประมาณ)
            </p>
          )}
        </div>
      </Card>

      {/* สิว */}
      <Card>
        <SectionTitle>สิว</SectionTitle>
        <div className="space-y-4">
          <ChipGroup
            label="ระดับ"
            options={[
              { value: 'none', label: 'ไม่มี' },
              { value: 'mild', label: 'น้อย' },
              { value: 'moderate', label: 'ปานกลาง' },
              { value: 'severe', label: 'เยอะ' },
            ]}
            value={data.acne?.severity}
            onChange={(v) =>
              patch({ acne: { ...data.acne, severity: v as any } })
            }
          />
          <ChipGroup
            label="ตำแหน่ง"
            multiple
            options={ACNE_LOCATIONS}
            value={data.acne?.locations}
            onChange={(v) => patch({ acne: { ...data.acne, locations: v } })}
          />
          <ChipGroup
            label="ชนิด"
            multiple
            options={ACNE_TYPES}
            value={data.acne?.types}
            onChange={(v) => patch({ acne: { ...data.acne, types: v } })}
          />
        </div>
      </Card>

      <div className="sticky bottom-20 z-10">
        <button className="btn-primary w-full shadow-lg" onClick={save}>
          {saved ? 'บันทึกแล้ว ✓' : t.common.save}
        </button>
      </div>
    </div>
  );
}
