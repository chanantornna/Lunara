import { useEffect, useState } from 'react';
import type { Theme } from '@/domain/types';

const KEY = 'lunara-theme';

function apply(theme: Theme) {
  const root = document.documentElement;
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(KEY) as Theme) || 'system'
  );

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return {
    theme,
    setTheme: (t: Theme) => setThemeState(t),
  };
}
