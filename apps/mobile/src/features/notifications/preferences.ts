import * as FileSystem from 'expo-file-system/legacy';

type Prefs = { offIds?: string[]; [key: string]: unknown };
const path = (userId: string) => `${FileSystem.documentDirectory}v0-notify-${encodeURIComponent(userId)}.json`;
async function read(userId: string): Promise<Prefs> {
  try {
    const value: unknown = JSON.parse(await FileSystem.readAsStringAsync(path(userId)));
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Prefs : {};
  } catch { return {}; }
}
export async function getAnniversaryNotify(userId: string, customId: string): Promise<'default' | 'off'> {
  const prefs = await read(userId);
  return Array.isArray(prefs.offIds) && prefs.offIds.includes(customId) ? 'off' : 'default';
}
export async function setAnniversaryNotify(userId: string, customId: string, value: 'default' | 'off') {
  const prefs = await read(userId);
  const ids = new Set(Array.isArray(prefs.offIds) ? prefs.offIds : []);
  if (value === 'off') ids.add(customId); else ids.delete(customId);
  await FileSystem.writeAsStringAsync(path(userId), JSON.stringify({ ...prefs, offIds: [...ids] }));
}

export async function clearAnniversaryNotify(userId: string) { await FileSystem.deleteAsync(path(userId), { idempotent: true }); }
