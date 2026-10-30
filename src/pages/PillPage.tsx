import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, SectionTitle } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { TipCard } from '@/components/TipCard';
import {
  getPillPlan,
  savePillPlan,
  setPillTaken,
  listPillLogs,
} from '@/db/repositories';
import { todayISO } from '@/lib/date';
import { thShortDate } from '@/lib/format';
import {
  getPackDay,
  isBreakDay,
  activePillsRemaining,
  isRunningLow,
  nextPackStartDate,
  missedPillGuidance,
} from '@/domain/pill';

export function PillPage() {
  const plan = useLiveQuery(() => getPillPlan(), []);
  const logs = useLiveQuery(() => listPillLogs(), []);
  const today = todayISO();
  const [showSetup, setShowSetup] = useState(false);

  if (logs === undefined) return null;

  const hasPlan = plan?.packStartDate && plan.active;

  const takenToday = logs.find((l) => l.date === today)?.taken ?? false;

  // Count consecutive missed active days ending yesterday (simple heuristic).
  let missedCount = 0;
  if (hasPlan && plan?.packStartDate) {
    const p = { packType: plan.packType ?? '21', packStartDate: plan.packStartDate };
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      if (isBreakDay(p, iso)) break;
      const log = logs.find((l) => l.date === iso);
      if (log && !log.taken) missedCount++;
      else if (log && log.taken) break;
      else break; // no record → stop counting
    }
  }

  const p = hasPlan
    ? { packType: plan!.packType ?? '21', packStartDate: plan!.packStartDate! }
    : null;
  const packDay = p ? getPackDay(p, today) : null;
  const breakDay = p ? isBreakDay(p, today) : false;
  const remaining = p ? activePillsRemaining(p, today) : 0;
  const low = p ? isRunningLow(p, today) : false;
  const nextStart = p ? nextPackStartDate(p, today) : null;

  const guidance = missedPillGuidance(missedCount);

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        ยาคุมประจำ
      </h1>

      {!hasPlan || showSetup ? (
        <PillSetup
          initial={plan ?? undefined}
          onDone={() => setShowSetup(false)}
        />
      ) : (
        <>
          <Card>
            <SectionTitle>วันนี้ {thShortDate(today)}</SectionTitle>
            <div className="space-y-3">
              <p className="text-slate-700 dark:text-slate-200">
                แผง {plan!.packType} เม็ด · วันที่{' '}
                <span className="font-bold text-lunara-rose">{packDay}</span> ของแผง
              </p>
              {breakDay ? (
                <p className="rounded-lg bg-lunara-lilac-soft px-3 py-2 text-sm text-lunara-plum dark:bg-slate-700 dark:text-slate-200">
                  ช่วงพักยา / เม็ดแป้ง{' '}
                  {plan!.packType === '28' ? '(กินเม็ดสีต่างต่อได้)' : '(หยุดกิน 7 วัน)'}
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  เหลือเม็ดออกฤทธิ์ในแผงนี้ ~{remaining} เม็ด
                </p>
              )}

              {!breakDay && (
                <button
                  className={takenToday ? 'btn-ghost w-full' : 'btn-primary w-full'}
                  onClick={() => setPillTaken(today, !takenToday)}
                >
                  {takenToday ? 'กินแล้ววันนี้ ✓ (แตะเพื่อยกเลิก)' : 'ติ๊กว่ากินแล้ว'}
                </button>
              )}
            </div>
          </Card>

          {low && (
            <TipCard
              level="warn"
              title="ใกล้หมดแผง"
              body={`เหลือเม็ดออกฤทธิ์อีก ~${remaining} เม็ด เตรียมแผงใหม่ไว้ได้เลย${
                nextStart ? ` แผงถัดไปเริ่ม ${thShortDate(nextStart)}` : ''
              }`}
            />
          )}

          {missedCount > 0 && (
            <TipCard level={guidance.level} title={guidance.title} body={guidance.body} />
          )}

          <Card>
            <SectionTitle>7 วันล่าสุด</SectionTitle>
            <div className="flex justify-between gap-1">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() - (6 - i));
                const iso = d.toISOString().slice(0, 10);
                const log = logs.find((l) => l.date === iso);
                const brk = p ? isBreakDay(p, iso) : false;
                return (
                  <button
                    key={iso}
                    onClick={() => !brk && setPillTaken(iso, !(log?.taken ?? false))}
                    className={`flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-semibold ${
                      brk
                        ? 'bg-lunara-lilac-soft text-lunara-plum/50 dark:bg-slate-700'
                        : log?.taken
                        ? 'bg-lunara-rose text-white'
                        : 'bg-lunara-pink-soft text-slate-400 dark:bg-slate-700'
                    }`}
                    title={iso}
                  >
                    {brk ? '–' : log?.taken ? '✓' : d.getDate()}
                  </button>
                );
              })}
            </div>
          </Card>

          <button className="btn-ghost w-full" onClick={() => setShowSetup(true)}>
            แก้ไข / ตั้งค่าแผงใหม่
          </button>
        </>
      )}

      <p className="px-1 text-xs leading-relaxed text-slate-400">
        ข้อมูลและคำแนะนำเรื่องยาเป็นข้อมูลทั่วไป โปรดอ้างอิงเอกสารกำกับยาหรือปรึกษาเภสัชกร/แพทย์
      </p>
    </div>
  );
}

function PillSetup({
  initial,
  onDone,
}: {
  initial?: import('@/db/db').Pill;
  onDone: () => void;
}) {
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [packType, setPackType] = useState<string | undefined>(initial?.packType ?? '21');
  const [takeTime, setTakeTime] = useState(initial?.takeTime ?? '08:00');
  const [packStartDate, setPackStartDate] = useState(
    initial?.packStartDate ?? todayISO()
  );

  async function save() {
    await savePillPlan({
      brand: brand || undefined,
      packType: packType as '21' | '28',
      takeTime,
      packStartDate,
      active: true,
    });
    onDone();
  }

  return (
    <Card>
      <SectionTitle>ตั้งค่าแผงยาคุม</SectionTitle>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            ยี่ห้อ/ชนิด (ไม่บังคับ)
          </p>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="เช่น Yaz, Diane"
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
          />
        </div>
        <ChipGroup
          label="ชนิดแผง"
          options={[
            { value: '21', label: '21 เม็ด (พัก 7 วัน)' },
            { value: '28', label: '28 เม็ด (มีเม็ดแป้ง)' },
          ]}
          value={packType}
          onChange={setPackType}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            เวลาที่กิน
          </p>
          <input
            type="time"
            value={takeTime}
            onChange={(e) => setTakeTime(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            วันที่เริ่มแผงปัจจุบัน
          </p>
          <input
            type="date"
            value={packStartDate}
            max={todayISO()}
            onChange={(e) => setPackStartDate(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
          />
        </div>
        <button className="btn-primary w-full" onClick={save}>
          บันทึก
        </button>
      </div>
    </Card>
  );
}
