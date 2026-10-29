import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Snapshot } from '../../lib/client';
import { isNetworkError, type RealtimePort } from '../../lib/realtime';
import type { SpaceState } from './types';
const OFFLINE_RETRY_MS = 15_000;
const SAFETY_POLL_MS = 60_000;
const initialState: SpaceState = { status: 'loading', snapshot: null, offline: false, lastSyncedAt: null };
/** Fetches the snapshot on open, on foreground, on Realtime hints and periodically while offline; the last good copy stays readable. */
export function useSnapshotSync(spaceId: string | null, fetchSnapshot: (spaceId: string) => Promise<Snapshot>, realtime: RealtimePort, onGone?: () => void) {
  const [state, setState] = useState<SpaceState>(initialState);
  const fetchRef = useRef(fetchSnapshot);
  fetchRef.current = fetchSnapshot;
  const goneRef = useRef(onGone);
  goneRef.current = onGone;
  const stateRef = useRef(state);
  stateRef.current = state;
  const requestRef = useRef(0);
  const sessionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinedRef = useRef(false);
  const [joined, setJoined] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const refresh = useCallback(async () => {
    if (!spaceId) return;
    const request = ++requestRef.current;
    try {
      const snapshot = await fetchRef.current(spaceId);
      if (request !== requestRef.current) return;
      const current = stateRef.current.snapshot;
      if (current && (snapshot.versionNumber < current.versionNumber || Date.parse(snapshot.serverTime) < Date.parse(current.serverTime))) return;
      setState({ status: 'ready', snapshot, offline: false, lastSyncedAt: snapshot.serverTime });
    } catch (error) {
      setState((current) => ({ ...current, status: 'error', offline: isNetworkError(error) }));
      if (!isNetworkError(error)) goneRef.current?.();
    }
  }, [spaceId]);
  useEffect(() => {
    if (!spaceId) return;
    void refresh();
    const unsubscribe = realtime.subscribe(spaceId, (event) => {
      if (event.event === 'session') {
        const current = stateRef.current;
        const payload = event.payload;
        if (current.snapshot) {
          const promptSession = payload.status === 'released' || payload.status === 'expired' ? null : {
            sessionId: String(payload.sessionId ?? current.snapshot.promptSession?.sessionId ?? ''),
            ownerUserId: String(payload.ownerUserId ?? current.snapshot.promptSession?.ownerUserId ?? ''),
            expiresAt: String(payload.expiresAt ?? current.snapshot.promptSession?.expiresAt ?? ''),
            status: 'occupied' as const,
          };
          setState({ ...current, snapshot: { ...current.snapshot, promptSession } });
        }
        if (sessionTimer.current) clearTimeout(sessionTimer.current);
        sessionTimer.current = setTimeout(() => { void refresh(); }, 300);
      } else void refresh();
    }, (status) => {
      const isJoined = status === 'SUBSCRIBED';
      joinedRef.current = isJoined;
      setJoined(isJoined);
      if (isJoined) void refresh();
    });
    const foregroundSub = AppState.addEventListener('change', (next) => {
      const active = next === 'active';
      setForeground(active);
      if (active) void refresh();
    });
    return () => { unsubscribe(); foregroundSub.remove(); joinedRef.current = false; if (sessionTimer.current) clearTimeout(sessionTimer.current); };
  }, [spaceId, realtime, refresh]);
  useEffect(() => {
    if (!foreground || (joined && !state.offline)) return;
    const timer = setInterval(() => { void refresh(); }, state.offline ? OFFLINE_RETRY_MS : SAFETY_POLL_MS);
    return () => clearInterval(timer);
  }, [state.offline, joined, foreground, refresh]);
  const reset = useCallback(() => setState(initialState), []);
  return { state, refresh, reset };
}
