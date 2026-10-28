import * as SecureStore from 'expo-secure-store';

const KEY = 'pendingInvite';
type Storage = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'>;
/** Accept only our own links or a complete code; never log the bearer secret. */
export function parseInvite(value: string): string | null {
  const input = value.trim();
  const match = /^(?:https:\/\/aroom\.jinjinstar\.com\/i\/|aroom(?:-dev)?:\/\/invite\/)?([a-z0-9]{4})-?([a-z0-9]{4})\/?$/i.exec(input);
  return match ? `${match[1]}${match[2]}`.toUpperCase() : null;
}
export async function savePendingInvite(code: string, storage: Storage = SecureStore): Promise<void> {
  const parsed = parseInvite(code);
  if (parsed) await storage.setItemAsync(KEY, parsed);
}
export async function takePendingInvite(storage: Storage = SecureStore): Promise<string | null> {
  const code = await storage.getItemAsync(KEY);
  await storage.deleteItemAsync(KEY);
  return code ? parseInvite(code) : null;
}
export async function peekPendingInvite(storage: Storage = SecureStore): Promise<string | null> {
  const code = await storage.getItemAsync(KEY);
  return code ? parseInvite(code) : null;
}
export async function clearPendingInvite(storage: Storage = SecureStore): Promise<void> {
  await storage.deleteItemAsync(KEY);
}
