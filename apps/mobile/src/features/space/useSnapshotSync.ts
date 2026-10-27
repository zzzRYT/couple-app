import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Snapshot } from '../../lib/client';
import { isNetworkError, type RealtimePort } from '../../lib/realtime';
import type { SpaceState } from './types';
const OFFLINE_RETRY_MS = 15_000;
/** Fetches the snapshot on open, on foreground, on Realtime hints and periodically while offline; the last good copy stays readable. */
export function useSnapshotSync(spaceId: string | null, fetchSnapshot: (spaceId: string) => Promise<Snapshot>, realtime: RealtimePort, onGone?: () => void) {
  const [state, setState] = useState<SpaceState>({ status: 'loading', snapshot: null, offline: false, lastSyncedAt: null });
  const fetchRef = useRef(fetchSnapshot);
  fetchRef.current = fetchSnapshot;
  const goneRef = useRef(onGone);
  goneRef.current = onGone;
  const refresh = useCallback(async () => {
    if (!spaceId) return;
    try {
      const snapshot = await fetchRef.current(spaceId);
      setState({ status: 'ready', snapshot, offline: false, lastSyncedAt: snapshot.serverTime });
    } catch (error) {
      setState((current) => ({ ...current, status: 'error', offline: isNetworkError(error) }));
      if (!isNetworkError(error)) goneRef.current?.();
    }
  }, [spaceId]);
  useEffect(() => {
    if (!spaceId) return;
    void refresh();
    const unsubscribe = realtime.subscribe(spaceId, () => { void refresh(); });
    const foreground = AppState.addEventListener('change', (next) => { if (next === 'active') void refresh(); });
    return () => { unsubscribe(); foreground.remove(); };
  }, [spaceId, realtime, refresh]);
  useEffect(() => {
    if (!state.offline) return;
    const timer = setInterval(() => { void refresh(); }, OFFLINE_RETRY_MS);
    return () => clearInterval(timer);
  }, [state.offline, refresh]);
  return { state, refresh };
}
