import { isStoreApp } from './identity.ts';

/**
 * PostHog project "Aroom" (US cloud). Its project token only sends events; like the Supabase publishable key it ships in the app but comes from
 * `EXPO_PUBLIC_POSTHOG_TOKEN` (docs/secrets.md), and a build without it sends nothing. The plan allows one project, so every build shares it and events carry `environment`.
 */
export const POSTHOG_HOST = 'https://us.i.posthog.com';
export type AnalyticsEnvironment = 'production' | 'development';
/** The native bundle id decides, like supabaseTarget, because Hot Updater promotes the preview bundle to production unchanged. */
export function analyticsEnvironment(applicationId: string | null | undefined): AnalyticsEnvironment {
  return isStoreApp(applicationId) ? 'production' : 'development';
}
