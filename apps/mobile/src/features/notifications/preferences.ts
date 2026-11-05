import * as FileSystem from 'expo-file-system/legacy';

export type Early = 'none' | '1d' | '3d' | '7d';
export type NotifyPrefs = {
  enabled: boolean;
  time: string;
  early: Early;
  kinds: { milestone: boolean; birthday: boolean; season: boolean; custom: boolean };
  offIds: string[];
  prePromptSeen: boolean;
};
export const DEFAULT_NOTIFY_PREFS: NotifyPrefs = { enabled: false, time: '09:00', early: '1d', kinds: { milestone: true, birthday: true, season: true, custom: true }, offIds: [], prePromptSeen: false };

type Prefs = { offIds?: string[]; [key: string]: unknown };
const path = (userId: string) => `${FileSystem.documentDirectory}v0-notify-${encodeURIComponent(userId)}.json`;
const listeners = new Set<() => void>();
/** Every write goes through this queue so two quick toggles cannot overwrite each other. */
let writes: Promise<unknown> = Promise.resolve();
function queued<T>(task: () => Promise<T>): Promise<T> {
  const run = writes.then(task, task);
  writes = run.catch(() => undefined);
  return run.finally(() => listeners.forEach((listener) => listener()));
}
async function read(userId: string): Promise<Prefs> {
  try {
    const value: unknown = JSON.parse(await FileSystem.readAsStringAsync(path(userId)));
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Prefs : {};
  } catch { return {}; }
}
const flag = (value: unknown, fallback: boolean) => typeof value === 'boolean' ? value : fallback;
/** The file may come from an older build (H03 wrote only offIds) or be damaged, so each field falls back on its own. */
function normalize(raw: Prefs): NotifyPrefs {
  const base = DEFAULT_NOTIFY_PREFS;
  const kinds = raw.kinds && typeof raw.kinds === 'object' ? raw.kinds as Partial<Record<keyof NotifyPrefs['kinds'], unknown>> : {};
  return {
    enabled: flag(raw.enabled, base.enabled),
    time: typeof raw.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time) ? raw.time : base.time,
    early: raw.early === 'none' || raw.early === '1d' || raw.early === '3d' || raw.early === '7d' ? raw.early : base.early,
    kinds: { milestone: flag(kinds.milestone, true), birthday: flag(kinds.birthday, true), season: flag(kinds.season, true), custom: flag(kinds.custom, true) },
    offIds: Array.isArray(raw.offIds) ? raw.offIds.filter((id): id is string => typeof id === 'string') : [],
    prePromptSeen: flag(raw.prePromptSeen, false),
  };
}
export async function readNotifyPrefs(userId: string): Promise<NotifyPrefs> { return normalize(await read(userId)); }
export function updateNotifyPrefs(userId: string, patch: Partial<NotifyPrefs>): Promise<NotifyPrefs> {
  return queued(async () => {
    const next = { ...normalize(await read(userId)), ...patch };
    await FileSystem.writeAsStringAsync(path(userId), JSON.stringify(next));
    return next;
  });
}
/** Runs after any preference write, including clearing them on logout. */
export function subscribeNotifyPrefs(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export async function getAnniversaryNotify(userId: string, customId: string): Promise<'default' | 'off'> {
  const prefs = await read(userId);
  return Array.isArray(prefs.offIds) && prefs.offIds.includes(customId) ? 'off' : 'default';
}
export function setAnniversaryNotify(userId: string, customId: string, value: 'default' | 'off') {
  return queued(async () => {
    const prefs = await read(userId);
    const ids = new Set(Array.isArray(prefs.offIds) ? prefs.offIds : []);
    if (value === 'off') ids.add(customId); else ids.delete(customId);
    await FileSystem.writeAsStringAsync(path(userId), JSON.stringify({ ...prefs, offIds: [...ids] }));
  });
}

export function clearAnniversaryNotify(userId: string) { return queued(() => FileSystem.deleteAsync(path(userId), { idempotent: true })); }
