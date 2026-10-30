import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useProfile } from '@/hooks/useProfile';
import { Card, SectionTitle } from '@/components/Card';
import { TipCard } from '@/components/TipCard';
import { todayISO } from '@/lib/date';
import { thShortDate } from '@/lib/format';
import { t } from '@/i18n';
import {
  getAverageCycleLength,
  getCurrentCycleDay,
  predictNextPeriod,
  getFertileWindow,
  getPregnancyChance,
  daysUntilNextPeriod,
} from '@/domain/cycle';
import { useTips } from '@/hooks/useTips';
import type { View } from '@/App';

export function TodayPage({ onNavigate }: { onNavigate: (view: View) => void }) {
  const profile = useProfile();
  const periods = useLiveQuery(() => db.periods.orderBy('startDate').toArray(), []);
  const tips = useTips();
  const today = todayISO();

  if (!periods) return <Loading />;

  const avgLen = getAverageCycleLength(periods, 28, profile.avgCycleLengthOverride);
  const cycleDay = getCurrentCycleDay(periods, today);
  const next = predictNextPeriod(periods, avgLen);
  const fertile = getFertileWindow(periods, avgLen, {
    onBirthControl: profile.onBirthControl,
  });
  const chance = getPregnancyChance(today, fertile);
  const until = daysUntilNextPeriod(periods, today, avgLen);

  const hasData = periods.length > 0;

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          วันนี้ {thShortDate(today)}
        </p>
        <h1 className="text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
          {t.appName}
        </h1>
      </header>

      {/* Cycle summary */}
      <Card>
        <SectionTitle>ภาพรวมรอบเดือน</SectionTitle>
        {hasData ? (
          <div className="space-y-2 text-slate-700 dark:text-slate-200">
            {cycleDay != null && (
              <p className="text-lg">
                วันที่ <span className="font-bold text-lunara-rose">{cycleDay}</span> ของรอบ
                <span className="text-sm text-slate-400"> (รอบเฉลี่ย ~{avgLen} วัน)</span>
              </p>
            )}
            {next && (
              <p>
                คาดการณ์ประจำเดือนครั้งถัดไป:{' '}
                <span className="font-semibold">{thShortDate(next)}</span>
                {until != null && (
                  <span className="text-sm text-slate-400">
                    {' '}
                    {until >= 0 ? `(อีก ${until} วัน)` : `(ช้ากว่าคาด ${-until} วัน)`}
                  </span>
                )}
              </p>
            )}
            <PregnancyRow chance={chance} onBirthControl={profile.onBirthControl} />
          </div>
        ) : (
          <EmptyPrompt onNavigate={onNavigate} />
        )}
      </Card>

      {/* Smart tips from the rule engine */}
      {tips && tips.length > 0 && (
        <div className="space-y-3">
          <SectionTitle>คำแนะนำสำหรับคุณ</SectionTitle>
          {tips.map((tip) => (
            <TipCard
              key={tip.id}
              level={tip.level}
              title={tip.title}
              body={tip.body}
              link={tip.link}
            />
          ))}
        </div>
      )}

      {/* Quick actions */}
      <Card>
        <SectionTitle>บันทึกด่วน</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <QuickBtn emoji="🩸" label="ประจำเดือน" onClick={() => onNavigate('calendar')} />
          <QuickBtn emoji="📝" label="Check-in" onClick={() => onNavigate('log')} />
          <QuickBtn emoji="⚖️" label="น้ำหนัก" onClick={() => onNavigate('weight')} />
        </div>
      </Card>

      <p className="px-1 text-xs leading-relaxed text-slate-400">{t.disclaimer}</p>
    </div>
  );
}

function PregnancyRow({
  chance,
  onBirthControl,
}: {
  chance: 'high' | 'low' | 'unknown';
  onBirthControl?: boolean;
}) {
  if (onBirthControl) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        คุณระบุว่าใช้ยาคุมอยู่ จึงไม่คำนวณช่วงไข่ตกตามปกติ
      </p>
    );
  }
  if (chance === 'unknown') return null;
  const high = chance === 'high';
  return (
    <p>
      โอกาสตั้งครรภ์{' '}
      <span className={`font-semibold ${high ? 'text-tip-doctor' : 'text-tip-info'}`}>
        {high ? 'สูง' : 'ต่ำ'} (ประมาณการ)
      </span>
      <span className="block text-xs text-slate-400">
        เป็นค่าประมาณเท่านั้น ไม่ควรใช้แทนการคุมกำเนิดที่เชื่อถือได้
      </span>
    </p>
  );
}

function QuickBtn({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-xl2 bg-lunara-pink-soft py-3 text-sm font-medium text-lunara-plum dark:bg-slate-700 dark:text-slate-100"
    >
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      {label}
    </button>
  );
}

function EmptyPrompt({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div className="text-slate-600 dark:text-slate-300">
      <p>{t.common.notEnoughData}</p>
      <button
        type="button"
        className="btn-primary mt-3"
        onClick={() => onNavigate('calendar')}
      >
        บันทึกวันเริ่มประจำเดือน
      </button>
    </div>
  );
}

function Loading() {
  return <div className="py-10 text-center text-slate-400">กำลังโหลด…</div>;
}
