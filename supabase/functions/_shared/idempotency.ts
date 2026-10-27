export interface IdempotencyStore {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
}
/** Store implementations must serialize the lookup, mutation and response write in one database transaction. */
export async function withIdempotency<T>(store: IdempotencyStore, userId: string, endpoint: string, key: string, work: () => Promise<T>): Promise<T> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw new Error('INVALID_IDEMPOTENCY_KEY');
  const scopedKey = JSON.stringify([userId, endpoint, key]);
  const previous = await store.get(scopedKey);
  if (previous !== undefined) return previous as T;
  const result = await work();
  await store.put(scopedKey, result);
  return result;
}
