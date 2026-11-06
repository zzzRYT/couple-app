import { AppError, errorResponse, toResponse } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, type Context, type Deps } from '../_shared/http.ts';
import { safeLogFields } from '../_shared/logging.ts';
import { serviceClient } from '../_shared/db.ts';
import { bearerToken, jwtClaims, provedWithoutPassword } from '../account/reauth.ts';
import { authProvider, type PasswordProvider, type Tokens } from './provider.ts';
import { attemptKey, normalizedEmail, passwordIsAllowed } from './rules.ts';

/** Auth runs bcrypt only for an email it knows, so every sign-in answer takes at least this long. */
const MIN_ANSWER_MS = 500;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export type PasswordDeps = Deps & {
  provider: PasswordProvider;
  /** The signed-in user's address, from Auth. */
  emailOf(userId: string): Promise<string | null>;
  attemptSecret: string;
  sleep?: (ms: number) => Promise<void>;
};

function email(value: unknown): string {
  const address = str(value, 320);
  if (!EMAIL.test(address.trim())) throw new AppError('INVALID_REQUEST');
  return normalizedEmail(address);
}
/** Spends an attempt, runs the check, and settles the counter. `locked` covers both an already locked email and the failure that locks it. */
async function checkPassword(address: string, password: string, deps: PasswordDeps): Promise<{ kind: 'ok'; tokens: Tokens } | { kind: 'wrong' | 'locked' }> {
  const key = await attemptKey(address, deps.attemptSecret);
  const turn = await deps.db.rpc<'open' | 'last' | 'locked'>('password_attempt_take', { key });
  if (turn === 'locked') return { kind: 'locked' };
  const result = await deps.provider.grant(address, password);
  if (result.kind === 'ok') { await deps.db.rpc('password_attempt_clear', { key }); return result; }
  if (result.kind === 'unavailable') {
    await deps.db.rpc('password_attempt_refund', { key });
    throw new AppError('RATE_LIMITED');
  }
  return { kind: turn === 'last' ? 'locked' : 'wrong' };
}
async function mailOpen(deps: PasswordDeps): Promise<boolean> {
  if (!await deps.db.rpc<boolean>('auth_email_enabled', {})) return false;
  return !await deps.provider.autoconfirms();
}

async function login(body: Record<string, unknown>, deps: PasswordDeps): Promise<Response> {
  const started = Date.now();
  const finish = async (make: () => Response) => {
    const wait = MIN_ANSWER_MS - (Date.now() - started);
    if (wait > 0) await (deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))))(wait);
    return make();
  };
  const result = await checkPassword(email(body.email), str(body.password, 1024), deps);
  if (result.kind === 'ok') return finish(() => json(result.tokens));
  return finish(() => { throw new AppError(result.kind === 'locked' ? 'LOGIN_LOCKED' : 'INVALID_LOGIN'); });
}
async function signup(body: Record<string, unknown>, deps: PasswordDeps): Promise<Response> {
  if (!await mailOpen(deps)) throw new AppError('MAIL_NOT_CONNECTED');
  if (body.termsAccepted !== true) throw new AppError('INVALID_REQUEST');
  const address = email(body.email), password = str(body.password, 1024);
  if (!passwordIsAllowed(password, address)) throw new AppError('WEAK_PASSWORD');
  const redirectTo = body.redirectTo === undefined ? null : str(body.redirectTo, 200);
  if (!await deps.provider.signUp(address, password, redirectTo)) throw new AppError('RATE_LIMITED');
  return json({ state: 'sent' }, 202);
}
async function requireEmail(userId: string, deps: PasswordDeps): Promise<string> {
  const address = await deps.emailOf(userId);
  if (!address) throw new AppError('EMAIL_REQUIRED');
  return address;
}
async function state({ userId }: Context, deps: PasswordDeps): Promise<Response> {
  const [saved, address] = await Promise.all([deps.db.rpc<{ hasPassword: boolean; promptSeen: boolean }>('account_password_state', { actor: userId }), deps.emailOf(userId)]);
  return json({ ...saved, email: address });
}
/** A new session whose `amr` proves the password; the session it replaces is ended. */
async function verify({ userId, body, request }: Context, deps: PasswordDeps): Promise<Response> {
  const result = await checkPassword(await requireEmail(userId, deps), str(body.password, 1024), deps);
  if (result.kind !== 'ok') throw new AppError(result.kind === 'locked' ? 'LOGIN_LOCKED' : 'WRONG_PASSWORD');
  const jwt = bearerToken(request.headers.get('Authorization'));
  if (jwt) await deps.provider.signOut(jwt);
  return json(result.tokens);
}
async function setPassword({ userId, body, request }: Context, deps: PasswordDeps): Promise<Response> {
  const address = await requireEmail(userId, deps);
  const newPassword = str(body.newPassword, 1024);
  if (!passwordIsAllowed(newPassword, address)) throw new AppError('WEAK_PASSWORD');
  const jwt = bearerToken(request.headers.get('Authorization'));
  const { hasPassword } = await deps.db.rpc<{ hasPassword: boolean }>('account_password_state', { actor: userId });
  if (hasPassword) {
    if (typeof body.currentPassword === 'string') {
      const result = await checkPassword(address, str(body.currentPassword, 1024), deps);
      if (result.kind !== 'ok') throw new AppError(result.kind === 'locked' ? 'LOGIN_LOCKED' : 'WRONG_PASSWORD');
      await deps.provider.signOut(result.tokens.accessToken);
    } else if (!provedWithoutPassword(jwtClaims(jwt), (deps.now?.() ?? new Date()).getTime())) throw new AppError('REAUTH_REQUIRED');
  }
  if (!jwt || !await deps.provider.update(jwt, newPassword)) throw new Error('PASSWORD_UPDATE_FAILED');
  await deps.db.rpc('password_attempt_clear', { key: await attemptKey(address, deps.attemptSecret) });
  return json({ state: 'saved' });
}

export function passwordHandler(deps: PasswordDeps) {
  const user = createHandler([
    route('GET', '/auth-password/state', (ctx) => state(ctx, deps)),
    route('POST', '/auth-password/verify', (ctx) => verify(ctx, deps), { idempotent: false }),
    route('POST', '/auth-password/set', (ctx) => setPassword(ctx, deps), { idempotent: false }),
    route('POST', '/auth-password/prompt-seen', async ({ userId }) => { await deps.db.rpc('mark_password_prompt_seen', { actor: userId }); return json({ state: 'seen' }); }, { idempotent: false }),
  ], deps);
  const open: Record<string, (body: Record<string, unknown>) => Promise<Response>> = {
    'POST /auth-password/login': (body) => login(body, deps),
    'POST /auth-password/signup': (body) => signup(body, deps),
    'GET /auth-password/config': async () => json({ mail: await mailOpen(deps) }),
  };
  return async (request: Request): Promise<Response> => {
    const path = new URL(request.url).pathname.match(/\/auth-password\/[a-z-]+$/)?.[0];
    const endpoint = `${request.method} ${path}`;
    const handle = open[endpoint];
    if (!handle) return user(request);
    const started = Date.now();
    const body = request.method === 'POST' ? await request.json().catch(() => null) as Record<string, unknown> | null : {};
    const response = !body || typeof body !== 'object' ? errorResponse('INVALID_REQUEST', 400, false) : await handle(body).catch(toResponse);
    console.log(JSON.stringify(safeLogFields({ event: 'request', endpoint, status: response.status, durationMs: Date.now() - started })));
    return response;
  };
}

if (import.meta.main) {
  const base = defaultDeps();
  const client = serviceClient();
  const env = Deno.env.get;
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')!;
  Deno.serve(passwordHandler({
    ...base, provider: authProvider(env('SUPABASE_URL')!, env('SUPABASE_ANON_KEY') ?? serviceKey), attemptSecret: env('ACCOUNT_CREDENTIAL_KEY') ?? serviceKey,
    async emailOf(userId) { return (await client.auth.admin.getUserById(userId)).data.user?.email || null; },
  }));
}
