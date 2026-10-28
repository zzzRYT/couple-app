import { ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/components';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';

export function SpaceChoiceScreen({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  const { t } = useTranslation();
  const color = useAppColor();
  return <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[3] }}>
    <Text accessibilityRole="header" style={{ color: color.text, fontSize: tokens.typography.scale.heading.size }}>{t('space.choice.title')}</Text>
    <Text style={{ color: color.text2, fontSize: tokens.typography.scale.body.size }}>{t('space.choice.body')}</Text>
    <Button label={t('join.createSpace')} onPress={onCreate} />
    <Button label={t('join.haveCode')} variant="secondary" onPress={onJoin} />
  </ScrollView>;
}
