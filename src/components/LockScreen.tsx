import { useState } from 'react';
import { verifyPin } from '@/lib/pin';

export function LockScreen({
  pinHash,
  onUnlock,
}: {
  pinHash: string;
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  async function submit() {
    if (await verifyPin(pin, pinHash)) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-lunara-cream px-8 dark:bg-slate-900">
      <span className="mb-4 text-5xl">🌸</span>
      <h1 className="mb-1 text-2xl font-bold text-lunara-plum dark:text-lunara-lilac">
        Lunara
      </h1>
      <p className="mb-6 text-sm text-slate-500">ใส่ PIN เพื่อเข้าใช้งาน</p>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => {
          setPin(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-40 rounded-xl2 border border-black/10 bg-white px-4 py-3 text-center text-2xl tracking-widest dark:border-white/10 dark:bg-slate-800"
        placeholder="••••"
      />
      {error && <p className="mt-2 text-sm text-tip-doctor">PIN ไม่ถูกต้อง</p>}
      <button className="btn-primary mt-6 w-40" onClick={submit}>
        ปลดล็อก
      </button>
    </div>
  );
}
