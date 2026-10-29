import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { createSupabase } from './supabase';
import { supabaseAuth } from './auth';
import type { ReauthPort } from '../features/account/deleteAccount';
type Supabase = ReturnType<typeof createSupabase>;

/**
 * Signs in again with the account's own provider right before account deletion, refreshing the session the server checks
 * for a recent sign-in. Apple also hands back the one-time authorization code the server exchanges to revoke the tokens.
 */
export function supabaseReauth(client: Supabase): ReauthPort {
  const oauth = supabaseAuth(client).oauth;
  async function email(): Promise<string | null> {
    return (await client.auth.getSession()).data.session?.user.email ?? null;
  }
  return {
    async apple() {
      const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      try {
        const credential = await AppleAuthentication.signInAsync({ requestedScopes: [], nonce: hashedNonce });
        if (!credential.identityToken || !credential.authorizationCode) return { kind: 'error' };
        const { error } = await client.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: rawNonce });
        return error ? { kind: 'error' } : { kind: 'ok', reauth: { provider: 'apple', authorizationCode: credential.authorizationCode } };
      } catch (error) {
        return (error as { code?: string }).code === 'ERR_REQUEST_CANCELED' ? { kind: 'cancelled' } : { kind: 'error' };
      }
    },
    async kakao() {
      const result = await oauth('kakao').catch(() => 'error' as const);
      return result === 'ok' ? { kind: 'ok', reauth: { provider: 'kakao' } } : { kind: result };
    },
    async sendEmailCode() {
      const address = await email();
      if (!address) return false;
      const { error } = await client.auth.signInWithOtp({ email: address, options: { shouldCreateUser: false } });
      return !error;
    },
    async verifyEmailCode(code) {
      const address = await email();
      if (!address) return { kind: 'error' };
      const { error } = await client.auth.verifyOtp({ email: address, token: code, type: 'email' });
      return error ? { kind: 'error' } : { kind: 'ok', reauth: { provider: 'email' } };
    },
  };
}
