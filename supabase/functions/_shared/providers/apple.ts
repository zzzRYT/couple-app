// Sign in with Apple token exchange and revoke (REST). Runs in Deno and in Node tests: no Deno globals, fetch is injected.
// Request shapes follow Apple's "Generate and validate tokens" and "Revoke tokens" documentation; not yet verified against Apple (G18).

/** Server secrets, stored as Supabase function secrets: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (the .p8 PEM) and APPLE_CLIENT_ID (the app's bundle ID). */
export type AppleConfig = { teamId: string; keyId: string; privateKeyPem: string; clientId: string };
export type AppleTokens = { token: string; hint: 'refresh_token' | 'access_token' };
export interface AppleClient {
  /** Exchanges the one-time authorization code from re-authentication for tokens; throws AppleExchangeError when Apple refuses it. */
  exchange(authorizationCode: string): Promise<AppleTokens>;
  /** Revokes the user's tokens so the app disappears from their Apple ID; an already revoked token is success. */
  revoke(tokens: AppleTokens): Promise<void>;
}
export class AppleExchangeError extends Error {
  constructor() { super('APPLE_EXCHANGE_FAILED'); }
}
/** Thrown before anything is deleted when a server secret is missing, so the account and space stay as they were. */
export class ProviderNotConfiguredError extends Error {
  readonly code = 'PROVIDER_NOT_CONFIGURED';
  readonly missing: 'APPLE_SECRET_MISSING' | 'KAKAO_NOT_ENABLED';
  // No parameter properties: this file also runs under Node's type stripping in tools/tests.
  constructor(missing: 'APPLE_SECRET_MISSING' | 'KAKAO_NOT_ENABLED') { super(missing); this.missing = missing; }
}

const APPLE = 'https://appleid.apple.com';
type Fetch = (input: string, init: RequestInit) => Promise<Response>;

export function appleConfigFromEnv(env: (name: string) => string | undefined): AppleConfig | null {
  const teamId = env('APPLE_TEAM_ID'), keyId = env('APPLE_KEY_ID'), privateKeyPem = env('APPLE_PRIVATE_KEY'), clientId = env('APPLE_CLIENT_ID');
  return teamId && keyId && privateKeyPem && clientId ? { teamId, keyId, privateKeyPem, clientId } : null;
}

/** With no config every call throws ProviderNotConfiguredError('APPLE_SECRET_MISSING'); the secret is not required until release. */
export function appleClient(config: AppleConfig | null, fetchFn: Fetch = fetch, now: () => Date = () => new Date()): AppleClient {
  async function post(path: string, form: Record<string, string>): Promise<Response> {
    if (!config) throw new ProviderNotConfiguredError('APPLE_SECRET_MISSING');
    const secret = await clientSecret(config, now());
    const body = new URLSearchParams({ client_id: config.clientId, client_secret: secret, ...form });
    return fetchFn(`${APPLE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  }
  return {
    async exchange(authorizationCode) {
      const response = await post('/auth/token', { code: authorizationCode, grant_type: 'authorization_code' });
      if (!response.ok) throw new AppleExchangeError();
      const data = await response.json().catch(() => ({})) as { refresh_token?: unknown; access_token?: unknown };
      if (typeof data.refresh_token === 'string' && data.refresh_token) return { token: data.refresh_token, hint: 'refresh_token' };
      if (typeof data.access_token === 'string' && data.access_token) return { token: data.access_token, hint: 'access_token' };
      throw new AppleExchangeError();
    },
    async revoke(tokens) {
      const response = await post('/auth/revoke', { token: tokens.token, token_type_hint: tokens.hint });
      // Apple answers 200 for a token it no longer knows, so only transport or server failures are retried.
      if (!response.ok) throw new Error('APPLE_REVOKE_FAILED');
    },
  };
}

/** The ES256 client secret Apple expects: a JWT signed with the team's private key, valid for five minutes. */
export async function clientSecret(config: AppleConfig, at: Date): Promise<string> {
  const iat = Math.floor(at.getTime() / 1000);
  const header = { alg: 'ES256', kid: config.keyId };
  const payload = { iss: config.teamId, iat, exp: iat + 300, aud: APPLE, sub: config.clientId };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(config.privateKeyPem), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  // WebCrypto returns the raw r||s signature, which is exactly the JWS ES256 form.
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput)));
  return `${signingInput}.${base64url(signature)}`;
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\\n|\s/g, '');
  const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
export function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
