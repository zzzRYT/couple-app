import * as FileSystem from 'expo-file-system/legacy';
import type { Snapshot } from '../../lib/client';

type V0Part = Pick<Snapshot, 'space' | 'members' | 'me' | 'anniversaries' | 'serverTime'>;
type Cache = { savedAt: string; userId: string; spaceId: string; snapshotV0Part: V0Part };
const path = (userId: string) => `${FileSystem.documentDirectory}v0-cache-${encodeURIComponent(userId)}.json`;
export async function writeV0Cache(userId: string, snapshot: Snapshot) {
  const { space, members, me, anniversaries, serverTime } = snapshot;
  const safeMe = { ...me, birthday: me.birthday ? { ...me.birthday, year: null } : null };
  const value: Cache = { savedAt: new Date().toISOString(), userId, spaceId: space.spaceId, snapshotV0Part: { space, members, me: safeMe, anniversaries, serverTime } };
  await FileSystem.writeAsStringAsync(path(userId), JSON.stringify(value));
}
export async function readV0Cache(userId: string): Promise<Cache | null> {
  try {
    const value = JSON.parse(await FileSystem.readAsStringAsync(path(userId))) as Cache;
    if (value.userId !== userId || !value.spaceId || value.snapshotV0Part?.space.spaceId !== value.spaceId) return null;
    return value;
  } catch { return null; }
}
export async function clearV0Cache(userId: string) { await FileSystem.deleteAsync(path(userId), { idempotent: true }); }
/** The offline shell only reads V0 fields; legacy room/prompt fields are intentionally absent from disk. */
export function cachedSnapshot(cache: Cache): Snapshot {
  return { ...cache.snapshotV0Part, features: { generation: false, generatedRender: false }, versionNumber: 0,
    sceneDocument: { schemaVersion: 1, canvasProfile: 'room-portrait-v1', objects: [], texts: [] },
    roomPresentation: { schemaVersion: 1, visible: false, x: 0, y: 0, width: 0, height: 0, styleToken: '', textScale: 1 },
    roomThemeDocument: { schemaVersion: 1, mode: 'day', timeZone: cache.snapshotV0Part.space.timeZone, day: null, night: null }, promptSession: null, catalogVersion: 0 };
}
