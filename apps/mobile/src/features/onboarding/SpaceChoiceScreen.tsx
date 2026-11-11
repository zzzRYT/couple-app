import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Screen } from '../../ui/components';
import { mascotPoses } from '../../scene/catalog';
import { ChoiceCard } from './ChoiceCard';
/** V0-start-choose has no back: the person is signed in here, so going back to the intro would mean signing out. */
export function SpaceChoiceScreen({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  const { t } = useTranslation();
  return <Screen><AppText variant="title" accessibilityRole="header">{t('start.choose.title')}</AppText>
    <ChoiceCard title={t('start.choose.new.title')} body={t('start.choose.new.body')} icon="annivDays" face="peach" onPress={onCreate} />
    <ChoiceCard title={t('start.choose.join.title')} body={t('start.choose.join.body')} icon="annivCustom" face="lav" soft onPress={onJoin} />
    <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-end' }}><Image accessibilityLabel={t('mascot.alt.lookup')} source={mascotPoses.lookup} resizeMode="contain" style={{ width: 120, height: 120 }} /></View>
  </Screen>;
}
