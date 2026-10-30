import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { db } from '@/db/db';
import { useProfile } from '@/hooks/useProfile';
import { Card, SectionTitle } from '@/components/Card';
import { addWeight, deleteWeight } from '@/db/repositories';
import { todayISO } from '@/lib/date';
import { thShortDate } from '@/lib/format';
import { calcBMI, bmiCategory } from '@/domain/body';

const BMI_LABEL: Record<string, string> = {
  underweight: 'ต่ำกว่าเกณฑ์',
  normal: 'อยู่ในเกณฑ์',
  overweight: 'สูงกว่าเกณฑ์',
  obese: 'สูงกว่าเกณฑ์มาก',
  unknown: '—',
};

export function StatsPage() {
  const profile = useProfile();
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), []);
  const [input, setInput] = useState('');

  if (!weights) return null;

  const latest = weights[weights.length - 1];
  const bmi =
    latest && profile.heightCm
      ? calcBMI(latest.weightKg, profile.heightCm)
      : 0;
  const category = bmiCategory(bmi);

  const chartData = weights.map((w) => ({
    date: thShortDate(w.date),
    kg: w.weightKg,
  }));

  async function addEntry() {
    const kg = parseFloat(input);
    if (!kg || kg <= 0) return;
    await addWeight({ date: todayISO(), weightKg: kg });
    setInput('');
  }

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        น้ำหนัก &amp; BMI
      </h1>

      <Card>
        <SectionTitle>บันทึกน้ำหนักวันนี้</SectionTitle>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="น้ำหนัก (กก.)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
          />
          <button className="btn-primary" onClick={addEntry}>
            เพิ่ม
          </button>
        </div>
        {!profile.heightCm && (
          <p className="mt-2 text-xs text-lunara-rose">
            ใส่ส่วนสูงในหน้าตั้งค่าเพื่อคำนวณ BMI
          </p>
        )}
      </Card>

      {latest && (
        <Card>
          <SectionTitle>สรุปล่าสุด</SectionTitle>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-sm text-slate-400">น้ำหนัก</p>
              <p className="text-2xl font-bold text-lunara-rose">
                {latest.weightKg} <span className="text-base">กก.</span>
              </p>
            </div>
            {bmi > 0 && (
              <div>
                <p className="text-sm text-slate-400">BMI (ประมาณการ)</p>
                <p className="text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
                  {bmi}{' '}
                  <span className="text-sm font-medium text-slate-400">
                    {BMI_LABEL[category]}
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {chartData.length >= 2 && (
        <Card>
          <SectionTitle>แนวโน้มน้ำหนัก</SectionTitle>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="#e8799f"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {weights.length > 0 && (
        <Card>
          <SectionTitle>ประวัติ</SectionTitle>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {[...weights].reverse().map((w) => (
              <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-500">{thShortDate(w.date)}</span>
                <span className="font-medium">{w.weightKg} กก.</span>
                <button
                  className="text-xs text-tip-doctor"
                  onClick={() => w.id && deleteWeight(w.id)}
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
