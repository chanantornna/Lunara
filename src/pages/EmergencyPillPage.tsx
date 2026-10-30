import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, SectionTitle } from '@/components/Card';
import { TipCard } from '@/components/TipCard';
import {
  addEmergencyPill,
  deleteEmergencyPill,
  listEmergencyPills,
} from '@/db/repositories';
import { thShortDate } from '@/lib/format';
import { countInMonth, countInYear } from '@/domain/emergency';

function nowLocalDatetime(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function EmergencyPillPage() {
  const records = useLiveQuery(() => listEmergencyPills(), []);
  const [datetime, setDatetime] = useState(nowLocalDatetime());
  const [reason, setReason] = useState('');

  if (!records) return null;

  const ym = new Date().toISOString().slice(0, 7);
  const year = new Date().toISOString().slice(0, 4);
  const monthCount = countInMonth(records, ym);
  const yearCount = countInYear(records, year);

  async function add() {
    await addEmergencyPill({
      datetime: new Date(datetime).toISOString(),
      reason: reason || undefined,
    });
    setReason('');
    setDatetime(nowLocalDatetime());
  }

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        ยาคุมฉุกเฉิน
      </h1>

      <TipCard
        level="warn"
        title="ยาคุมฉุกเฉินไม่ควรใช้เป็นประจำ"
        body="ควรรีบกินภายใน 72 ชั่วโมงหลังมีเพศสัมพันธ์ที่ไม่ได้ป้องกัน ยิ่งเร็วยิ่งได้ผลดี และควรพิจารณาการคุมกำเนิดที่เชื่อถือได้สำหรับระยะยาว"
      />

      <Card>
        <SectionTitle>บันทึกการใช้</SectionTitle>
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              วัน-เวลา
            </p>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              เหตุผล (ไม่บังคับ)
            </p>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น ถุงยางแตก, ลืมกินยาคุม"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
          </div>
          <button className="btn-primary w-full" onClick={add}>
            บันทึก
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>สรุปความถี่</SectionTitle>
        <div className="flex gap-6">
          <div>
            <p className="text-sm text-slate-400">เดือนนี้</p>
            <p className="text-2xl font-bold text-lunara-rose">{monthCount} ครั้ง</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">ปีนี้</p>
            <p className="text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
              {yearCount} ครั้ง
            </p>
          </div>
        </div>
        {monthCount >= 2 && (
          <p className="mt-3 text-sm text-tip-warn">
            ใช้บ่อยในเดือนนี้ ลองพิจารณาการคุมกำเนิดที่ใช้ได้ต่อเนื่อง และปรึกษาเภสัชกร/แพทย์
          </p>
        )}
      </Card>

      {records.length > 0 && (
        <Card>
          <SectionTitle>ประวัติ</SectionTitle>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {records.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {thShortDate(r.datetime.slice(0, 10))}
                  {r.reason && (
                    <span className="text-slate-400"> · {r.reason}</span>
                  )}
                </span>
                <button
                  className="text-xs text-tip-doctor"
                  onClick={() => r.id && deleteEmergencyPill(r.id)}
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
