import { useTranslation } from 'react-i18next';
import { AppText, Button, Screen } from '../../ui/components';
import { Spot } from '../../ui/Spot';
export function V0Error({ retry, offline = false }: { retry: () => void; offline?: boolean }) {
  const { t } = useTranslation();
  return <Screen center footer={<Button label={t('common.retry')} onPress={retry} />}><Spot kind="waiting" /><AppText variant="title" align="center">{t(offline ? 'state.offline.empty.title' : 'state.error.title')}</AppText><AppText tone="text2" align="center">{t(offline ? 'state.offline.empty.body' : 'state.error.body')}</AppText></Screen>;
}
