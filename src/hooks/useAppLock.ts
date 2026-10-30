import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { scheduleReminders } from '@/lib/notify';

/**
 * App lock state. If a PIN hash exists in settings, the app starts locked
 * for this session until the user unlocks. Also (re)schedules reminders.
 */
export function useAppLock() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const [unlocked, setUnlocked] = useState(false);

  const pinHash = settings?.pinHash;

  useEffect(() => {
    if (settings?.notifications) scheduleReminders(settings.notifications);
  }, [settings?.notifications]);

  return {
    // locked only matters once settings have loaded and a pin exists
    locked: !!pinHash && !unlocked,
    pinHash,
    unlock: () => setUnlocked(true),
  };
}
