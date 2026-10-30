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
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useTheme } from '@/hooks/useTheme';

// Sub-pages opened from the Log hub (not top-level tabs).
export type SubView = 'checkin' | 'pill' | 'emergency' | 'sex';
export type View = Tab | SubView;

const SUB_TITLES: Record<SubView, string> = {
  checkin: 'Daily Check-in',
  pill: 'ยาคุมประจำ',
  emergency: 'ยาคุมฉุกเฉิน',
  sex: 'บันทึกเพศสัมพันธ์',
};

const TABS: Tab[] = ['today', 'calendar', 'log', 'stats', 'settings'];

export default function App() {
  const [view, setView] = useState<View>('today');
  useTheme();

  const activeTab: Tab = TABS.includes(view as Tab) ? (view as Tab) : 'log';
  const isSub = !TABS.includes(view as Tab);

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
        {view === 'stats' && <StatsPage />}
        {view === 'settings' && <SettingsPage />}
      </main>

      <FloatingAddButton
        actions={[
          { label: 'บันทึกประจำเดือน', emoji: '🩸', onSelect: () => setView('calendar') },
          { label: 'Daily Check-in', emoji: '📝', onSelect: () => setView('checkin') },
          { label: 'ติ๊กกินยาคุม', emoji: '💊', onSelect: () => setView('pill') },
          { label: 'บันทึกเพศสัมพันธ์', emoji: '❤️', onSelect: () => setView('sex') },
          { label: 'บันทึกน้ำหนัก', emoji: '⚖️', onSelect: () => setView('stats') },
        ]}
      />

      <BottomNav active={activeTab} onChange={setView} />
    </div>
  );
}
