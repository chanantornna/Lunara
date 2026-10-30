import { t } from '@/i18n';

export type Tab = 'today' | 'calendar' | 'log' | 'stats' | 'settings';

const ITEMS: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'today', label: t.nav.today, icon: '🌸' },
  { tab: 'calendar', label: t.nav.calendar, icon: '📅' },
  { tab: 'log', label: t.nav.log, icon: '📝' },
  { tab: 'stats', label: t.nav.stats, icon: '📊' },
  { tab: 'settings', label: t.nav.settings, icon: '⚙️' },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const on = active === item.tab;
          return (
            <li key={item.tab} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(item.tab)}
                aria-current={on ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  on
                    ? 'text-lunara-rose dark:text-lunara-lilac'
                    : 'text-slate-400'
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
