import * as SecureStore from 'expo-secure-store';

type Storage = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync'>;
const keyFor = (spaceId: string, userId: string) => `v0.anniv.playful.${spaceId}.${userId}`;
export async function readPlayfulPreference(spaceId: string, userId: string, store: Storage = SecureStore): Promise<boolean> {
  return (await store.getItemAsync(keyFor(spaceId, userId))) === 'true';
}
export async function writePlayfulPreference(spaceId: string, userId: string, value: boolean, store: Storage = SecureStore): Promise<void> {
  await store.setItemAsync(keyFor(spaceId, userId), String(value));
}
