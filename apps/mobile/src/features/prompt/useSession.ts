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
/** Fallbacks for a lease that carries no server settings (older server, or a lease rebuilt from a realtime hint). */
export type SessionSettings = { idleSeconds: number; warnSeconds: number; heartbeatMs: number };
export const defaultSessionSettings: SessionSettings = { idleSeconds: 180, warnSeconds: 30, heartbeatMs: 20_000 };
export type SessionStatus = 'free' | 'mine' | 'mineExpiring' | 'mineExpired' | 'partner' | 'partnerExpired';
type Lease = Pick<PromptSession, 'ownerUserId' | 'expiresAt' | 'warnAt' | 'idleSeconds' | 'warnSeconds'> & { sessionId: string | null; expired: boolean };
const toLease = (session: PromptSession): Lease => ({ sessionId: session.sessionId, ownerUserId: session.ownerUserId, expiresAt: session.expiresAt,
  warnAt: session.warnAt, idleSeconds: session.idleSeconds, warnSeconds: session.warnSeconds, expired: session.status === 'expired' });
const fromSnapshot = (session: PromptSession | null) => (session && session.status !== 'released' ? toLease(session) : null);
const warnSecondsOf = (lease: Lease, fallback: number) =>
  lease.warnAt ? Math.max(0, (Date.parse(lease.expiresAt) - Date.parse(lease.warnAt)) / 1000) : lease.warnSeconds ?? fallback;

/**
 * Client half of the prompt lease. The server clock decides expiry: remaining time is measured on the server's clock (the offset comes from
 * `serverTime`), and the warning point and idle window come from the lease. Heartbeats follow real activity in the foreground, and keep
 * going while `hold` is set (an open preview the owner is looking at) so reading a preview never costs the lease.
 */
export function useSession({ api, spaceId, me, initial, serverTime, hold = false, clock = Date.now, settings = defaultSessionSettings }: {
  api: SessionApi; spaceId: string; me: string; initial: PromptSession | null; serverTime?: string | null; hold?: boolean; clock?: () => number; settings?: SessionSettings;
}) {
  const [lease, setLease] = useState<Lease | null>(fromSnapshot(initial));
  const [, setTick] = useState(0);
  const [lostTakeover, setLostTakeover] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');
  const active = useRef(false);
  const holding = useRef(hold);
  holding.current = hold;
  const offset = useRef({ serverMs: Number.NEGATIVE_INFINITY, ms: 0 });
  if (serverTime) {
    const serverMs = Date.parse(serverTime);
    if (serverMs > offset.current.serverMs) offset.current = { serverMs, ms: serverMs - clock() };
  }
  const serverNow = useCallback(() => clock() + offset.current.ms, [clock]);
  useEffect(() => { setLease(fromSnapshot(initial)); }, [initial]);
  useEffect(() => { const timer = setInterval(() => setTick((n) => n + 1), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { const sub = AppState.addEventListener('change', (next) => setForeground(next === 'active')); return () => sub.remove(); }, []);
  const secondsLeft = lease ? Math.max(0, Math.ceil((Date.parse(lease.expiresAt) - serverNow()) / 1000)) : 0;
  const mine = lease?.ownerUserId === me;
  const expired = !!lease && (lease.expired || secondsLeft <= 0);
  const warn = lease ? warnSecondsOf(lease, settings.warnSeconds) : settings.warnSeconds;
  const status: SessionStatus = !lease ? 'free' : mine ? (expired ? 'mineExpired' : secondsLeft <= warn ? 'mineExpiring' : 'mine') : expired ? 'partnerExpired' : 'partner';
  const beat = useCallback(async () => {
    if (!lease?.sessionId || lease.expired || (!active.current && !holding.current)) return;
    active.current = false;
    try { setLease(toLease(await api.heartbeat(spaceId, lease.sessionId))); } catch (error) {
      if (error instanceof ApiError) setLease((current) => current && { ...current, expired: true, expiresAt: new Date(serverNow()).toISOString() });
    }
  }, [api, spaceId, lease?.sessionId, lease?.expired, serverNow]);
  const heartbeatMs = Math.min(settings.heartbeatMs, ((lease?.idleSeconds ?? settings.idleSeconds) * 1000) / 3);
  useEffect(() => {
    if (!mine || !foreground || status === 'mineExpired') return;
    const timer = setInterval(() => { void beat(); }, heartbeatMs);
    return () => clearInterval(timer);
  }, [mine, foreground, status, beat, heartbeatMs]);
  const occupiedFrom = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'SESSION_OCCUPIED' && typeof error.details.ownerUserId === 'string') {
      setLease({ sessionId: (error.details.sessionId as string | undefined) ?? null, ownerUserId: error.details.ownerUserId, expiresAt: String(error.details.expiresAt), expired: false });
      return true;
    }
    return false;
  };
  /** The server picks the transition: a new lease, a revival of my expired one, or a takeover of the partner's expired one. */
  const acquire = async () => {
    setLostTakeover(false);
    try { setLease(toLease(await api.acquire(spaceId))); return true; } catch (error) { if (!occupiedFrom(error)) throw error; return false; }
  };
  return {
    status, secondsLeft, lease, lostTakeover, serverNow,
    /** Call on typing or other meaningful input; the next heartbeat extends the lease. */
    noteActivity: () => { active.current = true; },
    keepAlive: async () => { active.current = true; await beat(); },
    acquire,
    takeover: async () => {
      if (!lease?.sessionId) return acquire();
      try { setLease(toLease(await api.takeover(spaceId, lease.sessionId, lease.ownerUserId))); return true; } catch (error) {
        if (occupiedFrom(error)) { setLostTakeover(true); return false; }
        if (error instanceof ApiError && error.code === 'SESSION_CONFLICT') return acquire();
        throw error;
      }
    },
    release: async () => { if (lease?.sessionId && mine) await api.release(spaceId, lease.sessionId); setLease(null); },
    clear: () => setLease(null),
  };
}
