import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useProfile } from '@/hooks/useProfile';
import { Card, SectionTitle } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import {
  addPeriod,
  upsertPeriodDay,
  listPeriods,
  listPeriodDays,
} from '@/db/repositories';
import { fromISO, toISO, addDaysISO } from '@/lib/date';
import { thMonthYear, thShortDate } from '@/lib/format';
import {
  getAverageCycleLength,
  getCycleRegularity,
  predictNextPeriod,
  getFertileWindow,
} from '@/domain/cycle';
import type { Flow, BloodType } from '@/domain/types';

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const REGULARITY_LABEL: Record<string, string> = {
  regular: 'ค่อนข้างสม่ำเสมอ',
  irregular: 'ไม่ค่อยสม่ำเสมอ',
  unknown: 'ข้อมูลยังไม่พอ',
};

export function CalendarPage() {
  const profile = useProfile();
  const periods = useLiveQuery(() => listPeriods(), []);
  const periodDays = useLiveQuery(() => listPeriodDays(), []);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);

  if (!periods || !periodDays) return null;

  const avgLen = getAverageCycleLength(periods, 28, profile.avgCycleLengthOverride);
  const regularity = getCycleRegularity(periods);
  const next = predictNextPeriod(periods, avgLen);
  const fertile = getFertileWindow(periods, avgLen, {
    onBirthControl: profile.onBirthControl,
  });

  const periodDates = new Set<string>();
  periods.forEach((p) => {
    const start = p.startDate;
    const end = p.endDate ?? p.startDate;
    let cur = start;
    let guard = 0;
    while (cur <= end && guard < 15) {
      periodDates.add(cur);
      cur = addDaysISO(cur, 1);
      guard++;
    }
  });
  const periodDayMap = new Map(periodDays.map((d) => [d.date, d]));

  // Build calendar grid
  const firstDay = new Date(viewDate.year, viewDate.month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toISO(new Date(viewDate.year, viewDate.month, d)));
  }

  function classFor(iso: string): string {
    if (periodDates.has(iso)) return 'bg-lunara-rose text-white';
    if (next && iso === next) return 'ring-2 ring-lunara-rose text-lunara-rose';
    if (fertile && iso >= fertile.fertileStart && iso <= fertile.fertileEnd)
      return 'bg-lunara-lilac-soft text-lunara-plum dark:bg-lunara-lilac/30';
    if (fertile && iso === fertile.ovulation)
      return 'bg-lunara-lilac text-white';
    return 'text-slate-700 dark:text-slate-200';
  }

  function prevMonth() {
    setViewDate((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }
    );
  }
  function nextMonth() {
    setViewDate((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        ปฏิทินรอบเดือน
      </h1>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button className="btn-ghost" onClick={prevMonth} aria-label="เดือนก่อน">
            ‹
          </button>
          <span className="font-semibold text-lunara-plum dark:text-lunara-lilac">
            {thMonthYear(viewDate.year, viewDate.month)}
          </span>
          <button className="btn-ghost" onClick={nextMonth} aria-label="เดือนถัดไป">
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((iso, i) =>
            iso === null ? (
              <div key={i} />
            ) : (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={`relative aspect-square rounded-lg text-sm font-medium ${classFor(
                  iso
                )} ${selected === iso ? 'outline outline-2 outline-lunara-plum' : ''}`}
              >
                {fromISO(iso).getDate()}
                {periodDayMap.get(iso) && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/80" />
                )}
              </button>
            )
          )}
        </div>

        <Legend />
      </Card>

      {selected && (
        <DayEditor
          date={selected}
          existing={periodDayMap.get(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      <Card>
        <SectionTitle>สรุปรอบเดือน</SectionTitle>
        <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
          <li>ความยาวรอบเฉลี่ย: ~{avgLen} วัน (ประมาณการ)</li>
          <li>ความสม่ำเสมอ: {REGULARITY_LABEL[regularity]}</li>
          {next && <li>คาดการณ์ประจำเดือนถัดไป: {thShortDate(next)}</li>}
        </ul>
      </Card>
    </div>
  );
}

function Legend() {
  const items = [
    { c: 'bg-lunara-rose', label: 'มีประจำเดือน' },
    { c: 'ring-2 ring-lunara-rose', label: 'คาดการณ์' },
    { c: 'bg-lunara-lilac', label: 'ไข่ตก (ประมาณ)' },
    { c: 'bg-lunara-lilac-soft', label: 'ช่วงเจริญพันธุ์' },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1">
          <span className={`h-3 w-3 rounded-full ${it.c}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function DayEditor({
  date,
  existing,
  onClose,
}: {
  date: string;
  existing?: { flow?: Flow; bloodType?: BloodType };
  onClose: () => void;
}) {
  const [flow, setFlow] = useState<string | undefined>(existing?.flow);
  const [bloodType, setBloodType] = useState<string | undefined>(
    existing?.bloodType
  );

  async function startPeriodHere() {
    await addPeriod({ startDate: date });
    onClose();
  }

  async function saveDay() {
    await upsertPeriodDay({
      date,
      flow: flow as Flow | undefined,
      bloodType: bloodType as BloodType | undefined,
    });
    onClose();
  }

  return (
    <Card className="border-2 border-lunara-pink">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>บันทึกวันที่ {thShortDate(date)}</SectionTitle>
        <button className="btn-ghost" onClick={onClose}>
          ปิด
        </button>
      </div>

      <div className="space-y-4">
        <ChipGroup
          label="ปริมาณ"
          options={[
            { value: 'light', label: 'น้อย' },
            { value: 'medium', label: 'ปานกลาง' },
            { value: 'heavy', label: 'มาก' },
          ]}
          value={flow}
          onChange={setFlow}
        />
        <ChipGroup
          label="ลักษณะเลือด"
          options={[
            { value: 'fresh', label: 'แดงสด' },
            { value: 'dark', label: 'คล้ำ' },
            { value: 'clots', label: 'มีลิ่ม' },
          ]}
          value={bloodType}
          onChange={setBloodType}
        />

        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={saveDay}>
            บันทึกวันนี้
          </button>
          <button className="btn-ghost" onClick={startPeriodHere}>
            ตั้งเป็นวันเริ่มรอบ
          </button>
        </div>
        <p className="text-xs text-slate-400">
          แตะ "ตั้งเป็นวันเริ่มรอบ" เมื่อประจำเดือนเริ่มในวันนี้ เพื่อให้คำนวณรอบได้แม่นขึ้น
        </p>
      </div>
    </Card>
  );
}
