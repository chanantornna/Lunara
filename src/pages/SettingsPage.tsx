import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useProfile } from '@/hooks/useProfile';
import { Card, SectionTitle } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { saveProfile, getSettings, saveSettings, clearAllData } from '@/db/repositories';
import { seedSampleData, removeSampleData } from '@/db/seed';
import { ageFromBirthDate } from '@/domain/body';
import { useTheme } from '@/hooks/useTheme';
import { TIP_CATEGORIES } from '@/domain/tips/engine';
import {
  exportJSON,
  importJSON,
  exportCheckinsCSV,
  downloadText,
  type ExportBundle,
} from '@/db/dataIO';
import { hashPin } from '@/lib/pin';
import {
  requestPermission,
  permissionStatus,
  scheduleReminders,
  notifySupported,
} from '@/lib/notify';
import { t } from '@/i18n';
import type { Theme } from '@/domain/types';

export function SettingsPage() {
  const profile = useProfile();
  const settings = useLiveQuery(() => getSettings(), []);
  const { theme, setTheme } = useTheme();
  const age = ageFromBirthDate(profile.birthDate);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pinInput, setPinInput] = useState('');
  const [notifPerm, setNotifPerm] = useState(permissionStatus());

  async function toggleSeed() {
    if (settings?.seedEnabled) await removeSampleData();
    else await seedSampleData();
  }

  async function toggleTipCategory(id: string, enabled: boolean) {
    const current = settings?.tipCategories ?? {};
    await saveSettings({ tipCategories: { ...current, [id]: enabled } });
  }

  async function handleExportJSON() {
    const bundle = await exportJSON();
    downloadText(
      `lunara-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(bundle, null, 2)
    );
  }

  async function handleExportCSV() {
    const csv = await exportCheckinsCSV();
    downloadText(
      `lunara-checkins-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      'text/csv'
    );
  }

  async function handleImport(file: File) {
    try {
      const bundle = JSON.parse(await file.text()) as ExportBundle;
      await importJSON(bundle);
      alert('นำเข้าข้อมูลสำเร็จ');
    } catch (e) {
      alert(`นำเข้าไม่สำเร็จ: ${(e as Error).message}`);
    }
  }

  async function handleDeleteAll() {
    if (!confirm('ลบข้อมูลทั้งหมดถาวร? การกระทำนี้ย้อนกลับไม่ได้')) return;
    if (!confirm('ยืนยันอีกครั้ง: ข้อมูลทั้งหมดจะถูกลบ')) return;
    await clearAllData();
    alert('ลบข้อมูลทั้งหมดแล้ว');
  }

  async function setPin() {
    if (pinInput.length < 4) {
      alert('PIN ต้องมีอย่างน้อย 4 หลัก');
      return;
    }
    await saveSettings({ pinHash: await hashPin(pinInput) });
    setPinInput('');
    alert('ตั้ง PIN แล้ว ครั้งถัดไปที่เปิดแอพจะต้องใส่ PIN');
  }

  async function removePin() {
    await saveSettings({ pinHash: undefined });
    alert('ปิดการล็อกด้วย PIN แล้ว');
  }

  async function enableNotifications() {
    const perm = await requestPermission();
    setNotifPerm(perm);
  }

  async function toggleNotif(type: 'pill' | 'checkin', enabled: boolean, time: string) {
    const current = settings?.notifications ?? {};
    const next = { ...current, [type]: { enabled, time } };
    await saveSettings({ notifications: next });
    scheduleReminders(next);
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
        <SectionTitle>คำแนะนำ (Tips)</SectionTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          เลือกหมวดคำแนะนำที่อยากให้แสดงในหน้าแรก
        </p>
        <div className="space-y-2">
          {TIP_CATEGORIES.map((cat) => {
            const enabled = settings?.tipCategories?.[cat.id] !== false;
            return (
              <label
                key={cat.id}
                className="flex items-center justify-between rounded-lg bg-lunara-pink-soft px-3 py-2 dark:bg-slate-700"
              >
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {cat.label}
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => toggleTipCategory(cat.id, e.target.checked)}
                  className="h-5 w-5 accent-lunara-rose"
                />
              </label>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle>แจ้งเตือน</SectionTitle>
        {!notifySupported() ? (
          <p className="text-sm text-slate-400">เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน</p>
        ) : notifPerm !== 'granted' ? (
          <button className="btn-primary" onClick={enableNotifications}>
            อนุญาตการแจ้งเตือน
          </button>
        ) : (
          <div className="space-y-3">
            <NotifRow
              label="เตือนกินยาคุม"
              entry={settings?.notifications?.pill}
              onChange={(en, time) => toggleNotif('pill', en, time)}
            />
            <NotifRow
              label="เตือน Daily Check-in"
              entry={settings?.notifications?.checkin}
              onChange={(en, time) => toggleNotif('checkin', en, time)}
            />
            <p className="text-xs text-slate-400">
              การแจ้งเตือนจะแสดงข้อความทั่วไป (ไม่เผยข้อมูลอ่อนไหว) และทำงานขณะเปิดแอพไว้
            </p>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>ความเป็นส่วนตัว</SectionTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          ข้อมูลทั้งหมดเก็บในเครื่องของคุณเท่านั้น ไม่ถูกส่งไปเซิร์ฟเวอร์ใด ๆ และไม่มีการติดตาม
        </p>

        <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          ล็อกด้วย PIN
        </p>
        {settings?.pinHash ? (
          <button className="btn-ghost mb-4" onClick={removePin}>
            ปิดการล็อกด้วย PIN
          </button>
        ) : (
          <div className="mb-4 flex gap-2">
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="ตั้ง PIN (4+ หลัก)"
              className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
            <button className="btn-primary" onClick={setPin}>
              ตั้ง
            </button>
          </div>
        )}

        <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          สำรอง / นำเข้าข้อมูล
        </p>
        <div className="mb-2 flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={handleExportJSON}>
            Export JSON
          </button>
          <button className="btn-ghost" onClick={handleExportCSV}>
            Export CSV
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </Card>

      <Card className="bg-tip-doctor/10 ring-tip-doctor/30">
        <SectionTitle>ลบข้อมูล</SectionTitle>
        <button
          className="rounded-full bg-tip-doctor px-5 py-2.5 font-semibold text-white active:scale-95"
          onClick={handleDeleteAll}
        >
          ลบข้อมูลทั้งหมด
        </button>
      </Card>

      <Card className="bg-tip-warn/10 ring-tip-warn/30">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          ⚠️ {t.disclaimer}
        </p>
      </Card>

      <p className="pb-2 text-center text-xs text-slate-400">
        {t.appName} · เก็บข้อมูลในเครื่อง · v1.0.0 (เฟส 1–4)
      </p>
    </div>
  );
}

function NotifRow({
  label,
  entry,
  onChange,
}: {
  label: string;
  entry?: { enabled: boolean; time?: string };
  onChange: (enabled: boolean, time: string) => void;
}) {
  const time = entry?.time ?? '08:00';
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={time}
          onChange={(e) => onChange(entry?.enabled ?? false, e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-slate-800"
        />
        <input
          type="checkbox"
          checked={entry?.enabled ?? false}
          onChange={(e) => onChange(e.target.checked, time)}
          className="h-5 w-5 accent-lunara-rose"
        />
      </div>
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
