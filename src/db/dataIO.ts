import { db } from './db';

const EXPORT_TABLES = [
  'profile',
  'periods',
  'periodDays',
  'checkins',
  'weights',
  'pills',
  'pillLogs',
  'emergencyPills',
  'sexLogs',
  'workouts',
  'sleeps',
  'meals',
  'waterLogs',
  'settings',
] as const;

export interface ExportBundle {
  app: 'lunara';
  version: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

/** Serialize the whole database to a JSON bundle. */
export async function exportJSON(): Promise<ExportBundle> {
  const data: Record<string, unknown[]> = {};
  for (const name of EXPORT_TABLES) {
    data[name] = await db.table(name).toArray();
  }
  return {
    app: 'lunara',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Import a previously exported bundle, replacing existing data. */
export async function importJSON(bundle: ExportBundle): Promise<void> {
  if (bundle?.app !== 'lunara' || !bundle.data) {
    throw new Error('ไฟล์ไม่ถูกต้อง (ไม่ใช่ข้อมูลสำรองของ Lunara)');
  }
  await db.transaction('rw', db.tables, async () => {
    for (const name of EXPORT_TABLES) {
      const rows = bundle.data[name];
      if (!Array.isArray(rows)) continue;
      await db.table(name).clear();
      if (rows.length) await db.table(name).bulkAdd(rows as any[]);
    }
  });
}

/** Flatten check-ins to a CSV string (the most chart-relevant table). */
export async function exportCheckinsCSV(): Promise<string> {
  const rows = await db.checkins.orderBy('date').toArray();
  const header = ['date', 'moodScore', 'energy', 'stress', 'painLevel', 'moods', 'symptoms'];
  const lines = [header.join(',')];
  for (const c of rows) {
    lines.push(
      [
        c.date,
        c.moodScore ?? '',
        c.energy ?? '',
        c.stress ?? '',
        c.painLevel ?? '',
        `"${(c.moods ?? []).join('|')}"`,
        `"${(c.symptoms ?? []).join('|')}"`,
      ].join(',')
    );
  }
  return lines.join('\n');
}

/** Trigger a browser download of text content. */
export function downloadText(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
