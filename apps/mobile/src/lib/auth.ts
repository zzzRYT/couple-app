import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import type { createSupabase } from './supabase';
import type { AuthPort } from '../features/auth/authPort';
type Supabase = ReturnType<typeof createSupabase>;
function rateMinutes(error: { status?: number } | null): { rateLimitedMinutes: number } | null {
  return error?.status === 429 ? { rateLimitedMinutes: 5 } : null;
}
/** Supabase Auth adapter: native Apple id tokens on iOS, browser redirect for Kakao (disabled) until its SDK lands (G5). */
export function supabaseAuth(client: Supabase): AuthPort {
  return {
    async apple() {
      // Apple receives the SHA-256 of the nonce and Supabase the raw value, so a replayed token fails the check.
      const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      try {
        // No FULL_NAME scope: the data model keeps no display names, so Apple's first-sign-in name is never requested or stored.
        const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL], nonce: hashedNonce });
        if (!credential.identityToken) return 'error';
        const { error } = await client.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: rawNonce });
        return error ? 'error' : 'ok';
      } catch (error) {
        return (error as { code?: string }).code === 'ERR_REQUEST_CANCELED' ? 'cancelled' : 'error';
      }
    },
    async oauth(provider) {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
      if (error || !data.url) return 'error';
      const returned = new Promise<string>((resolve) => {
        const subscription = Linking.addEventListener('url', ({ url }) => { if (url.startsWith(redirectTo)) { subscription.remove(); resolve(url); } });
      });
      await Linking.openURL(data.url);
      const url = new URL(await returned);
      if (url.searchParams.get('error')) return url.searchParams.get('error') === 'access_denied' ? 'cancelled' : 'error';
      const code = url.searchParams.get('code');
      if (!code) return 'cancelled';
      const exchanged = await client.auth.exchangeCodeForSession(code);
      return exchanged.error ? 'error' : 'ok';
    },
    async sendCode(email) {
      const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      return error ? rateMinutes(error) ?? 'error' : 'ok';
    },
    async verifyCode(email, token) {
      const { error } = await client.auth.verifyOtp({ email, token, type: 'email' });
      if (!error) return 'ok';
      const limited = rateMinutes(error);
      if (limited) return limited;
      return /expired/i.test(error.message) ? 'expired' : 'wrong';
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },
  };
}
