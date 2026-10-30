import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, SectionTitle } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { RatingScale } from '@/components/RatingScale';
import { TipCard } from '@/components/TipCard';
import { addSexLog, deleteSexLog, listSexLogs } from '@/db/repositories';
import { todayISO } from '@/lib/date';
import { thShortDate } from '@/lib/format';
import type { SexLog } from '@/db/db';

const FEELINGS = [
  { value: 'ok', label: 'สบายดี' },
  { value: 'pain', label: 'เจ็บ' },
  { value: 'bleeding', label: 'มีเลือดออก' },
];

const PROTECTION_LABEL: Record<string, string> = {
  condom: 'ถุงยาง',
  none: 'ไม่ป้องกัน',
  other: 'วิธีอื่น',
};

export function SexLogPage({
  onNeedEmergency,
}: {
  onNeedEmergency: () => void;
}) {
  const logs = useLiveQuery(() => listSexLogs(), []);
  const [privateMode, setPrivateMode] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [protection, setProtection] = useState<string | undefined>();
  const [feeling, setFeeling] = useState<string[]>([]);
  const [libido, setLibido] = useState<number | undefined>();
  const [note, setNote] = useState('');
  const [askEcp, setAskEcp] = useState(false);

  if (!logs) return null;

  async function save() {
    await addSexLog({
      date,
      protection: protection as SexLog['protection'],
      feeling,
      libido,
      note: note || undefined,
      private: true,
    });
    setProtection(undefined);
    setFeeling([]);
    setLibido(undefined);
    setNote('');
    if (protection === 'none') setAskEcp(true);
  }

  // Repeated pain/bleeding across recent logs → see-a-doctor nudge.
  const recentConcern = logs
    .slice(0, 5)
    .filter((l) => l.feeling?.includes('pain') || l.feeling?.includes('bleeding'))
    .length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
          บันทึกเพศสัมพันธ์
        </h1>
        <button
          className="btn-ghost text-sm"
          onClick={() => setPrivateMode((v) => !v)}
        >
          {privateMode ? '🙈 ซ่อนประวัติ' : '👁 แสดงประวัติ'}
        </button>
      </div>

      {askEcp && (
        <TipCard
          level="warn"
          title="ไม่ได้ป้องกัน — พิจารณายาคุมฉุกเฉิน?"
          body="ยาคุมฉุกเฉินควรรีบกินภายใน 72 ชั่วโมง ยิ่งเร็วยิ่งดี และควรพิจารณาตรวจโรคติดต่อทางเพศสัมพันธ์"
          link={{ label: 'ไปหน้าบันทึกยาคุมฉุกเฉิน', href: '#' }}
        />
      )}
      {askEcp && (
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1"
            onClick={() => {
              setAskEcp(false);
              onNeedEmergency();
            }}
          >
            บันทึกยาคุมฉุกเฉิน
          </button>
          <button className="btn-ghost" onClick={() => setAskEcp(false)}>
            ไม่ตอนนี้
          </button>
        </div>
      )}

      <Card>
        <SectionTitle>บันทึกใหม่</SectionTitle>
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              วันที่
            </p>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
          </div>
          <ChipGroup
            label="การป้องกัน"
            options={[
              { value: 'condom', label: 'ถุงยาง' },
              { value: 'none', label: 'ไม่ป้องกัน' },
              { value: 'other', label: 'วิธีอื่น' },
            ]}
            value={protection}
            onChange={setProtection}
          />
          <ChipGroup
            label="ความรู้สึกหลังจากนั้น"
            multiple
            options={FEELINGS}
            value={feeling}
            onChange={setFeeling}
          />
          <RatingScale
            label="ความต้องการทางเพศช่วงนั้น (1-5, ไม่บังคับ)"
            max={5}
            value={libido}
            onChange={setLibido}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              หมายเหตุ (ไม่บังคับ)
            </p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
          </div>
          <button className="btn-primary w-full" onClick={save}>
            บันทึก
          </button>
        </div>
      </Card>

      {recentConcern >= 2 && (
        <TipCard
          level="doctor"
          title="เจ็บ/มีเลือดออกหลังมีเพศสัมพันธ์ซ้ำ ๆ"
          body="มีการบันทึกอาการเจ็บหรือเลือดออกหลายครั้ง แนะนำปรึกษาแพทย์เพื่อตรวจหาสาเหตุ"
        />
      )}

      {!privateMode && logs.length > 0 && (
        <Card>
          <SectionTitle>ประวัติ</SectionTitle>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {thShortDate(l.date)}
                  {l.protection && (
                    <span className="text-slate-400">
                      {' '}· {PROTECTION_LABEL[l.protection]}
                    </span>
                  )}
                </span>
                <button
                  className="text-xs text-tip-doctor"
                  onClick={() => l.id && deleteSexLog(l.id)}
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {privateMode && (
        <p className="text-center text-sm text-slate-400">
          ประวัติถูกซ่อนไว้ · แตะ "แสดงประวัติ" เพื่อดู
        </p>
      )}
    </div>
  );
}
