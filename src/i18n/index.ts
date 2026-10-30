import { th, type Dict } from './th';
import { en } from './en';
import type { Locale } from '@/domain/types';

const dicts: Record<Locale, Dict> = { th, en };

let current: Locale = 'th';

export function setLocale(locale: Locale) {
  current = locale;
}

export function getDict(): Dict {
  return dicts[current];
}

// Convenience: default export is the Thai dict for now; components can also
// read getDict() if locale switching is wired up later.
export const t = th;
