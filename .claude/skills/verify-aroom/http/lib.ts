// Shared HTTP helpers for the pre-deploy scenarios: everything goes through `supabase functions serve` on the local stack.
import { localEnv, makeUser, service, sql, type TestUser } from '../../../../supabase/functions/_shared/__tests__/local.ts';
export { localEnv, makeUser, service, sql, type TestUser };
export const env = await localEnv();
export const FN = `${env.url}/functions/v1`;
export type Res = { status: number; body: any; ms: number };
export async function http(user: TestUser | null, method: string, path: string, body?: unknown, key: string | null = crypto.randomUUID()): Promise<Res> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) headers.Authorization = `Bearer ${user.token}`;
  if (key && method !== 'GET') headers['Idempotency-Key'] = key;
  const t = performance.now();
  const r = await fetch(`${FN}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let parsed: unknown = text;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { status: r.status, body: parsed, ms: Math.round(performance.now() - t) };
}
/** PostgREST call as the user (anon key + user JWT), like the app's own direct queries. */
export async function rest(user: TestUser, method: string, path: string, body?: unknown) {
  const r = await fetch(`${env.url}/rest/v1${path}`, { method, headers: { apikey: env.anonKey, Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let parsed: unknown = text; try { parsed = text ? JSON.parse(text) : null; } catch { /* text */ }
  return { status: r.status, body: parsed as any };
}
export async function couple(tz = 'Asia/Seoul', anniversaryDate = '2025-01-01') {
  const [a, b, c] = await Promise.all([makeUser('pd-a'), makeUser('pd-b'), makeUser('pd-c')]);
  const space = await http(a, 'POST', '/spaces/spaces', { anniversaryDate, timeZone: tz });
  if (space.status !== 201) throw new Error(`create_space ${space.status} ${JSON.stringify(space.body)}`);
  const issued = await http(a, 'POST', `/invitations/spaces/${space.body.spaceId}/invitations`, {});
  const joined = await http(b, 'POST', '/invitations/invitations/accept', { code: issued.body.code });
  if (joined.status !== 200) throw new Error(`accept ${joined.status} ${JSON.stringify(joined.body)}`);
  return { a, b, c, spaceId: space.body.spaceId as string };
}
export type Result = { area: string; scenario: string; result: 'pass' | 'fail' | 'not-runnable'; evidence: string };
export const results: Result[] = [];
export async function scenario(area: string, name: string, fn: (ev: string[]) => Promise<void>) {
  const ev: string[] = [];
  try { await fn(ev); results.push({ area, scenario: name, result: 'pass', evidence: ev.join('; ') }); console.log(`PASS ${area} | ${name}`); }
  catch (e) {
    if ((e as Error).message === 'NOT_RUNNABLE') { results.push({ area, scenario: name, result: 'not-runnable', evidence: ev.join('; ') }); console.log(`N/A  ${area} | ${name}`); return; }
    results.push({ area, scenario: name, result: 'fail', evidence: [...ev, `FAILED: ${(e as Error).message}`].join('; ') }); console.log(`FAIL ${area} | ${name}: ${(e as Error).message}`); }
}
export function expect(cond: unknown, msg: string): asserts cond { if (!cond) throw new Error(msg); }
export function eq(actual: unknown, expected: unknown, msg: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${msg}: got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`);
}
/** Fixes the database clock (`public.app_now()`) on the local stack only; restoreClock puts back `now()`. */
export async function setClock(iso: string) {
  await sql(`create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $f$ select '${iso}'::timestamptz $f$;`);
}
export async function restoreClock() {
  await sql(`create or replace function public.app_now() returns timestamptz language sql stable set search_path = '' as $f$ select now(); $f$;`);
}
