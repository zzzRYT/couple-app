import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/components';
import { tokens } from '../../theme/tokens';
/** Placeholder for the official Kakao/Apple button assets, replaced at gate G5. */
export function ProviderButton({ provider, onPress, highlighted }: { provider: 'kakao' | 'apple'; onPress: () => void; highlighted?: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 2 }}>
      {highlighted && <Text style={{ color: tokens.color.app.light.normal.primary }}>{t('onb.lastUsed')}</Text>}
      <Button label={t(`login.${provider}`)} variant={highlighted ? 'primary' : 'secondary'} onPress={onPress} />
      <Text style={{ color: tokens.color.app.light.normal.text2, fontSize: 12 }}>{t('login.brandNote')}</Text>
    </View>
  );
}
