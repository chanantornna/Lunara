import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Profile } from '@/domain/types';

export function useProfile(): Profile {
  const profile = useLiveQuery(() => db.profile.get(1), []);
  return profile ?? { id: 1 };
}
