import { Image, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Card, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { mascotPoses } from '../../scene/catalog';
import { useAppColor } from '../../theme/useAppColor';
/** V0-connect: after onboarding, either send my code or enter the partner's (V0-10). */
export function ConnectScreen({ onSend, onEnter, onBack }: { onSend: () => void; onEnter: () => void; onBack?: () => void }) {
  const { t } = useTranslation(); const color = useAppColor();
  return <Screen onBack={onBack}><AppText variant="title" accessibilityRole="header">{t('connect.title')}</AppText>
    <AppText tone="text2">{t('connect.body')}</AppText>
    {([{ title: 'connect.send.title', body: 'connect.send.body', icon: 'send', action: onSend }, { title: 'connect.enter.title', body: 'connect.enter.body', icon: 'mail', action: onEnter }] as const).map((choice) => <Pressable key={choice.title} accessibilityRole="button" accessibilityLabel={t(choice.title)} onPress={choice.action}><Card tone="line" style={{ flexDirection: 'row', alignItems: 'center', minHeight: 96 }}><Icon name={choice.icon} size={26} color={color.primary} /><View style={{ flex: 1 }}><AppText variant="heading">{t(choice.title)}</AppText><AppText tone="text2" variant="bodySm">{t(choice.body)}</AppText></View><Icon name="forward" size={20} color={color.text2} /></Card></Pressable>)}
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}><Icon name="info" size={18} color={color.text2} /><AppText tone="text2" variant="bodySm" style={{ flex: 1 }}>{t('connect.note')}</AppText></View>
    <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-end' }}><Image accessibilityLabel={t('mascot.alt.lookup')} source={mascotPoses.lookup} resizeMode="contain" style={{ width: 120, height: 120 }} /></View>
  </Screen>;
}
