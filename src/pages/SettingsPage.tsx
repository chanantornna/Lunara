import { useLiveQuery } from 'dexie-react-hooks';
import { useProfile } from '@/hooks/useProfile';
import { Card, SectionTitle } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { saveProfile, getSettings } from '@/db/repositories';
import { seedSampleData, removeSampleData } from '@/db/seed';
import { ageFromBirthDate } from '@/domain/body';
import { useTheme } from '@/hooks/useTheme';
import { t } from '@/i18n';
import type { Theme } from '@/domain/types';

export function SettingsPage() {
  const profile = useProfile();
  const settings = useLiveQuery(() => getSettings(), []);
  const { theme, setTheme } = useTheme();
  const age = ageFromBirthDate(profile.birthDate);

  async function toggleSeed() {
    if (settings?.seedEnabled) await removeSampleData();
    else await seedSampleData();
  }

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        ตั้งค่า
      </h1>

      <Card>
        <SectionTitle>โปรไฟล์</SectionTitle>
        <div className="space-y-4">
          <Field label={`วันเกิด${age ? ` (อายุ ${age} ปี)` : ''}`}>
            <input
              type="date"
              value={profile.birthDate ?? ''}
              onChange={(e) => saveProfile({ birthDate: e.target.value || undefined })}
              className={inputCls}
            />
          </Field>
          <Field label="ส่วนสูง (ซม.)">
            <input
              type="number"
              inputMode="decimal"
              value={profile.heightCm ?? ''}
              onChange={(e) =>
                saveProfile({ heightCm: e.target.value ? +e.target.value : undefined })
              }
              className={inputCls}
            />
          </Field>
          <Field label="น้ำหนักเริ่มต้น (กก.)">
            <input
              type="number"
              inputMode="decimal"
              value={profile.startWeightKg ?? ''}
              onChange={(e) =>
                saveProfile({
                  startWeightKg: e.target.value ? +e.target.value : undefined,
                })
              }
              className={inputCls}
            />
          </Field>
          <ChipGroup
            label="เป้าหมาย"
            options={[
              { value: 'health', label: 'สุขภาพดี' },
              { value: 'maintain', label: 'คงน้ำหนัก' },
              { value: 'lose', label: 'ลดน้ำหนัก' },
              { value: 'gain', label: 'เพิ่มน้ำหนัก' },
            ]}
            value={profile.goal}
            onChange={(v) => saveProfile({ goal: v as any })}
          />
          <ChipGroup
            label="ระดับกิจกรรม"
            options={[
              { value: 'sedentary', label: 'นั่งเป็นหลัก' },
              { value: 'light', label: 'เบา' },
              { value: 'moderate', label: 'ปานกลาง' },
              { value: 'active', label: 'มาก' },
              { value: 'very_active', label: 'มากที่สุด' },
            ]}
            value={profile.activityLevel}
            onChange={(v) => saveProfile({ activityLevel: v as any })}
          />
          <ChipGroup
            label="ใช้ยาคุมอยู่หรือไม่"
            options={[
              { value: 'yes', label: 'ใช้อยู่' },
              { value: 'no', label: 'ไม่ได้ใช้' },
            ]}
            value={
              profile.onBirthControl === undefined
                ? undefined
                : profile.onBirthControl
                ? 'yes'
                : 'no'
            }
            onChange={(v) =>
              saveProfile({ onBirthControl: v === undefined ? undefined : v === 'yes' })
            }
          />
          {profile.onBirthControl && (
            <p className="text-xs text-slate-400">
              เมื่อใช้ยาคุม การคาดการณ์ช่วงไข่ตกจะไม่แสดง เพราะไม่ได้เป็นไปตามรอบธรรมชาติ
            </p>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>การแสดงผล</SectionTitle>
        <ChipGroup
          label="ธีม"
          options={[
            { value: 'system', label: 'ตามระบบ' },
            { value: 'light', label: 'สว่าง' },
            { value: 'dark', label: 'มืด' },
          ]}
          value={theme}
          onChange={(v) => v && setTheme(v as Theme)}
        />
      </Card>

      <Card>
        <SectionTitle>ข้อมูลตัวอย่าง</SectionTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          เปิดเพื่อใส่ข้อมูลตัวอย่างสำหรับทดสอบกราฟและการคำนวณ (เขียนทับข้อมูลรอบเดือน/น้ำหนัก/check-in ปัจจุบัน)
        </p>
        <button className="btn-primary" onClick={toggleSeed}>
          {settings?.seedEnabled ? 'ลบข้อมูลตัวอย่าง' : 'ใส่ข้อมูลตัวอย่าง'}
        </button>
      </Card>

      <Card>
        <SectionTitle>ความเป็นส่วนตัว</SectionTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          ข้อมูลทั้งหมดเก็บในเครื่องของคุณเท่านั้น ไม่ถูกส่งไปเซิร์ฟเวอร์ใด ๆ และไม่มีการติดตาม (tracking)
        </p>
        <p className="mt-2 text-xs text-slate-400">
          PIN ล็อก, export/import และลบข้อมูลทั้งหมด จะมาในเฟสถัดไป
        </p>
      </Card>

      <Card className="bg-tip-warn/10 ring-tip-warn/30">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          ⚠️ {t.disclaimer}
        </p>
      </Card>

      <p className="pb-2 text-center text-xs text-slate-400">
        {t.appName} · เก็บข้อมูลในเครื่อง · v0.1.0 (เฟส 1)
      </p>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </p>
      {children}
    </div>
  );
}
