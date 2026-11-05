import { Image, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Card, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { mascotPoses } from '../../scene/catalog';
import { useAppColor } from '../../theme/useAppColor';
export function SpaceChoiceScreen({ onCreate, onJoin, onBack }: { onCreate: () => void; onJoin: () => void; onBack?: () => void }) {
  const { t } = useTranslation(); const color = useAppColor();
  return <Screen onBack={onBack}><AppText variant="title" accessibilityRole="header">{t('start.choose.title')}</AppText>
    {([{ title: 'start.choose.new.title', body: 'start.choose.new.body', action: onCreate }, { title: 'start.choose.join.title', body: 'start.choose.join.body', action: onJoin }] as const).map((choice) => <Pressable key={choice.title} accessibilityRole="button" accessibilityLabel={t(choice.title)} onPress={choice.action}><Card tone="line" style={{ flexDirection: 'row', alignItems: 'center', minHeight: 96 }}><Icon name="heart" size={26} color={color.primary} /><View style={{ flex: 1 }}><AppText variant="heading">{t(choice.title)}</AppText><AppText tone="text2" variant="bodySm">{t(choice.body)}</AppText></View><Icon name="forward" size={20} color={color.text2} /></Card></Pressable>)}
    <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-end' }}><Image accessibilityLabel={t('mascot.alt.lookup')} source={mascotPoses.lookup} resizeMode="contain" style={{ width: 120, height: 120 }} /></View>
  </Screen>;
}
