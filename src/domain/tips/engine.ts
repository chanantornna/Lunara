import type { Tip, TipRule, TipContext, TipCategory } from './types';
import { TIP_LEVEL_ORDER } from './types';
import { cycleRules } from './rules.cycle';
import { bodyRules } from './rules.body';
import { sexRules } from './rules.sex';
import { lifestyleRules } from './rules.lifestyle';

export const ALL_RULES: TipRule[] = [
  ...cycleRules,
  ...bodyRules,
  ...sexRules,
  ...lifestyleRules,
];

export const TIP_CATEGORIES: { id: TipCategory; label: string }[] = [
  { id: 'cycle', label: 'รอบเดือน' },
  { id: 'discharge_acne_mood', label: 'ตกขาว/สิว/อารมณ์' },
  { id: 'sex', label: 'เพศสัมพันธ์' },
  { id: 'lifestyle', label: 'ไลฟ์สไตล์' },
];

/**
 * Run all rules against the context, keeping only enabled categories.
 * Results are sorted by severity (🩺 doctor > ⚠️ warn > 💡 info).
 * `enabled` maps category → boolean; a missing key is treated as enabled.
 */
export function runTips(
  ctx: TipContext,
  enabled: Partial<Record<TipCategory, boolean>> = {},
  rules: TipRule[] = ALL_RULES
): Tip[] {
  const tips: Tip[] = [];
  for (const rule of rules) {
    if (enabled[rule.category] === false) continue;
    const tip = rule.evaluate(ctx);
    if (tip) tips.push(tip);
  }
  return tips.sort(
    (a, b) => TIP_LEVEL_ORDER[a.level] - TIP_LEVEL_ORDER[b.level]
  );
}
