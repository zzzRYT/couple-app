import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, uuidParam, type Context, type Deps } from '../_shared/http.ts';
import { safeLogFields } from '../_shared/logging.ts';
import { AppleExchangeError, ProviderNotConfiguredError } from '../_shared/providers/apple.ts';
import { bearerToken, jwtClaims, REAUTH_METHODS, reauthIsFresh, type Provider, type ReauthMethod } from './reauth.ts';
import { runAccountDeletion, type DeletionPorts } from './runner.ts';
import { defaultDeletionPorts } from './ports.ts';

/** A deletion keeps its sealed Apple token only long enough to retry a revoke (spec: at most 24 hours). */
const CREDENTIAL_TTL_SECONDS = 24 * 60 * 60;
export type AccountDeps = Deps & {
  ports: DeletionPorts;
  /** Admin sign-out of every session of the token's user (`auth.admin.signOut(jwt, 'global')`). */
  signOutEverywhere(jwt: string): Promise<void>;
  /** The sign-in provider of an auth user, for out-of-app requests handled by an operator. */
  providerOf(userId: string): Promise<Provider | null>;
  serviceKey: string;
};

function reauthMethod(value: unknown): ReauthMethod {
  if (typeof value !== 'string' || !(REAUTH_METHODS as readonly string[]).includes(value)) throw new AppError('INVALID_REQUEST');
  return value as ReauthMethod;
}
/** The stored Apple token, sealed, when it can still be opened. A rotated key makes it unreadable, which counts as having none. */
async function readableAppleToken(userId: string, account: AccountDeps): Promise<string | null> {
  const sealed = await account.ports.db.rpc<string | null>('apple_credential_of', { actor: userId });
  if (!sealed) return null;
  return await account.ports.box.open(sealed).then(() => sealed, () => null);
}
/** Exchanges the code Apple gave at sign-in and keeps the token sealed. Never fails a sign-in: without a token, deletion asks for Apple again. */
async function storeAppleToken({ userId, body }: Context, account: AccountDeps): Promise<Response> {
  const code = str(body.authorizationCode, 4096);
  const stored = await account.ports.apple.exchange(code)
    .then(async (tokens) => { await account.ports.db.rpc('store_apple_credential', { actor: userId, sealed_token: await account.ports.box.seal(JSON.stringify(tokens)) }); return true; })
    .catch(() => false);
  return json({ stored });
}
/** Everything that can fail without changing anything happens first; only then the accepting transaction runs. */
async function requestDeletion({ userId, body, request, deps }: Context, account: AccountDeps): Promise<Response> {
  if (body.confirm !== true || !body.reauth || typeof body.reauth !== 'object') throw new AppError('INVALID_REQUEST');
  const reauth = body.reauth as Record<string, unknown>;
  const chosen = reauthMethod(reauth.provider);
  const code = chosen === 'apple' ? str(reauth.authorizationCode, 4096) : null;
  const jwt = bearerToken(request.headers.get('Authorization'));
  if (!reauthIsFresh(jwtClaims(jwt), chosen, (deps.now?.() ?? new Date()).getTime())) throw new AppError('REAUTH_REQUIRED');
  let credential: string | null = null;
  if (chosen === 'apple') {
    const tokens = await account.ports.apple.exchange(code!).catch((error) => {
      if (error instanceof ProviderNotConfiguredError) throw new AppError('PROVIDER_NOT_CONFIGURED');
      if (error instanceof AppleExchangeError) throw new AppError('REAUTH_REQUIRED');
      throw error;
    });
    credential = await account.ports.box.seal(JSON.stringify(tokens));
  }
  // A password proves the person, not the Apple connection: the revoke still needs Apple's token.
  const accountProvider: Provider = chosen === 'password' ? await account.providerOf(userId) ?? 'email' : chosen;
  if (chosen === 'password' && accountProvider === 'apple') {
    credential = await readableAppleToken(userId, account);
    if (!credential) throw new AppError('APPLE_CONFIRM_REQUIRED');
  }
  if (accountProvider === 'kakao' && !account.ports.kakao) throw new AppError('PROVIDER_NOT_CONFIGURED');
  await deps.db.rpc('begin_account_deletion', { actor: userId, reauth_provider: accountProvider, request_origin: 'app', credential, credential_ttl_seconds: credential ? CREDENTIAL_TTL_SECONDS : null });
  // Accepted: the rest is best effort here and resumed by the sweep; the response never reveals the inner step.
  if (jwt) await account.signOutEverywhere(jwt).catch(() => undefined);
  await runAccountDeletion(userId, account.ports).catch(() => undefined);
  return json({ state: 'requested' }, 202);
}

/** Out-of-app requests (site/delete-account, runbook): an operator calls this with the service-role key after verifying the person. */
async function operatorDeletion(request: Request, account: AccountDeps): Promise<Response> {
  if (request.headers.get('Authorization') !== `Bearer ${account.serviceKey}`) throw new AppError('UNAUTHORIZED');
  const body = await request.json().catch(() => { throw new AppError('INVALID_REQUEST'); }) as Record<string, unknown>;
  const userId = uuidParam(body?.userId);
  const chosen = await account.providerOf(userId);
  if (!chosen) throw new AppError('NOT_FOUND');
  if (chosen === 'kakao' && !account.ports.kakao) throw new AppError('PROVIDER_NOT_CONFIGURED');
  const credential = chosen === 'apple' ? await readableAppleToken(userId, account) : null;
  await account.db.rpc('begin_account_deletion', { actor: userId, reauth_provider: chosen, request_origin: 'operator', credential, credential_ttl_seconds: credential ? CREDENTIAL_TTL_SECONDS : null });
  await runAccountDeletion(userId, account.ports).catch(() => undefined);
  return json({ state: 'requested' }, 202);
}

export function accountHandler(account: AccountDeps) {
  const user = createHandler([
    route('DELETE', '/account', (ctx) => requestDeletion(ctx, account)),
    // Same contract for clients or proxies that drop DELETE bodies; the app uses this one.
    route('POST', '/account/deletion', (ctx) => requestDeletion(ctx, account)),
    route('POST', '/account/apple-token', (ctx) => storeAppleToken(ctx, account), { idempotent: false }),
  ], account);
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST' || !new URL(request.url).pathname.endsWith('/account/operator-deletion')) return user(request);
    const response = await operatorDeletion(request, account).catch((error) => {
      const code = error instanceof AppError ? error.code : 'SERVER_ERROR';
      const status = code === 'UNAUTHORIZED' ? 401 : code === 'NOT_FOUND' ? 404 : code === 'INVALID_REQUEST' ? 400 : 503;
      return Response.json({ error: { code, retryable: status === 503 } }, { status });
    });
    console.log(JSON.stringify(safeLogFields({ event: 'request', endpoint: 'POST /account/operator-deletion', status: response.status })));
    return response;
  };
}

if (import.meta.main) {
  const base = defaultDeps();
  const wiring = await defaultDeletionPorts();
  Deno.serve(accountHandler({ ...base, ...wiring }));
}
