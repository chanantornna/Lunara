import { useState } from 'react';
import { BottomNav, type Tab } from '@/components/BottomNav';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { TodayPage } from '@/pages/TodayPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { LogPage } from '@/pages/LogPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useTheme } from '@/hooks/useTheme';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  useTheme(); // apply saved theme on mount

  return (
    <div className="min-h-full bg-lunara-cream text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <main className="mx-auto max-w-md px-4 pb-28">
        {tab === 'today' && <TodayPage onNavigate={setTab} />}
        {tab === 'calendar' && <CalendarPage />}
        {tab === 'log' && <LogPage />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      <FloatingAddButton
        actions={[
          { label: 'บันทึกประจำเดือน', emoji: '🩸', onSelect: () => setTab('calendar') },
          { label: 'Daily Check-in', emoji: '📝', onSelect: () => setTab('log') },
          { label: 'บันทึกน้ำหนัก', emoji: '⚖️', onSelect: () => setTab('stats') },
        ]}
      />

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
