import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MilestoneCelebration } from '../../lib/client';
import { AppText, Button, GUTTER } from '../../ui/components';
import { mascotPoses } from '../../scene/catalog';
import { Icon } from '../../ui/Icon';
import { CelebrationSparkle } from './CelebrationSparkle';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';

export function MilestoneCard({ celebration, offline, onClose, onSuggest }: { celebration: MilestoneCelebration | null; offline: boolean; onClose: () => void; onSuggest: () => void }) {
  const { t } = useTranslation();
  const color = useAppColor();
  const stacked = useWindowDimensions().fontScale >= 1.3;
  if (!celebration) return null;
  const n = celebration.kind === 'day' ? celebration.days ?? 0 : celebration.anniversaryN ?? 0;
  const title = t(celebration.kind === 'day' ? 'milestone.title.day' : 'milestone.title.anniv', { n });
  return <View testID="milestone-card" accessibilityLabel={t('a11y.milestone.card', { label: title })} style={{ padding: GUTTER, gap: tokens.spacing[2], borderWidth: tokens.border.outline.normal, borderColor: color.line, borderRadius: tokens.radius.card, backgroundColor: color.surface }}>
    <View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: 'center', gap: tokens.spacing[2] }}>
      <Image accessibilityLabel={t('a11y.mascot', { pose: t('a11y.pose.cheer') })} source={mascotPoses.cheer} resizeMode="contain" style={{ width: 48, height: 48 }} />
      <CelebrationSparkle />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label" align={stacked ? 'center' : undefined}>{title}</AppText>
        <AppText tone="text2" align={stacked ? 'center' : undefined}>{t(celebration.daysAgo ? 'milestone.body.late' : 'milestone.body.today', { date: celebration.milestoneDate })}</AppText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('a11y.milestone.close')} testID="milestone-close" onPress={onClose} hitSlop={8} style={{ minWidth: tokens.touch.minimum, minHeight: tokens.touch.minimum, alignItems: 'center', justifyContent: 'center', alignSelf: stacked ? 'flex-end' : undefined }}>
        <Icon name="close" size={20} color={color.text2} />
      </Pressable>
    </View>
    {!offline && <View style={{ alignItems: 'center', gap: 4 }}>
      <Button label={t('milestone.action.suggest')} icon="sparkle" variant="secondary" onPress={onSuggest} />
      <AppText variant="caption" tone="text2">{t('milestone.suggest.hint')}</AppText>
    </View>}
  </View>;
}
