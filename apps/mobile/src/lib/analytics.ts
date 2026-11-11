import * as Application from 'expo-application';
import { PostHog, type PostHogOptions } from 'posthog-react-native';
import { analyticsEnvironment, POSTHOG_HOST, type AnalyticsEnvironment } from '../config/analytics';

/** Property values are string-literal unions only, so a code, email, name or date cannot be typed in. */
export type AnalyticsEvents = {
  signup_completed: { path: 'created_space' | 'joined_space' };
  invite_shared: { surface: 'invite_screen' | 'home_card'; method: 'share' | 'copy' };
  invite_opened: Record<string, never>;
  couple_connected: Record<string, never>;
  anniversary_added: Record<string, never>;
};

export function postHogOptions(environment: AnalyticsEnvironment): PostHogOptions {
  return {
    host: POSTHOG_HOST, captureAppLifecycleEvents: true, enableSessionReplay: false, personProfiles: 'never', setDefaultPersonProperties: false, disableGeoip: true,
    preloadFeatureFlags: false, disableRemoteFeatureFlags: true, disableSurveys: true, capturePushNotificationSubscriptions: false, capturePushNotificationOpened: false, errorTracking: { autocapture: false },
    before_send: (event) => {
      // The SDK's `Application Opened` attaches the launch URL, which can be an invite link (/i/CODE, a bearer secret) or the auth callback carrying access tokens.
      const properties = { ...event.properties };
      delete properties.url; delete properties.$current_url;
      return { ...event, properties: { ...properties, environment } };
    },
  };
}

let client: PostHog | null = null;
export function startAnalytics() {
  const token = process.env.EXPO_PUBLIC_POSTHOG_TOKEN;
  if (!client && token) client = new PostHog(token, postHogOptions(analyticsEnvironment(Application.applicationId)));
}

export function track<E extends keyof AnalyticsEvents>(event: E, ...properties: AnalyticsEvents[E] extends Record<string, never> ? [] : [AnalyticsEvents[E]]) {
  startAnalytics();
  client?.capture(event, properties[0]);
}
