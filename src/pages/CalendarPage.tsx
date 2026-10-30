import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useProfile } from '@/hooks/useProfile';
import { Card, SectionTitle } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import {
  addPeriod,
  updatePeriod,
  deletePeriod,
  upsertPeriodDay,
  listPeriods,
  listPeriodDays,
} from '@/db/repositories';
import { fromISO, toISO, addDaysISO, daysBetween } from '@/lib/date';
import { thMonthYear, thShortDate } from '@/lib/format';
import {
  getAverageCycleLength,
  getCycleRegularity,
  predictNextPeriod,
  getFertileWindow,
} from '@/domain/cycle';
import type { Flow, BloodType, Period } from '@/domain/types';

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
          periods={periods}
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
  periods,
  onClose,
}: {
  date: string;
  existing?: { flow?: Flow; bloodType?: BloodType };
  periods: Period[];
  onClose: () => void;
}) {
  const [flow, setFlow] = useState<string | undefined>(existing?.flow);
  const [bloodType, setBloodType] = useState<string | undefined>(
    existing?.bloodType
  );

  // Is this exact day already a recorded period start?
  const startHere = periods.find((p) => p.startDate === date);

  // The most recent period that began on or before this day (so we can set
  // this day as its end date).
  const owningPeriod = [...periods]
    .filter((p) => p.startDate <= date)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];

  async function setAsStart() {
    if (startHere) return;
    // Prevent an overlapping duplicate: if another start is within 2 days,
    // move that one instead of adding a near-duplicate.
    const nearby = periods.find(
      (p) =>
        Math.abs(daysBetween(p.startDate, date)) <= 2 && p.startDate !== date
    );
    if (
      nearby?.id &&
      confirm(
        `มีวันเริ่มรอบใกล้ ๆ (${thShortDate(nearby.startDate)}) อยู่แล้ว ต้องการย้ายมาเป็นวันนี้แทนไหม?`
      )
    ) {
      await updatePeriod(nearby.id, { startDate: date, endDate: undefined });
    } else {
      await addPeriod({ startDate: date });
    }
    onClose();
  }

  async function removeStart() {
    if (!startHere?.id) return;
    if (!confirm(`ลบวันเริ่มรอบ ${thShortDate(date)} ออกไหม?`)) return;
    await deletePeriod(startHere.id);
    onClose();
  }

  async function setAsEnd() {
    if (!owningPeriod?.id) return;
    if (date < owningPeriod.startDate) return;
    await updatePeriod(owningPeriod.id, { endDate: date });
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
        {/* Period start management */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            วันเริ่มรอบ
          </p>
          {startHere ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-lunara-rose px-3 py-1.5 text-sm font-medium text-white">
                ✓ เป็นวันเริ่มรอบแล้ว
              </span>
              <button className="btn-ghost text-tip-doctor" onClick={removeStart}>
                ลบวันเริ่มรอบ
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={setAsStart}>
              ตั้งเป็นวันเริ่มรอบ
            </button>
          )}
        </div>

        {/* Set this day as the end of the current period */}
        {owningPeriod && !startHere && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              วันสิ้นสุดรอบ
            </p>
            <button className="btn-ghost" onClick={setAsEnd}>
              ตั้งเป็นวันสิ้นสุดของรอบที่เริ่ม {thShortDate(owningPeriod.startDate)}
            </button>
          </div>
        )}

        <hr className="border-black/5 dark:border-white/10" />

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

        <button className="btn-primary w-full" onClick={saveDay}>
          บันทึกปริมาณ/ลักษณะเลือด
        </button>
        <p className="text-xs text-slate-400">
          แตะวันในปฏิทินเพื่อแก้ไขได้ทุกวัน · ตั้ง/ลบ/ย้ายวันเริ่มรอบได้ที่นี่
        </p>
      </div>
    </Card>
  );
}
