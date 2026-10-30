import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, SectionTitle } from '@/components/Card';
import { RatingScale } from '@/components/RatingScale';
import { TipCard } from '@/components/TipCard';
import { upsertSleep, deleteSleep, listSleeps } from '@/db/repositories';
import { todayISO, addDaysISO } from '@/lib/date';
import { thShortDate } from '@/lib/format';
import { sleepHours, SHORT_SLEEP_THRESHOLD } from '@/domain/sleep';

export function SleepPage() {
  const sleeps = useLiveQuery(() => listSleeps(), []);
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [bedtime, setBedtime] = useState('23:00');
  const [wake, setWake] = useState('07:00');
  const [quality, setQuality] = useState<number | undefined>(3);

  if (!sleeps) return null;

  const hours = sleepHours(bedtime, wake);

  async function save() {
    await upsertSleep({ date, bedtime, wake, hours, quality });
  }

  // Last 7 days chart
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = addDaysISO(today, -(6 - i));
    const rec = sleeps.find((s) => s.date === d);
    return { date: thShortDate(d), hours: rec?.hours ?? 0 };
  });

  // Consecutive short-sleep nights ending today/yesterday
  let shortStreak = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDaysISO(today, -i);
    const rec = sleeps.find((s) => s.date === d);
    if (rec && (rec.hours ?? 0) < SHORT_SLEEP_THRESHOLD) shortStreak++;
    else if (rec) break;
    else if (i > 0) break;
  }

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        การนอน
      </h1>

      <Card>
        <SectionTitle>บันทึกการนอน</SectionTitle>
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              คืนของวันที่
            </p>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
          </div>
          <div className="flex gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                เข้านอน
              </p>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                ตื่น
              </p>
              <input
                type="time"
                value={wake}
                onChange={(e) => setWake(e.target.value)}
                className="rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
              />
            </div>
          </div>
          <p className="text-sm text-slate-500">
            นอนทั้งหมด: <span className="font-semibold">{hours} ชม.</span>
          </p>
          <RatingScale
            label="คุณภาพการนอน (1-5)"
            max={5}
            value={quality}
            onChange={setQuality}
          />
          <button className="btn-primary w-full" onClick={save}>
            บันทึก
          </button>
        </div>
      </Card>

      {shortStreak >= 3 && (
        <TipCard
          level="warn"
          title={`นอนน้อยกว่า 6 ชม. ${shortStreak} คืนติด`}
          body="ลองเข้านอนเร็วขึ้น ลดจอก่อนนอน งดคาเฟอีนช่วงบ่าย และทำห้องให้มืด-เงียบ การนอนพอช่วยทั้งอารมณ์และฮอร์โมน"
        />
      )}

      <Card>
        <SectionTitle>7 วันล่าสุด</SectionTitle>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <ReferenceLine y={8} stroke="#c9b6f0" strokeDasharray="4 4" />
              <Bar dataKey="hours" fill="#e8799f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {sleeps.length > 0 && (
        <Card>
          <SectionTitle>ประวัติ</SectionTitle>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {[...sleeps].reverse().slice(0, 10).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {thShortDate(s.date)} · {s.bedtime}–{s.wake}
                </span>
                <span className="text-slate-400">{s.hours} ชม.</span>
                <button
                  className="text-xs text-tip-doctor"
                  onClick={() => s.id && deleteSleep(s.id)}
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
