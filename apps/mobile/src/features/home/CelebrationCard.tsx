import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Card, IconButton } from '../../ui/components';
import { mascotPoses } from '../../scene/catalog';
import type { MilestoneCelebration } from '../../lib/client';
import { formatAnniversary, parseCalendarDate } from '../../lib/dday';
export function CelebrationCard({ celebration, startDate, disabled, onSeen }: { celebration: MilestoneCelebration; startDate: string; disabled: boolean; onSeen: () => void }) {
  const { t, i18n } = useTranslation();
  const title = celebration.kind === 'day' ? t('anniv.days', { n: celebration.days }) : t('anniv.years', { n: celebration.anniversaryN });
  const n = Math.round((parseCalendarDate(celebration.milestoneDate)! - parseCalendarDate(startDate)!) / 86_400_000) + 1;
  return <Card tone="line" style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image accessibilityLabel={t('mascot.alt.cheer')} source={mascotPoses.cheer} resizeMode="contain" style={{ width: 90, height: 90 }} />
    <View style={{ flex: 1 }}><AppText variant="heading">{t('home.today.title', { title })}</AppText><AppText tone="text2" variant="bodySm">{celebration.daysAgo > 0 ? t('home.today.late', { date: formatAnniversary(celebration.milestoneDate, i18n.language), title }) : t('home.today.body.milestone', { date: formatAnniversary(startDate, i18n.language), n })}</AppText></View>
    <IconButton icon="close" label={t('home.today.close')} disabled={disabled} onPress={onSeen} />
  </Card>;
}
