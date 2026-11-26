import * as Application from 'expo-application';
import Constants from 'expo-constants';

/**
 * "1.0.1 (2)" on an OTA bundle: the app version and which production OTA of it this is. The OTA workflow inlines the
 * string at preview deploy and tags the production promotion v1.0.1-ota.2 (docs/ota.md#release-numbers).
 * A build's own bundle shows the version alone.
 */
export function appVersionLabel(otaRelease = process.env.EXPO_PUBLIC_OTA_RELEASE): string {
  return otaRelease || `${Application.nativeApplicationVersion ?? Constants.expoConfig?.version}`;
}
