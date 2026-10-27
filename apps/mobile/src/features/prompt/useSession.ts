import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { PromptSession } from '../../lib/client';
import { ApiError } from '../../lib/errors';
export type SessionApi = {
  acquire(spaceId: string): Promise<PromptSession>;
  heartbeat(spaceId: string, sessionId: string): Promise<PromptSession>;
  takeover(spaceId: string, sessionId: string, expectedOwnerUserId: string): Promise<PromptSession>;
  release(spaceId: string, sessionId: string): Promise<void>;
};
export type SessionSettings = { idleSeconds: number; warnSeconds: number; heartbeatMs: number };
export const defaultSessionSettings: SessionSettings = { idleSeconds: 180, warnSeconds: 30, heartbeatMs: 20_000 };
export type SessionStatus = 'free' | 'mine' | 'mineExpiring' | 'mineExpired' | 'partner' | 'partnerExpired';
type Lease = Pick<PromptSession, 'ownerUserId' | 'expiresAt'> & { sessionId: string | null };
/** Client half of the prompt lease: heartbeats only follow real activity in the foreground; the server clock decides expiry. */
export function useSession({ api, spaceId, me, initial, clock = Date.now, settings = defaultSessionSettings }: { api: SessionApi; spaceId: string; me: string; initial: PromptSession | null; clock?: () => number; settings?: SessionSettings }) {
  const [lease, setLease] = useState<Lease | null>(initial && initial.status === 'occupied' ? initial : null);
  const [now, setNow] = useState(clock());
  const [lostTakeover, setLostTakeover] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');
  const active = useRef(false);
  useEffect(() => { setLease(initial && initial.status === 'occupied' ? initial : null); }, [initial]);
  useEffect(() => { const timer = setInterval(() => setNow(clock()), 1000); return () => clearInterval(timer); }, [clock]);
  useEffect(() => { const sub = AppState.addEventListener('change', (next) => setForeground(next === 'active')); return () => sub.remove(); }, []);
  const secondsLeft = lease ? Math.max(0, Math.ceil((Date.parse(lease.expiresAt) - now) / 1000)) : 0;
  const mine = lease?.ownerUserId === me;
  const status: SessionStatus = !lease ? 'free' : mine ? (secondsLeft <= 0 ? 'mineExpired' : secondsLeft <= settings.warnSeconds ? 'mineExpiring' : 'mine') : secondsLeft <= 0 ? 'partnerExpired' : 'partner';
  const beat = useCallback(async () => {
    if (!lease?.sessionId || !active.current) return;
    active.current = false;
    try { setLease(await api.heartbeat(spaceId, lease.sessionId)); } catch (error) { if (error instanceof ApiError) setLease((current) => current && { ...current, expiresAt: new Date(clock()).toISOString() }); }
  }, [api, spaceId, lease?.sessionId, clock]);
  useEffect(() => {
    if (!mine || !foreground || status === 'mineExpired') return;
    const timer = setInterval(() => { void beat(); }, settings.heartbeatMs);
    return () => clearInterval(timer);
  }, [mine, foreground, status, beat, settings.heartbeatMs]);
  const occupiedFrom = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'SESSION_OCCUPIED' && typeof error.details.ownerUserId === 'string') {
      setLease({ sessionId: (error.details.sessionId as string | undefined) ?? null, ownerUserId: error.details.ownerUserId, expiresAt: String(error.details.expiresAt) });
      return true;
    }
    return false;
  };
  return {
    status, secondsLeft, lease, lostTakeover,
    /** Call on typing or other meaningful input; the next heartbeat extends the lease. */
    noteActivity: () => { active.current = true; },
    keepAlive: async () => { active.current = true; await beat(); },
    acquire: async () => {
      setLostTakeover(false);
      try { setLease(await api.acquire(spaceId)); return true; } catch (error) { if (!occupiedFrom(error)) throw error; return false; }
    },
    takeover: async () => {
      if (!lease?.sessionId) return false;
      try { setLease(await api.takeover(spaceId, lease.sessionId, lease.ownerUserId)); return true; } catch (error) { if (occupiedFrom(error)) { setLostTakeover(true); return false; } throw error; }
    },
    release: async () => { if (lease?.sessionId && mine) await api.release(spaceId, lease.sessionId); setLease(null); },
    clear: () => setLease(null),
  };
}
