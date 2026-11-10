import { Fragment, useCallback, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Card, Chip, Skeleton, Toast, useTabBarClearance } from '../../ui/components';
import { OfflineBand } from '../space/OfflineBand';
import { Icon, type IconName } from '../../ui/Icon';
import { mascotPoses } from '../../scene/catalog';
import { tokens } from '../../theme/tokens';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { computeAnniversaries, type Occurrence } from '../../lib/anniversaries';
import type { MilestoneCelebration } from '../../lib/client';
import type { SpaceState } from '../space/types';
import { CelebrationCard, TodayCard } from './CelebrationCard';
import { InvitePendingCard } from './InvitePendingCard';
import { AnniversaryRow } from '../anniversaries/AnniversaryRow';
import { KindTile } from '../anniversaries/KindTile';
import { formattedDate, formattedYearMonthDay, occurrenceTitle, relativeDate } from '../anniversaries/format';
import { splitBigDay, useLargeText } from '../../ui/textScale';
import { Wordmark } from '../../ui/Wordmark';

export function V0HomeScreen({ state, now, onAnniversaries, onRefresh, onOpenInvite, onHaveCode, celebration, onSeen, partnerEdited, onHidePartnerEdited, seenKeys = [], seenReady = true, onLocalSeen, onOccurrence }: { state: SpaceState; now: string; onAnniversaries: () => void; onRefresh: () => void; onOpenInvite: (reissue: boolean) => void; onHaveCode?: () => void; celebration: MilestoneCelebration | null; onSeen: () => void; partnerEdited?: string | null; onHidePartnerEdited?: () => void; seenKeys?: string[]; seenReady?: boolean; onLocalSeen?: (key: string) => void; onOccurrence?: (item: Occurrence) => void }) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType();
  const color = useAppColor(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance(); const large = useLargeText();
  const [copied, setCopied] = useState<boolean | null>(null);
  const hideCopied = useCallback(() => setCopied(null), []);
  const snapshot = state.snapshot;
  if (!snapshot) return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top + 20, paddingHorizontal: 20 }}><Skeleton label={t('state.loading')} height={180} /></View>;
  const { space } = snapshot;
  const lang = i18n.language;
  const partnerMember = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  const view = computeAnniversaries({ startDate: space.anniversaryDate, timeZone: space.timeZone, me: snapshot.me, partner: partnerMember ?? null, customs: snapshot.anniversaries }, now);
  const partner = partnerMember?.displayName ?? t('home.pending.partner');
  const name = snapshot.me.displayName ?? '';
  const pending = space.memberCount < 2;
  const candidate = seenReady ? view.celebrationCandidates.find((item) => item.kind === 'days' || item.kind === 'years' ? celebration?.key === item.key : !seenKeys.includes(item.key)) : undefined;
  const showCelebration = candidate && (candidate.kind === 'days' || candidate.kind === 'years') ? celebration : null;
  const localCelebration = candidate && candidate.kind !== 'days' && candidate.kind !== 'years' ? candidate : null;
  const celebrating = !!showCelebration || !!localCelebration;
  const mascot = !state.offline && !celebrating && !pending;
  const title = (item: Occurrence) => occurrenceTitle(item, partner, t);
  const open = (item: Occurrence) => onOccurrence ? onOccurrence(item) : onAnniversaries();
  const since = formattedYearMonthDay(space.anniversaryDate, lang);
  const big = t('dday.big', { n: view.dayCount });
  const next = view.upcoming[0];
  const nextCard = (item: Occurrence) => {
    const left = relativeDate(item.date, view.today, t);
    const dday = <AppText variant="title" tone="primary" style={{ fontSize: 30, lineHeight: 38 }}>{left}</AppText>;
    return <Pressable accessibilityRole="button" accessibilityLabel={`${t('home.next.label')}, ${t('anniv.row.a11y', { title: title(item), date: formattedDate(item.date, lang, true), left })}`} onPress={() => open(item)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Card tone="line" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
        <KindTile item={item} size={48} />
        <View style={{ flex: 1 }}><AppText tone="text2" variant="bodySm" style={{ fontSize: 13 }}>{t('home.next.label')}</AppText><AppText style={emphasis(19)}>{title(item)}</AppText><AppText tone="text2" variant="bodySm">{formattedDate(item.date, lang, false)}</AppText>{large && dday}</View>
        {!large && dday}
      </Card>
    </Pressable>;
  };
  const todayCard = showCelebration ? <CelebrationCard celebration={showCelebration} startDate={space.anniversaryDate} disabled={state.offline} onSeen={onSeen} />
    : localCelebration ? <TodayCard title={localCelebration.kind === 'season' ? t('home.today.title.season', { title: title(localCelebration) }) : localCelebration.kind === 'birthday' ? t('home.today.title.birthday', { name: localCelebration.who === 'me' ? name : partner }) : t('home.today.title', { title: title(localCelebration) })} body={t('home.today.body.season')} onClose={() => onLocalSeen?.(localCelebration.key)} />
    : next ? nextCard(next) : null;
  const upcoming = view.upcoming.slice(celebrating ? 0 : 1, celebrating ? 3 : 4);
  const notice: { text: string; icon: IconName; onHide?: () => void } | null = copied !== null ? { text: t(copied ? 'invite.copied' : 'invite.err.title'), icon: copied ? 'check' : 'info', onHide: hideCopied }
    : partnerEdited ? { text: partnerEdited, icon: 'info', onHide: onHidePartnerEdited } : null;
  return <View style={{ flex: 1, backgroundColor: color.bg }}>
    <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />} contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: clearance + 16, gap: 14 }}>
      <View style={{ minHeight: 48, justifyContent: 'center' }}><Wordmark /></View>
      {state.offline && <OfflineBand syncedAt={state.lastSyncedAt} />}
      <View style={{ alignItems: 'center', gap: 4 }}>
        {mascot && <Image accessibilityLabel={t('mascot.alt.wave')} source={mascotPoses.wave_main} resizeMode="contain" style={{ width: 96, height: 96 }} />}
        <View accessible accessibilityRole="text" accessibilityLabel={t('home.names.a11y', { me: name, partner })} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <AppText style={emphasis(16)}>{name}</AppText>
          <Icon name="heart" size={16} color={color.primary} fill={color.primary} />
          {pending ? <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.border, borderRadius: tokens.radius.pill, paddingHorizontal: 10 }}><AppText tone="text2" style={emphasis(16)}>{partner}</AppText></View> : <AppText style={emphasis(16)}>{partner}</AppText>}
        </View>
        <View accessible accessibilityLabel={t('dday.a11y', { n: view.dayCount, date: since })} style={{ alignItems: 'center', gap: 4 }}>
          <AppText tone="text2">{t('dday.together')}</AppText>
          <AppText variant="display" style={mascot ? { fontSize: 60, lineHeight: 75 } : undefined}>{large ? splitBigDay(big, view.dayCount) : big}</AppText>
          <AppText tone="text2">{t('dday.since', { date: since })}</AppText>
        </View>
        {pending && <View style={{ marginTop: 8 }}><Chip kind="warn" icon="clock" label={t('home.pending.chip')} /></View>}
        {showCelebration && showCelebration.daysAgo === 0 && <View style={{ marginTop: 8 }}><Chip kind="primary" icon="sparkle" label={t('home.today.chip', { title: showCelebration.kind === 'day' ? t('anniv.days', { n: showCelebration.days }) : t('anniv.years', { n: showCelebration.anniversaryN }) })} /></View>}
      </View>
      {pending && <InvitePendingCard spaceId={space.spaceId} expiresAt={space.invitation?.expiresAt ?? null} now={now} offline={state.offline} onOpenInvite={onOpenInvite} onHaveCode={onHaveCode} onCopied={setCopied} />}
      {todayCard}
      {!pending && <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 }}>
          <AppText accessibilityRole="header" style={[emphasis(17), { flexShrink: 1 }]}>{t('home.upcoming.title')}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={t('home.upcoming.all')} onPress={onAnniversaries} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 2 }}><AppText tone="primary" style={emphasis(15)}>{t('home.upcoming.all')}</AppText><Icon name="forward" size={16} color={color.primary} /></Pressable>
        </View>
        {upcoming.length > 0 && <View style={{ borderWidth: tokens.border.outline.normal, borderColor: color.divider, borderRadius: tokens.radius.card, overflow: 'hidden' }}>
          {upcoming.map((item, index) => <Fragment key={item.key}>{index > 0 && <View style={{ height: 1, marginLeft: 66, backgroundColor: color.divider }} />}<AnniversaryRow item={item} today={view.today} partner={partner} compact onPress={() => open(item)} /></Fragment>)}
        </View>}
      </>}
    </ScrollView>
    {notice && <View pointerEvents="box-none" style={{ position: 'absolute', left: 20, right: 20, bottom: clearance + 13 }}><Toast key={notice.text} text={notice.text} icon={notice.icon} onHide={notice.onHide} /></View>}
  </View>;
}
