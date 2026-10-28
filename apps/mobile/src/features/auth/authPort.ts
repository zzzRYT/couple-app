export type Provider = 'kakao' | 'apple' | 'email';
export type OAuthResult = 'ok' | 'cancelled' | 'error';
export type VerifyResult = 'ok' | 'wrong' | 'expired' | { rateLimitedMinutes: number } | 'error';
/** Auth operations the screens need; the Supabase-backed version lives in lib/auth.ts so screens stay testable. */
export type AuthPort = {
  /** Native Sign in with Apple (iOS) exchanged for a Supabase session with signInWithIdToken. */
  apple(): Promise<OAuthResult>;
  /** Browser OAuth (Kakao, or Apple where the native sheet is unavailable). */
  oauth(provider: 'kakao' | 'apple'): Promise<OAuthResult>;
  /** Development-only email test login. */
  sendCode(email: string): Promise<'ok' | { rateLimitedMinutes: number } | 'error'>;
  verifyCode(email: string, code: string): Promise<VerifyResult>;
  /** Clears the local Supabase session on this device only. */
  signOut(): Promise<void>;
};
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
