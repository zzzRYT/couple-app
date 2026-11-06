// Supabase Auth REST calls. Passwords pass through these requests and nothing else; no response text or error detail leaves this file.
export type Tokens = { accessToken: string; refreshToken: string };
/** `wrong` covers a wrong password, an unknown email and an unconfirmed email alike; `unavailable` means Auth did not judge the password. */
export type GrantResult = { kind: 'ok'; tokens: Tokens } | { kind: 'wrong' } | { kind: 'unavailable' };
export interface PasswordProvider {
  grant(email: string, password: string): Promise<GrantResult>;
  /** Changes the password with the user's own token, which ends every other session and keeps this one. */
  update(jwt: string, password: string): Promise<boolean>;
  signUp(email: string, password: string, redirectTo: string | null): Promise<boolean>;
  /** True while Auth confirms email by itself, which must keep sign-up closed. */
  autoconfirms(): Promise<boolean>;
  signOut(jwt: string): Promise<void>;
}
type Fetch = typeof fetch;

export function authProvider(url: string, apiKey: string, fetchFn: Fetch = fetch): PasswordProvider {
  const base = `${url.replace(/\/$/, '')}/auth/v1`;
  const headers = (jwt?: string) => ({ apikey: apiKey, 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) });
  return {
    async grant(email, password) {
      const response = await fetchFn(`${base}/token?grant_type=password`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) }).catch(() => null);
      if (!response || response.status === 429 || response.status >= 500) return { kind: 'unavailable' };
      if (!response.ok) return { kind: 'wrong' };
      const data = await response.json().catch(() => ({})) as { access_token?: unknown; refresh_token?: unknown };
      if (typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string') return { kind: 'unavailable' };
      return { kind: 'ok', tokens: { accessToken: data.access_token, refreshToken: data.refresh_token } };
    },
    async update(jwt, password) {
      const response = await fetchFn(`${base}/user`, { method: 'PUT', headers: headers(jwt), body: JSON.stringify({ password }) }).catch(() => null);
      return !!response?.ok;
    },
    async signUp(email, password, redirectTo) {
      const target = redirectTo ? `${base}/signup?redirect_to=${encodeURIComponent(redirectTo)}` : `${base}/signup`;
      const response = await fetchFn(target, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) }).catch(() => null);
      if (!response) return false;
      if (response.ok) return true;
      // Auth names an existing account; the caller must not be able to tell it from a new one.
      return response.status === 422 && (await response.json().catch(() => null) as { error_code?: unknown } | null)?.error_code === 'user_already_exists';
    },
    async autoconfirms() {
      const response = await fetchFn(`${base}/settings`, { headers: headers() }).catch(() => null);
      if (!response?.ok) return true;
      const data = await response.json().catch(() => null) as { mailer_autoconfirm?: unknown } | null;
      return data?.mailer_autoconfirm !== false;
    },
    async signOut(jwt) {
      await fetchFn(`${base}/logout?scope=local`, { method: 'POST', headers: headers(jwt) }).catch(() => undefined);
    },
  };
}
