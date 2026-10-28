import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button } from '../../ui/components';
import { useAppColor } from '../../theme/useAppColor';
/** Placeholder for the official Kakao/Apple button assets, replaced at gate G5. */
export function ProviderButton({ provider, onPress, highlighted }: { provider: 'kakao' | 'apple'; onPress: () => void; highlighted?: boolean }) {
  const { t } = useTranslation();
  const color = useAppColor();
  return (
    <View style={{ gap: 2 }}>
      {highlighted && <AppText variant="bodySm" style={{ color: color.primary }}>{t('onb.lastUsed')}</AppText>}
      <Button label={t(`login.${provider}`)} variant={highlighted ? 'primary' : 'secondary'} onPress={onPress} />
      <AppText variant="caption" tone="text2">{t('login.brandNote')}</AppText>
    </View>
  );
}
