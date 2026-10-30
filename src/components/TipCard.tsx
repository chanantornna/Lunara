export type TipLevel = 'info' | 'warn' | 'doctor';

const STYLES: Record<TipLevel, { emoji: string; ring: string; bg: string }> = {
  info: {
    emoji: '💡',
    ring: 'ring-tip-info/30',
    bg: 'bg-tip-info/10',
  },
  warn: {
    emoji: '⚠️',
    ring: 'ring-tip-warn/40',
    bg: 'bg-tip-warn/10',
  },
  doctor: {
    emoji: '🩺',
    ring: 'ring-tip-doctor/40',
    bg: 'bg-tip-doctor/10',
  },
};

interface TipCardProps {
  level: TipLevel;
  title: string;
  body?: string;
  link?: { label: string; href: string };
}

export function TipCard({ level, title, body, link }: TipCardProps) {
  const s = STYLES[level];
  return (
    <div className={`rounded-xl2 p-4 ring-1 ${s.ring} ${s.bg}`}>
      <div className="flex gap-3">
        <span className="text-xl" aria-hidden>
          {s.emoji}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </p>
          {body && (
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {body}
            </p>
          )}
          {link && (
            <a
              href={link.href}
              className="mt-2 inline-block text-sm font-semibold text-lunara-rose underline dark:text-lunara-lilac"
            >
              {link.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
