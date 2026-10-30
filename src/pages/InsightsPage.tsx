import { useLiveQuery } from 'dexie-react-hooks';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { db } from '@/db/db';
import { Card, SectionTitle } from '@/components/Card';
import { useProfile } from '@/hooks/useProfile';
import { todayISO, addDaysISO } from '@/lib/date';
import { thShortDate } from '@/lib/format';
import {
  getAverageCycleLength,
  getCycleRegularity,
  getCurrentCycleDay,
} from '@/domain/cycle';
import type { View } from '@/App';

const REGULARITY_LABEL: Record<string, string> = {
  regular: 'ค่อนข้างสม่ำเสมอ',
  irregular: 'ไม่ค่อยสม่ำเสมอ',
  unknown: 'ข้อมูลยังไม่พอ',
};

export function InsightsPage({ onNavigate }: { onNavigate: (v: View) => void }) {
  const profile = useProfile();
  const periods = useLiveQuery(() => db.periods.orderBy('startDate').toArray(), []);
  const checkins = useLiveQuery(() => db.checkins.orderBy('date').toArray(), []);
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), []);
  const sleeps = useLiveQuery(() => db.sleeps.toArray(), []);
  const today = todayISO();

  if (!periods || !checkins || !weights || !sleeps) return null;

  const avgLen = getAverageCycleLength(periods, 28, profile.avgCycleLengthOverride);
  const regularity = getCycleRegularity(periods);

  // Mood vs day-of-cycle scatter-ish (averaged by cycle day bucket)
  const moodByDay = checkins
    .filter((c) => c.moodScore != null)
    .map((c) => ({
      day: getCurrentCycleDay(periods, c.date) ?? 0,
      mood: c.moodScore!,
    }))
    .filter((x) => x.day > 0);

  // 30-day mood trend
  const moodTrend = Array.from({ length: 30 }, (_, i) => {
    const d = addDaysISO(today, -(29 - i));
    const c = checkins.find((x) => x.date === d);
    return { date: thShortDate(d), mood: c?.moodScore ?? null };
  }).filter((x) => x.mood != null);

  // Sleep 14-day
  const sleepTrend = Array.from({ length: 14 }, (_, i) => {
    const d = addDaysISO(today, -(13 - i));
    const s = sleeps.find((x) => x.date === d);
    return { date: thShortDate(d), hours: s?.hours ?? 0 };
  });

  const weightTrend = weights.map((w) => ({
    date: thShortDate(w.date),
    kg: w.weightKg,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
          รายงาน &amp; Insights
        </h1>
        <div className="flex gap-1 print:hidden">
          <button className="btn-ghost text-sm" onClick={() => onNavigate('weight')}>
            ⚖️ น้ำหนัก
          </button>
          <button className="btn-ghost text-sm" onClick={() => window.print()}>
            🖨 PDF
          </button>
        </div>
      </div>

      <Card>
        <SectionTitle>สรุปรอบเดือน</SectionTitle>
        <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
          <li>ความยาวรอบเฉลี่ย: ~{avgLen} วัน (ประมาณการ)</li>
          <li>ความสม่ำเสมอ: {REGULARITY_LABEL[regularity]}</li>
          <li>จำนวนรอบที่บันทึก: {periods.length}</li>
        </ul>
      </Card>

      {moodTrend.length >= 2 && (
        <Card>
          <SectionTitle>อารมณ์ 30 วัน</SectionTitle>
          <ChartBox>
            <LineChart data={moodTrend} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={tick} interval="preserveStartEnd" />
              <YAxis domain={[1, 5]} tick={tick} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="#c9b6f0" strokeWidth={2.5} dot={{ r: 2 }} />
            </LineChart>
          </ChartBox>
        </Card>
      )}

      {moodByDay.length >= 3 && (
        <Card>
          <SectionTitle>อารมณ์ตามวันของรอบ</SectionTitle>
          <ChartBox>
            <BarChart data={bucketMood(moodByDay)} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="bucket" tick={tick} />
              <YAxis domain={[0, 5]} tick={tick} />
              <Tooltip />
              <Bar dataKey="avg" fill="#e8799f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartBox>
          <p className="mt-1 text-xs text-slate-400">
            ค่าเฉลี่ยอารมณ์ (1-5) ในแต่ละช่วงของรอบเดือน
          </p>
        </Card>
      )}

      {sleepTrend.some((s) => s.hours > 0) && (
        <Card>
          <SectionTitle>การนอน 14 วัน</SectionTitle>
          <ChartBox>
            <BarChart data={sleepTrend} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={tick} interval="preserveStartEnd" />
              <YAxis tick={tick} />
              <Tooltip />
              <Bar dataKey="hours" fill="#5aa9e6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartBox>
        </Card>
      )}

      {weightTrend.length >= 2 && (
        <Card>
          <SectionTitle>น้ำหนัก</SectionTitle>
          <ChartBox>
            <LineChart data={weightTrend} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={tick} interval="preserveStartEnd" />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={tick} />
              <Tooltip />
              <Line type="monotone" dataKey="kg" stroke="#e8799f" strokeWidth={2.5} dot={{ r: 2 }} />
            </LineChart>
          </ChartBox>
        </Card>
      )}

      <p className="px-1 text-xs leading-relaxed text-slate-400">
        รายงานนี้เป็นค่าประมาณจากข้อมูลที่บันทึก สามารถกด "PDF" เพื่อบันทึก/พิมพ์ไปให้แพทย์ดูได้
      </p>
    </div>
  );
}

function bucketMood(data: { day: number; mood: number }[]) {
  const buckets = [
    { bucket: 'วัน 1-7', lo: 1, hi: 7 },
    { bucket: 'วัน 8-14', lo: 8, hi: 14 },
    { bucket: 'วัน 15-21', lo: 15, hi: 21 },
    { bucket: 'วัน 22+', lo: 22, hi: 999 },
  ];
  return buckets.map((b) => {
    const vals = data.filter((d) => d.day >= b.lo && d.day <= b.hi).map((d) => d.mood);
    const avg = vals.length ? +(vals.reduce((a, c) => a + c, 0) / vals.length).toFixed(1) : 0;
    return { bucket: b.bucket, avg };
  });
}

const chartMargin = { top: 8, right: 8, left: -20, bottom: 0 };
const tick = { fontSize: 10 };

function ChartBox({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
