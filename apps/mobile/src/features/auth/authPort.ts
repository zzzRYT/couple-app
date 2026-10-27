export type Provider = 'kakao' | 'apple' | 'email';
export type OAuthResult = 'ok' | 'cancelled' | 'error';
export type VerifyResult = 'ok' | 'wrong' | 'expired' | { rateLimitedMinutes: number } | 'error';
/** Auth operations the screens need; the Supabase-backed version lives in lib/auth.ts so screens stay testable. */
export type AuthPort = {
  oauth(provider: 'kakao' | 'apple'): Promise<OAuthResult>;
  sendCode(email: string): Promise<'ok' | { rateLimitedMinutes: number } | 'error'>;
  verifyCode(email: string, code: string): Promise<VerifyResult>;
};
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
