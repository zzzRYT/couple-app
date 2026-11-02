import * as SecureStore from 'expo-secure-store';
import { clearV0Cache, readV0Cache } from './v0Cache';
export type StoredInvite = { code: string; expiresAt: string };
const inviteKey = (spaceId: string) => `v0.invite.${spaceId}`;
export async function saveV0Invite(spaceId: string, invite: StoredInvite) { await SecureStore.setItemAsync(inviteKey(spaceId), JSON.stringify(invite)); }
export async function readV0Invite(spaceId: string): Promise<StoredInvite | null> {
  try { const value = JSON.parse((await SecureStore.getItemAsync(inviteKey(spaceId))) ?? 'null'); return typeof value?.code === 'string' && typeof value?.expiresAt === 'string' ? value : null; } catch { return null; }
}
export async function clearV0LocalData(userId: string, spaceId?: string | null) {
  spaceId ??= (await readV0Cache(userId))?.spaceId;
  const keys = spaceId ? [inviteKey(spaceId), `v0.connected.seen.${spaceId}.${userId}`, `v0.partnerEdited.seen.${spaceId}.${userId}`, `v0.celebration.seen.${spaceId}.${userId}`] : [];
  await Promise.all([clearV0Cache(userId), ...keys.map((key) => SecureStore.deleteItemAsync(key))]);
}
