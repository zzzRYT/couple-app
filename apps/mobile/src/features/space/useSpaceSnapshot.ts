import { useCallback, useEffect, useRef, useState } from 'react';
import type { MySpace, Snapshot } from '../../lib/client';
import { isNetworkError, type RealtimePort } from '../../lib/realtime';
import { useSnapshotSync } from './useSnapshotSync';
import { cachedSnapshot, readV0Cache } from './v0Cache';
type Entry = 'loading' | 'active' | 'ended' | 'none' | 'error' | 'offlineEmpty';
type Deps = { client: { mySpace(): Promise<MySpace>; snapshot(spaceId: string): Promise<Snapshot> }; realtime: RealtimePort; userId?: string | null };
/** Chooses the space to open (active → ended notice → create/join) and keeps its snapshot fresh. */
export function useSpaceSnapshot({ client, realtime, userId }: Deps) {
  const [entry, setEntry] = useState<Entry>('loading');
  const [ended, setEnded] = useState<MySpace['ended']>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const clientRef = useRef(client);
  clientRef.current = client;
  const seedRef = useRef<(snapshot: Snapshot, savedAt: string) => void>(() => {});
  const resolveEntry = useCallback(async () => {
    try {
      const mine = await clientRef.current.mySpace();
      setEnded(mine.ended);
      setSpaceId(mine.active?.spaceId ?? null);
      setEntry(mine.active ? 'active' : mine.ended ? 'ended' : 'none');
    } catch (error) {
      if (isNetworkError(error) && userId) {
        const cache = await readV0Cache(userId);
        if (cache) { seedRef.current(cachedSnapshot(cache), cache.savedAt); setSpaceId(cache.spaceId); setEntry('active'); return; }
        setEntry((current) => current === 'active' ? current : 'offlineEmpty');
      } else setEntry((current) => (current === 'loading' ? 'error' : current));
    }
  }, [userId]);
  const fetchSnapshot = useCallback((id: string) => clientRef.current.snapshot(id), []);
  const { state, refresh, reset: resetSnapshot, seedOffline } = useSnapshotSync(spaceId, fetchSnapshot, realtime, () => { void resolveEntry(); }, userId);
  seedRef.current = seedOffline;
  useEffect(() => { void resolveEntry(); }, [resolveEntry]);
  /** Drops every cached space/room value so the next account never sees the previous one's data. */
  const reset = useCallback(() => { setEntry('loading'); setEnded(null); setSpaceId(null); resetSnapshot(); }, [resetSnapshot]);
  return { entry, ended, spaceId, state, refresh, reload: resolveEntry, reset };
}
