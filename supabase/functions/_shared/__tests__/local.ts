// Integration helpers for the local stack only (`supabase start`); keys come from `supabase status`, never from the repository.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { Deps } from '../http.ts';
import { clientVerifier, rpcDb, tableIdempotencyStore } from '../db.ts';

let cached: { url: string; serviceKey: string; anonKey: string; mailUrl?: string } | undefined;
export async function localEnv() {
  if (cached) return cached;
  const fromEnv = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (fromEnv && key && anon) return (cached = { url: fromEnv, serviceKey: key, anonKey: anon });
  for (const [cmd, args] of [['supabase', ['status', '-o', 'json']], ['npx', ['--no-install', 'supabase', 'status', '-o', 'json']]] as const) {
    try {
      const out = await new Deno.Command(cmd, { args: [...args], stdout: 'piped', stderr: 'null' }).output();
      if (!out.success) continue;
      const text = new TextDecoder().decode(out.stdout);
      const status = JSON.parse(text.slice(text.indexOf('{')));
      return (cached = { url: status.API_URL, serviceKey: status.SERVICE_ROLE_KEY, anonKey: status.ANON_KEY, mailUrl: status.MAILPIT_URL ?? status.INBUCKET_URL });
    } catch { /* try the next launcher */ }
  }
  throw new Error('Local Supabase is not running; run `supabase start`.');
}
export async function service(): Promise<SupabaseClient> {
  const env = await localEnv();
  return createClient(env.url, env.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
/** A client that acts as the user through RLS (anon key + the user's token), the way the app's own queries would. */
export async function userClient(user: TestUser): Promise<SupabaseClient> {
  const env = await localEnv();
  return createClient(env.url, env.anonKey, { global: { headers: { Authorization: `Bearer ${user.token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
}
export async function localDeps(overrides: Partial<Deps> = {}): Promise<Deps> {
  const client = await service();
  return { db: rpcDb(client), verifier: clientVerifier(client), idempotency: tableIdempotencyStore(client), ...overrides };
}
export type TestUser = { id: string; token: string };
export async function makeUser(label: string): Promise<TestUser> {
  const env = await localEnv();
  const admin = await service();
  const email = `${label}-${crypto.randomUUID()}@example.invalid`, password = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error('createUser failed');
  const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signed = await anon.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) throw signed.error ?? new Error('sign-in failed');
  return { id: data.user.id, token: signed.data.session.access_token };
}
export async function call(handler: (r: Request) => Promise<Response>, user: TestUser | null, method: string, path: string, body?: unknown, key: string | null = crypto.randomUUID()) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) headers.Authorization = `Bearer ${user.token}`;
  if (key && method !== 'GET') headers['Idempotency-Key'] = key;
  const response = await handler(new Request(`http://local/functions/v1${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }));
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
export async function sql(query: string): Promise<unknown> {
  const out = await new Deno.Command('docker', { args: ['exec', 'supabase_db_couple-app', 'psql', '-U', 'postgres', '-tAc', query], stdout: 'piped', stderr: 'piped' }).output();
  if (!out.success) throw new Error(new TextDecoder().decode(out.stderr));
  return new TextDecoder().decode(out.stdout).trim();
}
