import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, uuidParam, type Context, type Deps } from '../_shared/http.ts';
import { safeLogFields } from '../_shared/logging.ts';
import { AppleExchangeError, ProviderNotConfiguredError } from '../_shared/providers/apple.ts';
import { bearerToken, jwtClaims, PROVIDERS, reauthIsFresh, type Provider } from './reauth.ts';
import { runAccountDeletion, type DeletionPorts } from './runner.ts';
import { defaultDeletionPorts } from './ports.ts';

/** Apple tokens are kept sealed only long enough to retry a revoke (spec: at most 24 hours). */
const CREDENTIAL_TTL_SECONDS = 24 * 60 * 60;
export type AccountDeps = Deps & {
  ports: DeletionPorts;
  /** Admin sign-out of every session of the token's user (`auth.admin.signOut(jwt, 'global')`). */
  signOutEverywhere(jwt: string): Promise<void>;
  /** The sign-in provider of an auth user, for out-of-app requests handled by an operator. */
  providerOf(userId: string): Promise<Provider | null>;
  serviceKey: string;
};

function provider(value: unknown): Provider {
  if (typeof value !== 'string' || !(PROVIDERS as readonly string[]).includes(value)) throw new AppError('INVALID_REQUEST');
  return value as Provider;
}
/** Everything that can fail without changing anything happens first; only then the accepting transaction runs. */
async function requestDeletion({ userId, body, request, deps }: Context, account: AccountDeps): Promise<Response> {
  if (body.confirm !== true || !body.reauth || typeof body.reauth !== 'object') throw new AppError('INVALID_REQUEST');
  const reauth = body.reauth as Record<string, unknown>;
  const chosen = provider(reauth.provider);
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
  if (chosen === 'kakao' && !account.ports.kakao) throw new AppError('PROVIDER_NOT_CONFIGURED');
  await deps.db.rpc('begin_account_deletion', { actor: userId, reauth_provider: chosen, request_origin: 'app', credential, credential_ttl_seconds: credential ? CREDENTIAL_TTL_SECONDS : null });
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
  await account.db.rpc('begin_account_deletion', { actor: userId, reauth_provider: chosen, request_origin: 'operator', credential: null, credential_ttl_seconds: null });
  await runAccountDeletion(userId, account.ports).catch(() => undefined);
  return json({ state: 'requested' }, 202);
}

export function accountHandler(account: AccountDeps) {
  const user = createHandler([
    route('DELETE', '/account', (ctx) => requestDeletion(ctx, account)),
    // Same contract for clients or proxies that drop DELETE bodies; the app uses this one.
    route('POST', '/account/deletion', (ctx) => requestDeletion(ctx, account)),
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
