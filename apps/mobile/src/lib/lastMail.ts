import * as SecureStore from 'expo-secure-store';

const KEY = 'v0.auth.lastMail';
type Storage = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync'>;
/** The mail this device sent last. An Auth error link does not say which mail it came from, so V0-auth-link-exp picks its variant from this. */
export type LastMail = { kind: 'signup'; email: string } | { kind: 'reset' };
export async function rememberMail(mail: LastMail, storage: Storage = SecureStore): Promise<void> {
  await storage.setItemAsync(KEY, JSON.stringify(mail)).catch(() => undefined);
}
export async function readLastMail(storage: Storage = SecureStore): Promise<LastMail | null> {
  try {
    const value: unknown = JSON.parse((await storage.getItemAsync(KEY)) ?? 'null');
    if (typeof value !== 'object' || value === null) return null;
    const { kind, email } = value as { kind?: unknown; email?: unknown };
    if (kind === 'signup' && typeof email === 'string' && email) return { kind, email };
    return kind === 'reset' ? { kind } : null;
  } catch {
    return null;
  }
}
/** V0-auth-link-exp: `recovery` is known only when the link carried a session that failed; an error link (`null`) follows the last mail sent. */
export type ExpiredLink = { kind: 'reset' } | { kind: 'confirm'; email: string | null };
export function expiredLink(recovery: boolean | null, last: LastMail | null): ExpiredLink {
  const email = last?.kind === 'signup' ? last.email : null;
  const confirm = recovery === null ? email !== null : !recovery;
  return confirm ? { kind: 'confirm', email } : { kind: 'reset' };
}
