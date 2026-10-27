import type { createSupabase } from './supabase';
import { spaceChannel } from './routes';
/** Realtime events carry only ids, statuses and version numbers; clients refetch content through the API. */
export type RealtimeEvent = { event: 'member' | 'room_version' | 'session' | 'message' | 'preview'; payload: Record<string, string | number | null> };
export type RealtimePort = { subscribe(spaceId: string, onEvent: (event: RealtimeEvent) => void): () => void };
export function supabaseRealtime(client: ReturnType<typeof createSupabase>): RealtimePort {
  return {
    subscribe(spaceId, onEvent) {
      const channel = client.channel(spaceChannel(spaceId), { config: { private: true } })
        .on('broadcast', { event: '*' }, (message) => onEvent({ event: message.event as RealtimeEvent['event'], payload: (message.payload ?? {}) as RealtimeEvent['payload'] }))
        .subscribe();
      return () => { void client.removeChannel(channel); };
    },
  };
}
/** In-memory bus used by tests to stand in for the Realtime server between two simulated devices. */
export function memoryRealtime() {
  const listeners = new Map<string, Set<(event: RealtimeEvent) => void>>();
  return {
    subscribe(spaceId: string, onEvent: (event: RealtimeEvent) => void) {
      const set = listeners.get(spaceId) ?? new Set();
      set.add(onEvent); listeners.set(spaceId, set);
      return () => { set.delete(onEvent); };
    },
    emit(spaceId: string, event: RealtimeEvent) { for (const listener of listeners.get(spaceId) ?? []) listener(event); },
  };
}
export const isNetworkError = (error: unknown) => error instanceof TypeError;
