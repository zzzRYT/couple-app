import * as Linking from 'expo-linking';
import * as Application from 'expo-application';
import { isStoreApp } from '../config/identity';
import { ApiError } from './errors';
import type { Client } from './client';
import type { createSupabase } from './supabase';
import { rememberMail } from './lastMail';
type Supabase = ReturnType<typeof createSupabase>;

export type PasswordState = { hasPassword: boolean; promptSeen: boolean; email: string | null };
export type SignInResult = 'ok' | 'wrong' | 'locked' | 'error';
export type SetResult = 'ok' | 'wrong' | 'locked' | 'weak' | 'reauth' | 'error';
/** Password operations the screens need. A password goes to the server over TLS and is never kept on the device; a screen holds it only while the field shows it. */
export type PasswordPort = {
  /** False until mail is connected, and when the answer cannot be read: nothing may claim a mail was sent. */
  mailConnected(): Promise<boolean>;
  signIn(email: string, password: string): Promise<SignInResult>;
  signUp(email: string, password: string): Promise<'ok' | 'weak' | 'closed' | 'error'>;
  requestReset(email: string): Promise<boolean>;
  resendConfirmation(email: string): Promise<boolean>;
  state(): Promise<PasswordState>;
  /** Without `currentPassword` the server wants a fresh Apple or mail-link sign-in when a password already exists. */
  set(newPassword: string, currentPassword?: string): Promise<SetResult>;
  /** Proves the password and swaps this session for one the server accepts as a recent password sign-in. */
  verify(password: string): Promise<SignInResult>;
  promptSeen(): Promise<void>;
};
function failure(error: unknown): string {
  return error instanceof ApiError ? error.code : 'NETWORK';
}
export function passwordPort(supabase: Supabase, client: Client): PasswordPort {
  const redirectTo = () => Linking.createURL('auth-callback');
  async function useTokens(tokens: { accessToken: string; refreshToken: string }): Promise<boolean> {
    const { error } = await supabase.auth.setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
    return !error;
  }
  async function signedIn(run: () => Promise<{ accessToken: string; refreshToken: string }>, wrong: string): Promise<SignInResult> {
    try {
      return (await useTokens(await run())) ? 'ok' : 'error';
    } catch (error) {
      const code = failure(error);
      return code === wrong ? 'wrong' : code === 'LOGIN_LOCKED' ? 'locked' : 'error';
    }
  }
  return {
    mailConnected: () => client.passwordConfig().then(({ mail }) => mail, () => false),
    signIn: (email, password) => signedIn(() => client.passwordLogin(email, password), 'INVALID_LOGIN'),
    async signUp(email, password) {
      try {
        await client.passwordSignup(email, password, redirectTo());
        await rememberMail({ kind: 'signup', email });
        return 'ok';
      } catch (error) {
        const code = failure(error);
        return code === 'WEAK_PASSWORD' ? 'weak' : code === 'MAIL_NOT_CONNECTED' ? 'closed' : 'error';
      }
    },
    async requestReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
      if (!error) await rememberMail({ kind: 'reset' });
      return !error;
    },
    async resendConfirmation(email) {
      const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo() } });
      if (!error) await rememberMail({ kind: 'signup', email });
      return !error;
    },
    state: () => client.passwordState(),
    async set(newPassword, currentPassword) {
      try {
        await client.setPassword(newPassword, currentPassword);
        return 'ok';
      } catch (error) {
        const code = failure(error);
        return ({ WRONG_PASSWORD: 'wrong', LOGIN_LOCKED: 'locked', WEAK_PASSWORD: 'weak', REAUTH_REQUIRED: 'reauth' } as const)[code as 'WRONG_PASSWORD'] ?? 'error';
      }
    },
    verify: (password) => signedIn(() => client.passwordVerify(password), 'WRONG_PASSWORD'),
    async promptSeen() { await client.passwordPromptSeen(); },
  };
}
type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';
export type AuthLink = { kind: 'otp'; tokenHash: string; type: EmailOtpType; recovery: boolean } | { kind: 'session'; accessToken: string; refreshToken: string; recovery: boolean } | { kind: 'expired' } | { kind: 'none' };
/** Reads direct email links and legacy Auth redirects. */
export function parseAuthLink(url: string | null, applicationId = Application.applicationId): AuthLink {
  const query = url?.split('#')[0]?.split('?')[1];
  if (query) {
    const params = new URLSearchParams(query);
    const tokenHash = params.get('token_hash');
    if (tokenHash) {
      const type = params.get('type');
      const env = params.get('env');
      if (env !== (isStoreApp(applicationId) ? 'prod' : 'dev') || !type || !['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'].includes(type)) return { kind: 'expired' };
      return { kind: 'otp', tokenHash, type: type as EmailOtpType, recovery: type === 'recovery' };
    }
  }
  const fragment = url?.split('#')[1];
  if (!fragment) return { kind: 'none' };
  const params = new URLSearchParams(fragment);
  if (params.get('error') || params.get('error_code')) return { kind: 'expired' };
  const accessToken = params.get('access_token'), refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return { kind: 'none' };
  return { kind: 'session', accessToken, refreshToken, recovery: params.get('type') === 'recovery' };
}
