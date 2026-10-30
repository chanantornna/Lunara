import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, SectionTitle } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { TipCard } from '@/components/TipCard';
import { useProfile } from '@/hooks/useProfile';
import {
  addWorkout,
  deleteWorkout,
  listWorkouts,
  listWeights,
  getSettings,
} from '@/db/repositories';
import { todayISO } from '@/lib/date';
import { thShortDate } from '@/lib/format';
import {
  estimateWorkoutCalories,
  weeklyWorkoutSummary,
  DEFAULT_WEEKLY_GOAL_MIN,
} from '@/domain/fitness';

const TYPES = [
  { value: 'walk', label: 'เดิน' },
  { value: 'run', label: 'วิ่ง' },
  { value: 'yoga', label: 'โยคะ' },
  { value: 'weights', label: 'เวท' },
  { value: 'swim', label: 'ว่ายน้ำ' },
  { value: 'cycling', label: 'ปั่นจักรยาน' },
  { value: 'other', label: 'อื่น ๆ' },
];

export function ExercisePage() {
  const profile = useProfile();
  const workouts = useLiveQuery(() => listWorkouts(), []);
  const weights = useLiveQuery(() => listWeights(), []);
  const settings = useLiveQuery(() => getSettings(), []);
  const today = todayISO();

  const [type, setType] = useState<string | undefined>('walk');
  const [minutes, setMinutes] = useState('30');
  const [intensity, setIntensity] = useState<string | undefined>('medium');

  if (!workouts) return null;

  const latestWeight =
    weights?.[weights.length - 1]?.weightKg ?? profile.startWeightKg ?? 60;
  const goal = settings?.weeklyWorkoutMinutes ?? DEFAULT_WEEKLY_GOAL_MIN;
  const summary = weeklyWorkoutSummary(workouts, today, goal);

  const estCalories = estimateWorkoutCalories(
    type ?? 'other',
    +minutes || 0,
    latestWeight,
    (intensity as 'low' | 'medium' | 'high') ?? 'medium'
  );

  async function add() {
    if (!minutes || +minutes <= 0) return;
    await addWorkout({
      date: today,
      type,
      minutes: +minutes,
      intensity: intensity as 'low' | 'medium' | 'high',
      calories: estCalories,
    });
    setMinutes('30');
  }

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        ออกกำลังกาย
      </h1>

      <Card>
        <SectionTitle>สรุปสัปดาห์นี้</SectionTitle>
        <div className="mb-2 flex gap-6">
          <Stat label="รวม" value={`${summary.totalMinutes} นาที`} />
          <Stat label="ครั้ง" value={`${summary.sessions}`} />
          <Stat label="เผาผลาญ" value={`~${summary.totalCalories} kcal`} />
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-lunara-pink-soft dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-lunara-rose transition-all"
            style={{ width: `${Math.min(100, summary.progressPct)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          เป้าหมาย {goal} นาที/สัปดาห์ · {summary.progressPct}%
        </p>
      </Card>

      {!summary.goalMet && summary.sessions === 0 && (
        <TipCard
          level="info"
          title="ยังไม่ได้ขยับตัวสัปดาห์นี้"
          body="ไม่เป็นไรเลย เริ่มจากเดินเบา ๆ 10–15 นาทีก็นับว่าดีแล้ว ค่อย ๆ เพิ่มได้ตามสะดวก"
        />
      )}

      <Card>
        <SectionTitle>บันทึกกิจกรรม</SectionTitle>
        <div className="space-y-4">
          <ChipGroup label="ประเภท" options={TYPES} value={type} onChange={setType} />
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              ระยะเวลา (นาที)
            </p>
            <input
              type="number"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-28 rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
          </div>
          <ChipGroup
            label="ความหนัก"
            options={[
              { value: 'low', label: 'เบา' },
              { value: 'medium', label: 'ปานกลาง' },
              { value: 'high', label: 'หนัก' },
            ]}
            value={intensity}
            onChange={setIntensity}
          />
          <p className="text-sm text-slate-500">
            ประมาณการเผาผลาญ: <span className="font-semibold">~{estCalories} kcal</span>
          </p>
          <button className="btn-primary w-full" onClick={add}>
            บันทึก
          </button>
        </div>
      </Card>

      {workouts.length > 0 && (
        <Card>
          <SectionTitle>ประวัติ</SectionTitle>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {workouts.slice(0, 15).map((wkt) => (
              <li key={wkt.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {thShortDate(wkt.date)} ·{' '}
                  {TYPES.find((t) => t.value === wkt.type)?.label ?? wkt.type}
                </span>
                <span className="text-slate-400">
                  {wkt.minutes} นาที · ~{wkt.calories} kcal
                </span>
                <button
                  className="text-xs text-tip-doctor"
                  onClick={() => wkt.id && deleteWorkout(wkt.id)}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-bold text-lunara-rose">{value}</p>
    </div>
  );
}
