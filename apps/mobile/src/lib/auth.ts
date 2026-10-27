import * as Linking from 'expo-linking';
import type { createSupabase } from './supabase';
import type { AuthPort } from '../features/auth/authPort';
type Supabase = ReturnType<typeof createSupabase>;
function rateMinutes(error: { status?: number } | null): { rateLimitedMinutes: number } | null {
  return error?.status === 429 ? { rateLimitedMinutes: 5 } : null;
}
/** Supabase Auth adapter. Kakao/Apple run through the browser redirect until the official SDKs land (G5). */
export function supabaseAuth(client: Supabase): AuthPort {
  return {
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
  };
}
