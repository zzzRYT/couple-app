import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Screen } from '../../ui/components';
import { InlineHint } from '../../ui/InlineNote';
import { mascotPoses } from '../../scene/catalog';
import { ChoiceCard } from './ChoiceCard';
/** V0-connect: after onboarding, either send my code or enter the partner's (V0-10). */
export function ConnectScreen({ onSend, onEnter, onBack }: { onSend: () => void; onEnter: () => void; onBack?: () => void }) {
  const { t } = useTranslation();
  return <Screen onBack={onBack}><AppText variant="title" accessibilityRole="header">{t('connect.title')}</AppText>
    <AppText tone="text2">{t('connect.body')}</AppText>
    <ChoiceCard title={t('connect.send.title')} body={t('connect.send.body')} icon="paperPlane" face="peach" onPress={onSend} />
    <ChoiceCard title={t('connect.enter.title')} body={t('connect.enter.body')} icon="annivCustom" face="lav" soft onPress={onEnter} />
    <InlineHint text={t('connect.note')} />
    <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-end' }}><Image accessibilityLabel={t('mascot.alt.lookup')} source={mascotPoses.lookup} resizeMode="contain" style={{ width: 120, height: 120 }} /></View>
  </Screen>;
}
