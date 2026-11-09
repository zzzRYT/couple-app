import { useTranslation } from 'react-i18next';
import { Banner } from '../../ui/components';
/** The V0-03 offline band as home draws it: the anniversary list and detail show it over their last saved data. */
export function OfflineBand({ syncedAt }: { syncedAt: string | null }) {
  const { t, i18n } = useTranslation();
  const time = syncedAt ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(new Date(syncedAt)) : '';
  return <Banner band kind="warn" icon="offline" text={t('state.offline.banner', { time })} body={t('state.offline.readonly')} />;
}
