// Recent re-authentication for account deletion, read from a JWT that Auth has already verified for this request.
// Supabase puts the sign-in methods and their times in `amr`; refreshing a token keeps them, so only a new sign-in counts.

export type Provider = 'kakao' | 'apple' | 'email';
export const PROVIDERS: readonly Provider[] = ['kakao', 'apple', 'email'];
/** "Recent" is five minutes (spec FR-070, an assumption). */
export const REAUTH_WINDOW_SECONDS = 300;
type Claims = { iat?: unknown; amr?: unknown; app_metadata?: { provider?: unknown } };

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
/** The latest sign-in time in seconds: the newest `amr` timestamp, or `iat` when the token has no `amr`. */
export function lastSignInAt(claims: Claims): number | null {
  const times = Array.isArray(claims.amr)
    ? claims.amr.map((entry) => (entry as { timestamp?: unknown })?.timestamp).filter((t): t is number => typeof t === 'number' && Number.isFinite(t))
    : [];
  if (times.length > 0) return Math.max(...times);
  return typeof claims.iat === 'number' ? claims.iat : null;
}
/** True when the caller signed in with `provider` within the window. The account's own provider comes from `app_metadata`. */
export function reauthIsFresh(claims: Claims | null, provider: Provider, nowMs: number, windowSeconds = REAUTH_WINDOW_SECONDS): boolean {
  if (!claims || claims.app_metadata?.provider !== provider) return false;
  const signedIn = lastSignInAt(claims);
  if (signedIn === null) return false;
  const age = nowMs / 1000 - signedIn;
  return age >= -60 && age <= windowSeconds;
}
