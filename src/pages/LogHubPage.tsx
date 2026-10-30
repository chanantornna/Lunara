import { Card } from '@/components/Card';
import type { View } from '@/App';

const ITEMS: { view: View; emoji: string; title: string; desc: string }[] = [
  { view: 'checkin', emoji: '📝', title: 'Daily Check-in', desc: 'อารมณ์ สุขภาพ ตกขาว สิว' },
  { view: 'pill', emoji: '💊', title: 'ยาคุมประจำ', desc: 'ติ๊กกินยา เตือนใกล้หมดแผง' },
  { view: 'emergency', emoji: '🚨', title: 'ยาคุมฉุกเฉิน', desc: 'บันทึกการใช้ นับความถี่' },
  { view: 'sex', emoji: '❤️', title: 'บันทึกเพศสัมพันธ์', desc: 'การป้องกัน · โหมดส่วนตัว' },
];

export function LogHubPage({ onOpen }: { onOpen: (view: View) => void }) {
  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        บันทึก
      </h1>
      <div className="grid grid-cols-1 gap-3">
        {ITEMS.map((it) => (
          <button key={it.view} onClick={() => onOpen(it.view)} className="text-left">
            <Card className="flex items-center gap-4">
              <span className="text-3xl" aria-hidden>
                {it.emoji}
              </span>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {it.title}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{it.desc}</p>
              </div>
              <span className="ml-auto text-slate-300">›</span>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
