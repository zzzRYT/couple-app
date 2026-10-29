import type { createSupabase } from './supabase';
import { spaceChannel } from './routes';
/** Realtime events carry only ids, statuses and version numbers; clients refetch content through the API. */
export type RealtimeEvent = { event: 'member' | 'room_version' | 'session' | 'message' | 'preview'; payload: Record<string, string | number | null> };
export type RealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | string;
export type RealtimePort = { subscribe(spaceId: string, onEvent: (event: RealtimeEvent) => void, onStatus?: (status: RealtimeStatus) => void): () => void };
export function supabaseRealtime(client: ReturnType<typeof createSupabase>): RealtimePort {
  const spaces = new Map<string, { channel: ReturnType<typeof client.channel>; listeners: Map<symbol, { event: (event: RealtimeEvent) => void; status?: (status: RealtimeStatus) => void }>; recent: Map<string, number> }>();
  return {
    subscribe(spaceId, onEvent, onStatus) {
      let entry = spaces.get(spaceId);
      let shouldJoin = false;
      if (!entry) {
        const listeners = new Map<symbol, { event: (event: RealtimeEvent) => void; status?: (status: RealtimeStatus) => void }>();
        const recent = new Map<string, number>();
        const channel = client.channel(spaceChannel(spaceId), { config: { private: true } })
          .on('broadcast', { event: '*' }, (message) => {
            const event = { event: message.event as RealtimeEvent['event'], payload: (message.payload ?? {}) as RealtimeEvent['payload'] };
            const now = Date.now();
            for (const [key, seenAt] of recent) if (now - seenAt > 1500) recent.delete(key);
            const key = JSON.stringify(event);
            if (recent.has(key)) return;
            recent.set(key, now);
            for (const listener of listeners.values()) listener.event(event);
          });
        entry = { channel, listeners, recent };
        spaces.set(spaceId, entry);
        shouldJoin = true;
      }
      const token = Symbol(spaceId);
      entry.listeners.set(token, { event: onEvent, status: onStatus });
      if (shouldJoin) entry.channel.subscribe((status) => { for (const listener of entry!.listeners.values()) listener.status?.(status); });
      return () => {
        const current = spaces.get(spaceId);
        if (!current || !current.listeners.delete(token) || current.listeners.size) return;
        spaces.delete(spaceId);
        void client.removeChannel(current.channel);
      };
    },
  };
}
/** In-memory bus used by tests to stand in for the Realtime server between two simulated devices. */
export function memoryRealtime() {
  const listeners = new Map<string, Set<(event: RealtimeEvent) => void>>();
  const statuses = new Map<string, Set<(status: RealtimeStatus) => void>>();
  return {
    subscribe(spaceId: string, onEvent: (event: RealtimeEvent) => void, onStatus?: (status: RealtimeStatus) => void) {
      const set = listeners.get(spaceId) ?? new Set();
      set.add(onEvent); listeners.set(spaceId, set);
      if (onStatus) { const statusSet = statuses.get(spaceId) ?? new Set(); statusSet.add(onStatus); statuses.set(spaceId, statusSet); }
      return () => { set.delete(onEvent); if (onStatus) statuses.get(spaceId)?.delete(onStatus); };
    },
    emit(spaceId: string, event: RealtimeEvent) { for (const listener of listeners.get(spaceId) ?? []) listener(event); },
    status(spaceId: string, status: RealtimeStatus) { for (const listener of statuses.get(spaceId) ?? []) listener(status); },
  };
}
export const isNetworkError = (error: unknown) => error instanceof TypeError;
