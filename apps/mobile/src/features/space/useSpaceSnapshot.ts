import { useCallback, useEffect, useRef, useState } from 'react';
import type { MySpace, Snapshot } from '../../lib/client';
import type { RealtimePort } from '../../lib/realtime';
import { useSnapshotSync } from './useSnapshotSync';
type Entry = 'loading' | 'active' | 'ended' | 'none' | 'error';
type Deps = { client: { mySpace(): Promise<MySpace>; snapshot(spaceId: string): Promise<Snapshot> }; realtime: RealtimePort };
/** Chooses the space to open (active → ended notice → create/join) and keeps its snapshot fresh. */
export function useSpaceSnapshot({ client, realtime }: Deps) {
  const [entry, setEntry] = useState<Entry>('loading');
  const [ended, setEnded] = useState<MySpace['ended']>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const clientRef = useRef(client);
  clientRef.current = client;
  const resolveEntry = useCallback(async () => {
    try {
      const mine = await clientRef.current.mySpace();
      setEnded(mine.ended);
      setSpaceId(mine.active?.spaceId ?? null);
      setEntry(mine.active ? 'active' : mine.ended ? 'ended' : 'none');
    } catch {
      setEntry((current) => (current === 'loading' ? 'error' : current));
    }
  }, []);
  const fetchSnapshot = useCallback((id: string) => clientRef.current.snapshot(id), []);
  const { state, refresh } = useSnapshotSync(spaceId, fetchSnapshot, realtime, () => { void resolveEntry(); });
  useEffect(() => { void resolveEntry(); }, [resolveEntry]);
  return { entry, ended, spaceId, state, refresh, reload: resolveEntry };
}
