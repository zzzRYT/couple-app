import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { createSupabase } from './supabase';
import { supabaseAuth } from './auth';
import type { ReauthPort } from '../features/account/deleteAccount';
type Supabase = ReturnType<typeof createSupabase>;

/**
 * Signs in again with the account's own provider right before account deletion, refreshing the session the server checks
 * for a recent sign-in. Apple also hands back the one-time authorization code the server exchanges to revoke the tokens.
 * A re-sign-in that lands on a different user is an error and that session is signed out locally, so deletion never
 * targets an account other than the one that opened the screen.
 */
export function supabaseReauth(client: Supabase): ReauthPort {
  const oauth = supabaseAuth(client).oauth;
  async function current() {
    return (await client.auth.getSession()).data.session?.user ?? null;
  }
  async function sameAccount(before: string | undefined): Promise<boolean> {
    if (before && (await current())?.id === before) return true;
    await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
    return false;
  }
  return {
    async apple() {
      const before = (await current())?.id;
      const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      try {
        const credential = await AppleAuthentication.signInAsync({ requestedScopes: [], nonce: hashedNonce });
        if (!credential.identityToken || !credential.authorizationCode) return { kind: 'error' };
        const { error } = await client.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: rawNonce });
        if (error) return { kind: 'error' };
        return (await sameAccount(before)) ? { kind: 'ok', reauth: { provider: 'apple', authorizationCode: credential.authorizationCode } } : { kind: 'error' };
      } catch (error) {
        return (error as { code?: string }).code === 'ERR_REQUEST_CANCELED' ? { kind: 'cancelled' } : { kind: 'error' };
      }
    },
    async kakao() {
      const before = (await current())?.id;
      const result = await oauth('kakao').catch(() => 'error' as const);
      if (result !== 'ok') return { kind: result };
      return (await sameAccount(before)) ? { kind: 'ok', reauth: { provider: 'kakao' } } : { kind: 'error' };
    },
    async sendEmailCode() {
      const address = (await current())?.email;
      if (!address) return false;
      const { error } = await client.auth.signInWithOtp({ email: address, options: { shouldCreateUser: false } });
      return !error;
    },
    async verifyEmailCode(code) {
      const user = await current();
      if (!user?.email) return { kind: 'error' };
      const { error } = await client.auth.verifyOtp({ email: user.email, token: code, type: 'email' });
      if (error) return { kind: 'error' };
      return (await sameAccount(user.id)) ? { kind: 'ok', reauth: { provider: 'email' } } : { kind: 'error' };
    },
  };
}
