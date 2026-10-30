/**
 * Local notification helpers. Content is intentionally non-sensitive
 * (e.g. "ถึงเวลาบันทึกแล้ว") so nothing private shows on a lock screen.
 *
 * Note: without a push server these fire only while the app/tab is open.
 */

export type NotifyType = 'pill' | 'checkin';

const GENERIC: Record<NotifyType, string> = {
  pill: 'ถึงเวลาบันทึกของวันนี้แล้ว',
  checkin: 'ถึงเวลาบันทึกของวันนี้แล้ว',
};

export function notifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notifySupported()) return 'denied';
  return Notification.requestPermission();
}

export function permissionStatus(): NotificationPermission {
  if (!notifySupported()) return 'denied';
  return Notification.permission;
}

/** Show a generic, non-sensitive reminder. */
export function showReminder(type: NotifyType) {
  if (!notifySupported() || Notification.permission !== 'granted') return;
  new Notification('Lunara', { body: GENERIC[type], icon: '/icons/icon-192.png', tag: type });
}

const timers: number[] = [];

/** Parse "HH:mm" → ms until the next occurrence from now. */
function msUntil(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return -1;
  const now = new Date();
  const target = new Date();
  target.setHours(+m[1], +m[2], 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

/**
 * Schedule the enabled reminders for the current session. Call again whenever
 * settings change. Clears any previously scheduled timers first.
 */
export function scheduleReminders(
  config: Partial<Record<NotifyType, { enabled: boolean; time?: string }>>
) {
  timers.forEach((id) => clearTimeout(id));
  timers.length = 0;
  if (permissionStatus() !== 'granted') return;

  (Object.keys(config) as NotifyType[]).forEach((type) => {
    const entry = config[type];
    if (!entry?.enabled || !entry.time) return;
    const delay = msUntil(entry.time);
    if (delay < 0) return;
    const id = window.setTimeout(() => showReminder(type), delay);
    timers.push(id);
  });
}
