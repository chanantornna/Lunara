import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, SectionTitle } from '@/components/Card';
import { TipCard } from '@/components/TipCard';
import { useProfile } from '@/hooks/useProfile';
import {
  addMeal,
  deleteMeal,
  listMealsByDate,
  listWeights,
  listWorkouts,
  listWaterByDate,
  addWater,
  getSettings,
} from '@/db/repositories';
import { todayISO } from '@/lib/date';
import {
  calcBMR,
  calcTDEE,
  safeCalorieTarget,
  ageFromBirthDate,
} from '@/domain/body';
import {
  summarizeDay,
  totalWater,
  scalePortion,
  DEFAULT_WATER_GOAL_ML,
} from '@/domain/nutrition';
import { THAI_FOODS, type FoodItem } from '@/domain/foodDb';

export function NutritionPage() {
  const profile = useProfile();
  const today = todayISO();
  const meals = useLiveQuery(() => listMealsByDate(today), [today]);
  const weights = useLiveQuery(() => listWeights(), []);
  const workouts = useLiveQuery(() => listWorkouts(), []);
  const water = useLiveQuery(() => listWaterByDate(today), [today]);
  const settings = useLiveQuery(() => getSettings(), []);

  const [search, setSearch] = useState('');
  const [picker, setPicker] = useState(false);

  const latestWeight =
    weights?.[weights.length - 1]?.weightKg ?? profile.startWeightKg ?? 0;
  const age = ageFromBirthDate(profile.birthDate);

  const target = useMemo(() => {
    if (!latestWeight || !profile.heightCm || !age || !profile.activityLevel)
      return 0;
    const bmr = calcBMR(latestWeight, profile.heightCm, age);
    const tdee = calcTDEE(bmr, profile.activityLevel);
    return safeCalorieTarget(tdee, profile.goal ?? 'maintain', bmr);
  }, [latestWeight, profile.heightCm, age, profile.activityLevel, profile.goal]);

  const burnedToday =
    workouts
      ?.filter((w) => w.date === today)
      .reduce((s, w) => s + (w.calories ?? 0), 0) ?? 0;

  const summary = summarizeDay(meals ?? [], burnedToday, target);
  const waterMl = totalWater(water ?? []);
  const waterGoal = settings?.dailyWaterMl ?? DEFAULT_WATER_GOAL_ML;

  const filtered = search
    ? THAI_FOODS.filter((f) => f.name.includes(search))
    : THAI_FOODS;

  if (meals === undefined) return null;

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        อาหาร &amp; แคลอรี่
      </h1>

      {target > 0 ? (
        <Card>
          <SectionTitle>วันนี้</SectionTitle>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <Metric label="กินเข้า" value={summary.eaten} unit="kcal" />
            <Metric label="เผาผลาญ" value={summary.burned} unit="kcal" />
            <Metric label="เป้า" value={summary.target} unit="kcal" />
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-lunara-pink-soft dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all ${
                summary.net > summary.target ? 'bg-tip-warn' : 'bg-lunara-rose'
              }`}
              style={{
                width: `${Math.min(100, (summary.net / summary.target) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {summary.remaining >= 0
              ? `เหลืออีก ~${summary.remaining} kcal`
              : `เกินเป้า ~${-summary.remaining} kcal`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            โปรตีน {summary.protein}g · คาร์บ {summary.carbs}g · ไขมัน {summary.fat}g
          </p>
        </Card>
      ) : (
        <TipCard
          level="info"
          title="ตั้งค่าโปรไฟล์เพื่อคำนวณเป้าแคลอรี่"
          body="ใส่วันเกิด ส่วนสูง น้ำหนัก และระดับกิจกรรมในหน้าตั้งค่า เพื่อให้คำนวณ BMR/TDEE และเป้าที่ปลอดภัย"
        />
      )}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle>มื้ออาหารวันนี้</SectionTitle>
          <button className="btn-ghost text-sm" onClick={() => setPicker((v) => !v)}>
            {picker ? 'ปิด' : '+ เพิ่มอาหาร'}
          </button>
        </div>

        {picker && (
          <div className="mb-3 rounded-xl2 bg-lunara-pink-soft p-3 dark:bg-slate-700">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาอาหาร เช่น ข้าว, กะเพรา"
              className="mb-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-800"
            />
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {filtered.map((f) => (
                <FoodRow key={f.id} food={f} date={today} />
              ))}
              <CustomFoodRow date={today} />
            </div>
          </div>
        )}

        {meals.length === 0 ? (
          <p className="text-sm text-slate-400">ยังไม่มีมื้ออาหารวันนี้</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {meals.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <span>{m.name}</span>
                <span className="text-slate-400">{m.calories} kcal</span>
                <button
                  className="text-xs text-tip-doctor"
                  onClick={() => m.id && deleteMeal(m.id)}
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle>น้ำดื่ม</SectionTitle>
        <p className="mb-2 text-slate-700 dark:text-slate-200">
          <span className="text-2xl font-bold text-lunara-rose">{waterMl}</span>
          <span className="text-sm"> / {waterGoal} ml</span>
        </p>
        <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-lunara-pink-soft dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-tip-info transition-all"
            style={{ width: `${Math.min(100, (waterMl / waterGoal) * 100)}%` }}
          />
        </div>
        <div className="flex gap-2">
          {[200, 300, 500].map((ml) => (
            <button
              key={ml}
              className="flex-1 rounded-full bg-tip-info/15 py-2 text-sm font-medium text-tip-info"
              onClick={() => addWater(today, ml)}
            >
              +{ml} ml
            </button>
          ))}
        </div>
      </Card>

      <p className="px-1 text-xs leading-relaxed text-slate-400">
        ตัวเลขแคลอรี่เป็นค่าประมาณ แอพจะไม่แนะนำเป้าต่ำกว่าระดับที่ปลอดภัย (ไม่ต่ำกว่า BMR และไม่ต่ำกว่า 1,200 kcal)
        การกินเพื่อสุขภาพคือการฟังร่างกายตัวเอง ไม่ต้องรู้สึกผิดกับอาหาร
      </p>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-[10px] text-slate-400">{unit}</p>
    </div>
  );
}

function FoodRow({ food, date }: { food: FoodItem; date: string }) {
  const [portion, setPortion] = useState(1);
  const scaled = scalePortion(food, portion);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-sm dark:bg-slate-800">
      <span className="flex-1">
        {food.name}{' '}
        <span className="text-xs text-slate-400">({food.serving})</span>
      </span>
      <select
        value={portion}
        onChange={(e) => setPortion(+e.target.value)}
        className="rounded border border-black/10 bg-transparent px-1 py-0.5 text-xs dark:border-white/10"
      >
        {[0.5, 1, 1.5, 2].map((p) => (
          <option key={p} value={p}>
            {p}x
          </option>
        ))}
      </select>
      <span className="w-14 text-right text-xs text-slate-400">{scaled.calories}</span>
      <button
        className="rounded-full bg-lunara-rose px-2 py-0.5 text-xs text-white"
        onClick={() =>
          addMeal({
            date,
            name: `${food.name}${portion !== 1 ? ` x${portion}` : ''}`,
            ...scaled,
          })
        }
      >
        +
      </button>
    </div>
  );
}

function CustomFoodRow({ date }: { date: string }) {
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-sm dark:bg-slate-800">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="อาหารของฉัน"
        className="flex-1 rounded border border-black/10 bg-transparent px-1 py-0.5 text-xs dark:border-white/10"
      />
      <input
        value={cal}
        onChange={(e) => setCal(e.target.value)}
        placeholder="kcal"
        type="number"
        className="w-16 rounded border border-black/10 bg-transparent px-1 py-0.5 text-xs dark:border-white/10"
      />
      <button
        className="rounded-full bg-lunara-rose px-2 py-0.5 text-xs text-white disabled:opacity-40"
        disabled={!name || !cal}
        onClick={() => {
          addMeal({ date, name, calories: +cal });
          setName('');
          setCal('');
        }}
      >
        +
      </button>
    </div>
  );
}
