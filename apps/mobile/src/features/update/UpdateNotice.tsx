import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { Button, Dialog } from '../../ui/components';
import { APP_IDENTITY } from '../../config/identity';
import { APP_STORE } from '../../config/appStore';
import { storeVersion } from './storeVersion';
import { useUpdateNotice } from './useUpdateNotice';

const defaults = {
  // Only the App Store build has a store version to compare with; development and preview builds never ask. The native
  // bundle id decides, not the inlined variant: production runs OTA bundles promoted from the preview channel.
  enabled: Platform.OS === 'ios' && Application.applicationId === APP_IDENTITY.iosBundleId,
  installed: Application.nativeApplicationVersion,
  lookup: () => storeVersion(APP_STORE.id, getLocales()[0]?.regionCode),
};
/** V0-update: the shared dialog over whatever screen is open (V0-11). */
export function UpdateNotice({ enabled = defaults.enabled, installed = defaults.installed, lookup = defaults.lookup }: { enabled?: boolean; installed?: string | null; lookup?: () => Promise<string | null> }) {
  const { t } = useTranslation();
  const { latest, later, update } = useUpdateNotice({ enabled, installed, lookup, storeUrl: APP_STORE.url });
  return <Dialog visible={!!latest} icon="sparkle" title={t('update.title')} body={latest ? t('update.body', { version: latest }) : undefined} onClose={later}>
    <Button label={t('update.action')} onPress={update} />
    <Button label={t('common.later')} variant="ghost" onPress={later} />
  </Dialog>;
}
