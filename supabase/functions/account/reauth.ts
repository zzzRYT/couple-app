// Recent re-authentication for account deletion, read from a JWT that Auth has already verified for this request.
// Supabase puts the sign-in methods and their times in `amr`; refreshing a token keeps them, so only a new sign-in counts.

export type Provider = 'kakao' | 'apple' | 'email';
export const PROVIDERS: readonly Provider[] = ['kakao', 'apple', 'email'];
/** How someone proved it is them: the account's own provider, or the password. An Apple account with a password stays `apple`. */
export type ReauthMethod = Provider | 'password';
export const REAUTH_METHODS: readonly ReauthMethod[] = [...PROVIDERS, 'password'];
/** "Recent" is five minutes (spec FR-070, an assumption). */
export const REAUTH_WINDOW_SECONDS = 300;
export type Claims = { iat?: unknown; amr?: unknown; app_metadata?: { provider?: unknown; providers?: unknown } };

export function bearerToken(authorization: string | null): string | null {
  return authorization?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}
/** Decodes the payload only; call it after Auth verified the signature (createHandler does that first). */
export function jwtClaims(token: string | null): Claims | null {
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const value = JSON.parse(new TextDecoder().decode(Uint8Array.from(json, (c) => c.charCodeAt(0))));
    return value && typeof value === 'object' ? value as Claims : null;
  } catch {
    return null;
  }
}
/**
 * The latest accepted sign-in time in seconds, from `amr`. `iat` stands in only when no `amr` entry has a time; `accept`
 * then decides on `undefined`, so a password check never passes on a token that does not name its method.
 */
export function lastSignInAt(claims: Claims, accept: (method: unknown) => boolean = () => true): number | null {
  const entries = (Array.isArray(claims.amr) ? claims.amr : []) as { method?: unknown; timestamp?: unknown }[];
  const timed = entries.filter((entry) => typeof entry?.timestamp === 'number' && Number.isFinite(entry.timestamp));
  if (timed.length > 0) {
    const times = timed.filter((entry) => accept(entry.method)).map((entry) => entry.timestamp as number);
    return times.length > 0 ? Math.max(...times) : null;
  }
  return accept(undefined) && typeof claims.iat === 'number' ? claims.iat : null;
}
const isPassword = (method: unknown) => method === 'password';
const notPassword = (method: unknown) => method !== 'password';
function fresh(signedIn: number | null, nowMs: number, windowSeconds: number): boolean {
  if (signedIn === null) return false;
  const age = nowMs / 1000 - signedIn;
  return age >= -60 && age <= windowSeconds;
}
/**
 * True when the caller proved `method` within the window. A password proof needs a `password` entry and works on any account;
 * Apple and Kakao need that provider on the account and a sign-in other than a password. `email` keeps the development OTP path.
 */
export function reauthIsFresh(claims: Claims | null, method: ReauthMethod, nowMs: number, windowSeconds = REAUTH_WINDOW_SECONDS): boolean {
  if (!claims) return false;
  if (method === 'password') return fresh(lastSignInAt(claims, isPassword), nowMs, windowSeconds);
  const providers = Array.isArray(claims.app_metadata?.providers) ? claims.app_metadata.providers : [];
  if (claims.app_metadata?.provider !== method && !providers.includes(method)) return false;
  return fresh(lastSignInAt(claims, method === 'email' ? undefined : notPassword), nowMs, windowSeconds);
}
/** A recent sign-in that was not the password: Apple again, or a mail link. It may replace a forgotten password. */
export function provedWithoutPassword(claims: Claims | null, nowMs: number, windowSeconds = REAUTH_WINDOW_SECONDS): boolean {
  return !!claims && fresh(lastSignInAt(claims, notPassword), nowMs, windowSeconds);
}
