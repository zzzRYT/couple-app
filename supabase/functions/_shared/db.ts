import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { AppError, isErrorCode } from './errors.ts';
import type { Claim, IdempotencyStore } from './idempotency.ts';
import type { UserVerifier } from './auth.ts';

export interface Db {
  rpc<T = unknown>(name: string, args: Record<string, unknown>): Promise<T>;
}
/** Server-only client: the service-role key comes from the function environment and never reaches the app. */
export function serviceClient(env: (name: string) => string | undefined = Deno.env.get): SupabaseClient {
  const url = env('SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('MISSING_SERVER_CONFIG');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function rpcDb(client: SupabaseClient): Db {
  return {
    async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
      const { data, error } = await client.rpc(name, args);
      if (error) {
        const [code, ...rest] = String(error.message).split(':');
        if (code && isErrorCode(code)) throw new AppError(code, parseExtra(rest.join(':')));
        throw new Error('DB_ERROR');
      }
      if (data && typeof data === 'object' && 'error' in data) {
        const { code, ...extra } = (data as { error: { code: string } }).error;
        if (isErrorCode(code)) throw new AppError(code, extra);
      }
      return data as T;
    },
  };
}
function parseExtra(text: string): Record<string, unknown> {
  if (!text) return {};
  try { const value = JSON.parse(text); return value && typeof value === 'object' ? value : {}; } catch { return {}; }
}
export function tableIdempotencyStore(client: SupabaseClient): IdempotencyStore {
  const parts = (scoped: string) => { const [userId, endpoint, key] = JSON.parse(scoped) as string[]; return { p_user: userId, p_endpoint: endpoint, p_key: key }; };
  return {
    async get(scoped) {
      const [userId, endpoint, key] = JSON.parse(scoped) as string[];
      const { data } = await client.from('idempotency_key').select('response').eq('user_id', userId).eq('endpoint', endpoint).eq('key', key).eq('state', 'done').maybeSingle();
      return data ? (data as { response: unknown }).response : undefined;
    },
    async put(scoped, value) {
      const { error } = await client.rpc('idempotency_complete', { ...parts(scoped), p_response: value ?? null });
      if (error) throw new Error('DB_ERROR');
    },
    async claim(scoped) {
      const { data, error } = await client.rpc('idempotency_claim', parts(scoped));
      if (error || !data) throw new Error('DB_ERROR');
      return data as Claim;
    },
    async release(scoped) {
      await client.rpc('idempotency_release', parts(scoped));
    },
  };
}
export function clientVerifier(client: SupabaseClient): UserVerifier {
  return { async getUser(token) { const { data, error } = await client.auth.getUser(token); return { user: data.user, error }; } };
}
