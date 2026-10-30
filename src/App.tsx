import { useState } from 'react';
import { BottomNav, type Tab } from '@/components/BottomNav';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { TodayPage } from '@/pages/TodayPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { LogHubPage } from '@/pages/LogHubPage';
import { LogPage } from '@/pages/LogPage';
import { PillPage } from '@/pages/PillPage';
import { EmergencyPillPage } from '@/pages/EmergencyPillPage';
import { SexLogPage } from '@/pages/SexLogPage';
import { ExercisePage } from '@/pages/ExercisePage';
import { SleepPage } from '@/pages/SleepPage';
import { NutritionPage } from '@/pages/NutritionPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useTheme } from '@/hooks/useTheme';
import { useAppLock } from '@/hooks/useAppLock';
import { LockScreen } from '@/components/LockScreen';

// Sub-pages opened from the Log hub (not top-level tabs).
export type SubView =
  | 'checkin'
  | 'pill'
  | 'emergency'
  | 'sex'
  | 'exercise'
  | 'sleep'
  | 'nutrition'
  | 'weight';
export type View = Tab | SubView;

const SUB_TITLES: Record<SubView, string> = {
  checkin: 'Daily Check-in',
  pill: 'ยาคุมประจำ',
  emergency: 'ยาคุมฉุกเฉิน',
  sex: 'บันทึกเพศสัมพันธ์',
  exercise: 'ออกกำลังกาย',
  sleep: 'การนอน',
  nutrition: 'อาหาร & แคลอรี่',
  weight: 'น้ำหนัก & BMI',
};

const TABS: Tab[] = ['today', 'calendar', 'log', 'stats', 'settings'];

export default function App() {
  const [view, setView] = useState<View>('today');
  useTheme();
  const { locked, pinHash, unlock } = useAppLock();

  const activeTab: Tab = TABS.includes(view as Tab) ? (view as Tab) : 'log';
  const isSub = !TABS.includes(view as Tab);

  if (locked && pinHash) {
    return <LockScreen pinHash={pinHash} onUnlock={unlock} />;
  }

  return (
    <div className="min-h-full bg-lunara-cream text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <main className="mx-auto max-w-md px-4 pb-28">
        {isSub && (
          <button
            onClick={() => setView('log')}
            className="btn-ghost mt-2 -ml-2 inline-flex items-center gap-1 text-sm"
          >
            ‹ กลับ · {SUB_TITLES[view as SubView]}
          </button>
        )}

        {view === 'today' && <TodayPage onNavigate={setView} />}
        {view === 'calendar' && <CalendarPage />}
        {view === 'log' && <LogHubPage onOpen={setView} />}
        {view === 'checkin' && <LogPage />}
        {view === 'pill' && <PillPage />}
        {view === 'emergency' && <EmergencyPillPage />}
        {view === 'sex' && <SexLogPage onNeedEmergency={() => setView('emergency')} />}
        {view === 'exercise' && <ExercisePage />}
        {view === 'sleep' && <SleepPage />}
        {view === 'nutrition' && <NutritionPage />}
        {view === 'weight' && <StatsPage />}
        {view === 'stats' && <InsightsPage onNavigate={setView} />}
        {view === 'settings' && <SettingsPage />}
      </main>

      <FloatingAddButton
        actions={[
          { label: 'บันทึกประจำเดือน', emoji: '🩸', onSelect: () => setView('calendar') },
          { label: 'Daily Check-in', emoji: '📝', onSelect: () => setView('checkin') },
          { label: 'ติ๊กกินยาคุม', emoji: '💊', onSelect: () => setView('pill') },
          { label: 'บันทึกออกกำลังกาย', emoji: '🏃‍♀️', onSelect: () => setView('exercise') },
          { label: 'บันทึกการนอน', emoji: '😴', onSelect: () => setView('sleep') },
          { label: 'บันทึกอาหาร', emoji: '🍚', onSelect: () => setView('nutrition') },
          { label: 'บันทึกน้ำหนัก', emoji: '⚖️', onSelect: () => setView('weight') },
        ]}
      />

      <BottomNav active={activeTab} onChange={setView} />
    </div>
  );
}
