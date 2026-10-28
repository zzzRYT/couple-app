import { useTranslation } from 'react-i18next';
import { AppText, Button, Screen } from '../../ui/components';
import { Spot } from '../../ui/Spot';

/** Create-or-join entry before a space exists (no tab bar). */
export function SpaceChoiceScreen({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen center footer={<>
      <Button label={t('join.createSpace')} onPress={onCreate} />
      <Button label={t('join.haveCode')} variant="secondary" onPress={onJoin} />
    </>}>
      <Spot kind="books" />
      <AppText variant="title" accessibilityRole="header" align="center">{t('space.choice.title')}</AppText>
      <AppText tone="text2" align="center">{t('space.choice.body')}</AppText>
    </Screen>
  );
}
