# Design — Lunara (Women's Health Tracker)

## ภาพรวม (Overview)

Lunara เป็น client-only PWA ไม่มี backend ข้อมูลทั้งหมดอยู่ใน IndexedDB (Dexie.js)
สถาปัตยกรรมแบ่งเป็น 3 ชั้นชัดเจน:

1. **Data layer** — Dexie database + repository functions (CRUD)
2. **Domain/logic layer** — pure functions (cycle, BMI, BMR/TDEE, tips engine) ทดสอบได้ ไม่พึ่งพา React/DOM
3. **UI layer** — React components + pages + hooks ที่เรียกใช้ data/logic layer

หลักการ: logic คำนวณและกฎคำแนะนำต้องเป็น pure function แยกจาก UI เพื่อ unit test ได้

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Build | Vite |
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS (dark mode = class) |
| DB | Dexie.js (IndexedDB) |
| Charts | Recharts |
| Dates | date-fns |
| PWA | vite-plugin-pwa (Workbox) |
| Test | Vitest + @testing-library/react |
| i18n | ไฟล์ dictionary (th/en) + helper `t()` เบา ๆ เตรียมโครงไว้ |

## โครงสร้างโฟลเดอร์

```
/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tailwind.config.js
├─ postcss.config.js
├─ tsconfig.json
├─ public/
│  ├─ icons/ (pwa icons)
│  └─ ...
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ index.css
   ├─ db/
   │  ├─ db.ts            # Dexie schema & instance
   │  ├─ repositories.ts  # CRUD helpers
   │  └─ seed.ts          # seed data (toggle-able)
   ├─ domain/
   │  ├─ cycle.ts         # cycle length, prediction, fertile window
   │  ├─ body.ts          # BMI, BMR, TDEE, calorie target
   │  ├─ types.ts         # shared domain types
   │  └─ tips/            # (เฟส 4) tips engine + rules
   ├─ i18n/
   │  ├─ index.ts
   │  └─ th.ts / en.ts
   ├─ components/
   │  ├─ BottomNav.tsx
   │  ├─ FloatingAddButton.tsx
   │  ├─ Chip.tsx, ChipGroup.tsx
   │  ├─ RatingScale.tsx  # 1-5 / 0-10 selector
   │  ├─ Card.tsx, TipCard.tsx
   │  └─ ...
   ├─ pages/
   │  ├─ TodayPage.tsx
   │  ├─ CalendarPage.tsx
   │  ├─ LogPage.tsx          # Daily Check-in + quick logs
   │  ├─ StatsPage.tsx        # (เฟส 1 แสดงน้ำหนัก/BMI)
   │  └─ SettingsPage.tsx     # profile + disclaimer + seed toggle
   ├─ hooks/
   │  ├─ useLiveQuery.ts   # wrapper dexie-react-hooks
   │  ├─ useProfile.ts
   │  └─ useTheme.ts
   └─ lib/
      ├─ date.ts          # date helpers wrap date-fns
      └─ format.ts
```

## Data Model (Dexie schema)

เวอร์ชัน 1 (เฟส 1) กำหนดตารางครบเพื่อรองรับเฟสถัดไป (ตารางเฟส 2-4 สร้าง schema ไว้ล่วงหน้าได้ แต่ UI มาทีหลัง)

```ts
// profile: single record (id=1)
profile: {
  id: number;            // always 1
  birthDate?: string;    // ISO date
  heightCm?: number;
  startWeightKg?: number;
  goal?: 'maintain' | 'lose' | 'gain' | 'health';
  activityLevel?: 'sedentary'|'light'|'moderate'|'active'|'very_active';
  onBirthControl?: boolean;
  avgCycleLengthOverride?: number; // optional manual
  locale?: 'th' | 'en';
  theme?: 'light' | 'dark' | 'system';
}

// periods: ช่วงมีประจำเดือน
periods: {
  id?: number;
  startDate: string;      // ISO
  endDate?: string;       // ISO (อาจยังไม่จบ)
  flow?: ('light'|'medium'|'heavy')[]; // per-day optional → เก็บแบบง่ายเป็น summary ก่อน
}

// periodDays: บันทึกรายวันของประจำเดือน (ปริมาณ/ลักษณะเลือด)
periodDays: {
  id?: number;
  date: string;           // ISO (unique)
  flow?: 'light'|'medium'|'heavy';
  bloodType?: 'fresh'|'dark'|'clots';
}

// checkins: Daily Check-in (หนึ่งระเบียนต่อวัน)
checkins: {
  id?: number;
  date: string;           // ISO, unique index
  moods?: string[];       // happy/calm/stressed/...
  moodScore?: number;     // 1-5
  energy?: number;        // 1-5
  stress?: number;        // 1-5
  symptoms?: string[];    // cramps/headache/...
  painLevel?: number;     // 0-10
  temperatureC?: number;
  illness?: string[];     // fever/cold/infection
  note?: string;
  discharge?: {
    type?: string;        // none/sticky/creamy/eggwhite/watery/yellow/green/gray/bloody
    amount?: 'light'|'medium'|'heavy';
    odor?: 'normal'|'abnormal';
    symptoms?: string[];  // itch/burning/irritation/dysuria
  };
  acne?: {
    severity?: 'none'|'mild'|'moderate'|'severe';
    locations?: string[]; // forehead/cheek/jaw/back/chest
    types?: string[];     // whitehead/blackhead/inflamed/cystic
  };
}

// weights
weights: {
  id?: number;
  date: string;           // ISO
  weightKg: number;
}

// --- เตรียม schema เฟสถัดไป (ยังไม่ทำ UI) ---
pills, emergencyPills, sexLogs, workouts, sleeps, meals, waterLogs,
tipSettings, appSettings(pin/notifications)
```

ใช้ `date` ใน ISO `yyyy-MM-dd` สำหรับ index รายวัน และ `createdAt/updatedAt` เป็น timestamp

## Domain Logic

### cycle.ts
- `getCycleLengths(periods): number[]` — ระยะห่างระหว่างวันเริ่มของแต่ละรอบ
- `getAverageCycleLength(periods, fallback=28): number`
- `getCycleRegularity(lengths): 'regular'|'irregular'|'unknown'` — ดูช่วงกระจาย (SD) + จำนวนรอบ
- `predictNextPeriod(periods, avgLen): Date | null`
- `getCurrentCycleDay(periods, today): number | null`
- `getFertileWindow(lastStart, avgLen, opts): { ovulation, fertileStart, fertileEnd } | null`
  - ovulation ≈ nextPeriod - 14
  - ปรับด้วยสัญญาณ eggwhite discharge ถ้ามี (เลื่อน fertile window เล็กน้อย)
  - ถ้า `onBirthControl` → return null + เหตุผล (ไม่คำนวณไข่ตก)
- `getPregnancyChance(cycleDay, fertileWindow): 'high'|'low'|'unknown'` — ใช้คำว่า "ประมาณการ" ไม่ใช้ "ปลอดภัย"
- `getCyclePhase(cycleDay, avgLen): 'menstrual'|'follicular'|'ovulation'|'luteal'`

### body.ts
- `calcBMI(weightKg, heightCm): number`
- `bmiCategory(bmi): 'underweight'|'normal'|'overweight'|'obese'` (ภาษาไม่ตัดสินใน UI)
- `calcBMR(sex='female', weightKg, heightCm, ageYears): number` — Mifflin-St Jeor
- `calcTDEE(bmr, activityLevel): number`
- `safeCalorieTarget(tdee, goal, bmr): number` — clamp ≥ max(bmr, 1200)

### tips engine (เฟส 4)
- กฎเก็บเป็น array ของ `TipRule` object: `{ id, category, level, evaluate(context): Tip | null }`
- `runTips(context, settings): Tip[]` รวมผลทุกกฎที่เปิดอยู่ จัดเรียงตามระดับ (🩺 > ⚠️ > 💡)
- context รวม: profile, periods, checkins, weights, derived cycle info ฯลฯ
- ทุกกฎมี unit test

## UI / Navigation

- `App.tsx` ถือ router (ใช้ state-based routing เบา ๆ หรือ react-router) + bottom nav + floating add
- Bottom nav 5 แท็บ: วันนี้ / ปฏิทิน / บันทึก / สถิติ / ตั้งค่า
- Floating "+" เปิด bottom sheet เลือกบันทึกด่วน (เริ่มประจำเดือน / check-in / น้ำหนัก)
- Components ใช้ chip เป็นหลัก กรอกน้อยที่สุด
- TipCard 3 ระดับสีต่างกัน: 💡 (เขียว/ฟ้า) / ⚠️ (เหลือง) / 🩺 (แดงนุ่ม)

### ธีมสี (Tailwind)
พาสเทลชมพู/ม่วง/ครีม — กำหนด palette ใน tailwind.config.js (เช่น `lunara.pink`, `lunara.lilac`, `lunara.cream`)
dark mode = class บน `<html>`

## PWA
- `vite-plugin-pwa` สร้าง manifest + service worker (autoUpdate)
- `registerType: 'autoUpdate'`, precache app shell
- icons 192/512 + maskable
- ชื่อแอพ "Lunara", theme_color พาสเทล

## การจัดการ privacy
- ไม่มี network call ออกนอกเครื่อง (ยกเว้น fetch asset ของตัวเอง)
- notification ไม่แสดงเนื้อหาอ่อนไหว (เฟส 4)
- disclaimer แสดงในหน้า Settings และหน้าที่เกี่ยวข้อง

## กลยุทธ์การทดสอบ
- Vitest สำหรับ domain logic (cycle, body) — เฟส 1
- Tips engine แต่ละกฎมี test — เฟส 4
- Component test เท่าที่จำเป็น (RatingScale, ChipGroup)

## แผนการ deploy
- Static build → deploy ฟรีได้ (Netlify/Vercel/GitHub Pages) เนื่องจากไม่มี backend
