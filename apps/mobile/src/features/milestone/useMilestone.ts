import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Client, MilestoneCelebration, MilestoneResponse } from '../../lib/client';

type MilestoneApi = Pick<Client, 'milestones' | 'milestoneSeen'>;
type Stored = { value: MilestoneResponse; pending: string[] };
const storageKey = (spaceId: string, userId: string) => `milestone:${spaceId}:${userId}`;
export async function clearMilestoneStorage(spaceId: string, userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey(spaceId, userId));
}
/** Cached verified card is the only celebration allowed offline; its close is replayed idempotently. */
export function useMilestone(spaceId: string | null, userId: string | null, online: boolean, api: MilestoneApi, via: 'home' | 'room', allowOfflineCache = !online, revision = '') {
  const [value, setValue] = useState<MilestoneResponse | null>(null);
  const [closed, setClosed] = useState<string[]>([]);
  const key = spaceId && userId ? storageKey(spaceId, userId) : null;
  const previousKey = useRef<string | null>(key);
  useEffect(() => {
    if (previousKey.current && previousKey.current !== key) void SecureStore.deleteItemAsync(previousKey.current);
    previousKey.current = key;
  }, [key]);
  const reload = useCallback(async () => {
    if (!spaceId || !userId || !online) return;
    const next = await api.milestones(spaceId);
    setValue(next);
    const current = JSON.parse(await SecureStore.getItemAsync(key!) || '{"pending":[]}') as Partial<Stored>;
    const pending = current.pending ?? [];
    await SecureStore.setItemAsync(key!, JSON.stringify({ value: next, pending } satisfies Stored));
    const remaining: string[] = [], delivered: string[] = [];
    for (const id of pending) {
      try { await api.milestoneSeen(spaceId, id, via); delivered.push(id); } catch { remaining.push(id); }
    }
    if (pending.length) {
      const cached = next.celebration && delivered.includes(next.celebration.id)
        ? { ...next, celebration: { ...next.celebration, seenByMe: true } } : next;
      await SecureStore.setItemAsync(key!, JSON.stringify({ value: cached, pending: remaining } satisfies Stored));
      setValue(cached);
    }
    setClosed(remaining);
  }, [api, key, online, spaceId, userId, via]);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!key) { setValue(null); setClosed([]); return; }
      if (online) { try { await reload(); } catch { /* retain the last verified response */ } return; }
      if (!allowOfflineCache) { setValue(null); setClosed([]); return; }
      const stored = await SecureStore.getItemAsync(key);
      if (!active || !stored) return;
      try {
        const parsed = JSON.parse(stored) as Stored;
        setValue(parsed.value);
        setClosed(parsed.pending ?? []);
      } catch { setValue(null); setClosed([]); }
    }
    void load();
    return () => { active = false; };
  }, [allowOfflineCache, key, online, reload, revision]);
  useEffect(() => {
    if (!online) return;
    const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') void reload(); });
    return () => subscription.remove();
  }, [online, reload]);
  const seen = useCallback(async (celebration: MilestoneCelebration) => {
    if (!spaceId || !userId || !key) return;
    if (online) {
      try { await api.milestoneSeen(spaceId, celebration.id, via); } catch { return; }
      const current = value;
      if (current) {
        const next = { ...current, celebration: { ...celebration, seenByMe: true } };
        let pending: string[] = [];
        try { pending = ((JSON.parse(await SecureStore.getItemAsync(key) || '{}') as Partial<Stored>).pending ?? []).filter((id) => id !== celebration.id); } catch { /* start from an empty queue */ }
        await SecureStore.setItemAsync(key, JSON.stringify({ value: next, pending } satisfies Stored));
        setValue(next);
      }
      return;
    }
    let stored: Partial<Stored>;
    try { stored = JSON.parse(await SecureStore.getItemAsync(key) || '{"pending":[]}') as Partial<Stored>; } catch { return; }
    if (!stored.value && !value) return;
    const pending = [...new Set([...(stored.pending ?? []), celebration.id])];
    await SecureStore.setItemAsync(key, JSON.stringify({ value: stored.value ?? value!, pending } satisfies Stored));
    setClosed(pending);
  }, [api, key, online, spaceId, userId, value, via]);
  const preset = value?.celebration ?? null;
  const celebration = preset && !preset.seenByMe && !closed.includes(preset.id) ? preset : null;
  return useMemo(() => ({ value, celebration, preset, reload, seen }), [value, celebration, preset, reload, seen]);
}
