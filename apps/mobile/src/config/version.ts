import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { getBundleId, getChannel, getMinBundleId } from '@hot-updater/react-native';

export function appVersionLabel(bundleId = getBundleId(), channel = getChannel(), minBundleId = getMinBundleId()): string {
  const ota = bundleId === minBundleId ? 'Embedded' : `OTA ${bundleId.slice(0, 8)} · ${channel}`;
  return `${Application.nativeApplicationVersion ?? Constants.expoConfig?.version} (${Application.nativeBuildVersion ?? '-'}) · ${ota}`;
}
