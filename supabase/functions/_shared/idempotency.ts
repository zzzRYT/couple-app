import { AppError } from './errors.ts';

export type Claim = { status: 'claimed' } | { status: 'done'; response: unknown } | { status: 'pending' };
export interface IdempotencyStore {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
  /** Atomic claim: exactly one caller per key gets `claimed`; a concurrent caller sees `pending`, a later one `done`. */
  claim?(key: string): Promise<Claim>;
  /** Drops a claim whose work failed, so the same key can run again. */
  release?(key: string): Promise<void>;
}
/**
 * Runs `work` once per key. With an atomic store the key is claimed before the work starts, so an overlapping retry fails fast with
 * IN_PROGRESS instead of running the work twice; only successful results are stored. Stores without `claim` fall back to get-then-put.
 */
export async function withIdempotency<T>(store: IdempotencyStore, userId: string, endpoint: string, key: string, work: () => Promise<T>): Promise<T> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw new Error('INVALID_IDEMPOTENCY_KEY');
  const scopedKey = JSON.stringify([userId, endpoint, key]);
  if (store.claim) {
    const claim = await store.claim(scopedKey);
    if (claim.status === 'done') return claim.response as T;
    if (claim.status === 'pending') throw new AppError('IN_PROGRESS');
    try {
      const result = await work();
      await store.put(scopedKey, result);
      return result;
    } catch (error) {
      await store.release?.(scopedKey).catch(() => undefined);
      throw error;
    }
  }
  const previous = await store.get(scopedKey);
  if (previous !== undefined) return previous as T;
  const result = await work();
  await store.put(scopedKey, result);
  return result;
}
