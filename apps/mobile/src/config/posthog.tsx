import type { PropsWithChildren } from 'react';
import PostHog, { PostHogProvider } from 'posthog-react-native';

const projectToken = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

if (!projectToken && __DEV__) {
  console.error(new Error('EXPO_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_KEY is configured'));
}

if (!host && __DEV__) {
  console.error(new Error('EXPO_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_HOST is configured'));
}

/** Shared PostHog client for the Expo app. */
export const posthog = projectToken && host ? new PostHog(projectToken, {
  host,
  errorTracking: {
    autocapture: {
      uncaughtExceptions: true,
      unhandledRejections: true,
      console: [],
    },
  },
  logs: {
    serviceName: 'aroom-mobile',
  },
}) : null;

export function PostHogRoot({ children }: PropsWithChildren) {
  return posthog ? <PostHogProvider client={posthog}>{children}</PostHogProvider> : <>{children}</>;
}
