import { AppText, Button } from '../../ui/components';
import { View } from 'react-native';
import type { MilestoneCelebration } from '../../lib/client';
import { useTranslation } from 'react-i18next';
export function PresetEntry({ celebration, onPress, disabled }: { celebration: MilestoneCelebration | null; onPress: () => void; disabled?: boolean }) {
  const { t } = useTranslation();
  if (!celebration?.presetAvailable) return null;
  return <View style={{ alignItems: 'flex-start', gap: 4 }}>
    <Button testID="milestone-preset-entry" label={t('milestone.action.suggest')} icon="sparkle" variant="secondary" disabled={disabled} onPress={onPress} />
    <AppText variant="caption" tone="text2">{t('milestone.suggest.hint')}</AppText>
  </View>;
}
