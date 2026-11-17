import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { hotUpdater } from '../features/update/ota';

export function appVersionLabel(bundleId = hotUpdater.getBundleId(), channel = hotUpdater.getChannel(), minBundleId = hotUpdater.getMinBundleId()): string {
  const ota = bundleId === minBundleId ? 'Embedded' : `OTA ${bundleId.slice(0, 8)} · ${channel}`;
  return `${Application.nativeApplicationVersion ?? Constants.expoConfig?.version} (${Application.nativeBuildVersion ?? '-'}) · ${ota}`;
}
