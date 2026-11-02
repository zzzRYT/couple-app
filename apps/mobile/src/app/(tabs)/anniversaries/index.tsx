import { useTranslation } from 'react-i18next';
import { AppText, Screen, Skeleton } from '../../../ui/components';
export default function AnniversariesRoute() {
  const { t } = useTranslation();
  return <Screen><AppText variant="title" accessibilityRole="header">{t('tab.anniv')}</AppText><Skeleton label={t('state.loading')} height={72} /></Screen>;
}
