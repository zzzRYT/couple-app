import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MilestoneCelebration } from '../../lib/client';
import { AppText, Button, GUTTER } from '../../ui/components';
import { IconButton } from '../../ui/components';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { PresetEntry } from './PresetEntry';
import { CelebrationSparkle } from './CelebrationSparkle';

export function MilestoneBubble({ celebration, preset, onClose, onSuggest, disabled, busy = false, full = false, top = tokens.spacing[7] }: { celebration: MilestoneCelebration | null; preset: MilestoneCelebration | null; onClose: () => void; onSuggest: () => void; disabled: boolean; busy?: boolean; full?: boolean; top?: number }) {
  const { t } = useTranslation();
  const color = useAppColor();
  if (!celebration && !preset?.presetAvailable) return null;
  const n = (celebration ?? preset)!.kind === 'day' ? (celebration ?? preset)!.days ?? 0 : (celebration ?? preset)!.anniversaryN ?? 0;
  const greeting = celebration ? t(celebration.kind === 'day' ? 'milestone.bubble.day' : 'milestone.bubble.anniv', { n }) : '';
  return <View pointerEvents="box-none" style={{ position: 'absolute', top, left: GUTTER, right: GUTTER, zIndex: 70, gap: tokens.spacing[2] }}>
    {celebration && <View testID="milestone-bubble" accessibilityLabel={t('a11y.milestone.bubble', { text: greeting })} style={{ alignSelf: 'flex-start', maxWidth: '88%', padding: tokens.spacing[3], gap: tokens.spacing[1], borderWidth: tokens.border.outline.normal, borderColor: color.line, borderRadius: tokens.radius.card, backgroundColor: color.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2] }}>
        <CelebrationSparkle />
        <AppText style={{ flex: 1 }}>{greeting}</AppText>
        <IconButton icon="close" label={t('a11y.milestone.close')} onPress={onClose} />
      </View>
      {celebration.presetAvailable && <View style={{ alignItems: 'flex-start', gap: 4 }}>
        <Button label={t('milestone.action.suggest')} icon="sparkle" variant="secondary" disabled={disabled} onPress={onSuggest} />
        <AppText variant="caption" tone="text2">{t('milestone.suggest.hint')}</AppText>
      </View>}
      {busy && <AppText variant="bodySm" tone="text2">{t('milestone.suggest.busy')}</AppText>}
      {full && <AppText variant="bodySm" tone="text2">{t('milestone.suggest.full')}</AppText>}
    </View>}
    {!celebration && preset?.presetAvailable && <View style={{ alignItems: 'flex-start', gap: tokens.spacing[1] }}>
      <PresetEntry celebration={preset} disabled={disabled} onPress={onSuggest} />
      {busy && <AppText variant="bodySm" tone="text2">{t('milestone.suggest.busy')}</AppText>}
      {full && <AppText variant="bodySm" tone="text2">{t('milestone.suggest.full')}</AppText>}
    </View>}
  </View>;
}
