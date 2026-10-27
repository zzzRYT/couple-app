import { Platform } from 'react-native';

// Owner decision (2026-10-27): product sign-in is OAuth only, Sign in with Apple first. Email OTP is not a product
// login; it stays as a development-only test login (assumption the owner may reject) so two devices and the local
// stack can be tested without two Apple IDs.
export type AuthOptions = { apple: 'native' | 'web' | null; kakao: boolean; devEmail: boolean };
export const KAKAO_ENABLED = false;
/** Browser OAuth for Apple on Android needs a Services ID and signing secret in Supabase; off until the owner sets them up. */
export const APPLE_WEB_OAUTH_ENABLED = false;
export function resolveAuthOptions(input: { platform: string; variant: string | undefined; devEmailFlag: string | undefined }): AuthOptions {
  return {
    apple: input.platform === 'ios' ? 'native' : APPLE_WEB_OAUTH_ENABLED ? 'web' : null,
    kakao: KAKAO_ENABLED,
    devEmail: input.variant === 'development' && input.devEmailFlag === 'true',
  };
}
// Direct `process.env.EXPO_PUBLIC_*` reads are inlined at build time, so production bundles carry `devEmail: false`.
export const authOptions = resolveAuthOptions({
  platform: Platform.OS,
  variant: process.env.EXPO_PUBLIC_APP_VARIANT,
  devEmailFlag: process.env.EXPO_PUBLIC_DEV_EMAIL_LOGIN,
});
