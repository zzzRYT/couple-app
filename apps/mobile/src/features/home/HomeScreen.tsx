import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, BottomSheet, Button, Chip, GUTTER, Skeleton, Toast, useTabBarClearance } from '../../ui/components';
import { DateWheel, fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { Icon } from '../../ui/Icon';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import { RoomScene } from '../../scene/RoomScene';
import { estimateLayout } from '../../scene/protectedZones';
import { roomMode } from '../../scene/dayNight';
import { dayCount, formatAnniversary, todayIn } from '../../lib/dday';
import type { Snapshot } from '../../lib/client';
import type { SpaceState } from '../space/types';
import type { MilestoneCelebration } from '../../lib/client';
import { MilestoneCard } from '../milestone/MilestoneCard';

function EditDateSheet({ initial, now, timeZone, onClose, onSave }: { initial: string; now: string; timeZone: string; onClose: () => void; onSave: (date: string) => Promise<void> }) {
  const { t } = useTranslation();
  const [date, setDate] = useState(fromIsoDate(initial));
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function save() {
    const iso = toIsoDate(date);
    const check = dayCount(iso, now, timeZone);
    if (!check.ok) { setProblem(check.code === 'FUTURE_DATE' ? 'space.date.future' : 'space.date.invalid'); return; }
    setSaving(true);
    try { await onSave(iso); onClose(); } catch { setProblem('main.sync.title'); } finally { setSaving(false); }
  }
  return (
    <BottomSheet visible title={t('main.editSheet.title')} onClose={onClose}>
      <AppText tone="text2">{t('main.editSheet.body')}</AppText>
      <DateWheel value={date} maxYear={Number(todayIn(now, timeZone).slice(0, 4))} onChange={(next) => { setDate(next); setProblem(null); }} />
      {problem && <Banner kind="warn" text={t(problem)} />}
      <Button label={t('common.save')} loading={saving} onPress={() => void save()} />
      <Button label={t('common.cancel')} variant="ghost" disabled={saving} onPress={onClose} />
    </BottomSheet>
  );
}
/** Room-card thumbnail: the lower part of the room (floor line, mascot, props), still. */
function RoomThumb({ snapshot, mode }: { snapshot: Snapshot; mode: 'day' | 'night' }) {
  const width = 104;
  const height = 76;
  const base = estimateLayout(width, width * 1.5, 1, 'ios');
  const layout = { ...base, safeTop: 0, safeBottom: 0, tabBarHeight: 0, toolbar: { x: 0, y: 0, width: 0, height: 0 } };
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height, borderRadius: tokens.radius.input, overflow: 'hidden', backgroundColor: tokens.color.room[mode].wall }}>
      <View style={{ position: 'absolute', top: -(layout.height - height) * 0.86 }}><RoomScene scene={snapshot.sceneDocument} mode={mode} layout={layout} compact /></View>
    </View>
  );
}
/** S06 home: the shared day count. The cover photo slot keeps the plain paper background until US6. */
export function HomeScreen({ state, now, onOpenRoom, onOpenInvite, onSaveDate, onRefresh, milestone, milestonePreset, onMilestoneSeen, onMilestoneSuggest }: { state: SpaceState; now: string; onOpenRoom: () => void; onOpenInvite: () => void; onSaveDate: (date: string) => Promise<void>; onRefresh?: () => Promise<unknown>; milestone?: MilestoneCelebration | null; milestonePreset?: MilestoneCelebration | null; onMilestoneSeen?: () => void; onMilestoneSuggest?: () => void }) {
  const color = useAppColor();
  const { t, i18n } = useTranslation();
  const { type, emphasis } = useType();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const clearance = useTabBarClearance();
  const hideSaved = useCallback(() => setSaved(false), []);
  const refresh = onRefresh ? () => { setRefreshing(true); void onRefresh().finally(() => setRefreshing(false)); } : undefined;
  const snapshot = state.snapshot;
  const scroll = (children: ReactNode) => (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: color.bg }}
      refreshControl={refresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.primary} /> : undefined}
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: GUTTER, paddingTop: tokens.spacing[3], paddingBottom: clearance + tokens.spacing[2], gap: tokens.spacing[3] }}>{children}</ScrollView>
  );
  if (!snapshot) {
    return scroll(state.status === 'error'
      ? <><AppText style={[emphasis(18), { color: color.text }]}>{t('main.appName')}</AppText><Banner kind="danger" text={t('main.sync.title')} body={t('sys.server.body')} action={refresh ? { label: t('common.retry'), onPress: refresh } : undefined} /></>
      : <View accessible accessibilityLabel={t('main.loading')} style={{ gap: tokens.spacing[3], alignItems: 'center', paddingTop: tokens.spacing[6] }}>
        <Skeleton width={90} height={22} /><Skeleton width={220} height={64} /><Skeleton width={160} height={20} />
        <View style={{ height: tokens.spacing[5] }} /><Skeleton width="100%" height={100} />
      </View>);
  }
  const { space } = snapshot;
  const count = dayCount(space.anniversaryDate, now, space.timeZone);
  const pending = space.memberCount < 2;
  const hoursLeft = space.invitation?.status === 'active' ? Math.max(0, Math.ceil((Date.parse(space.invitation.expiresAt) - Date.parse(now)) / 3_600_000)) : null;
  const n = count.ok ? count.dayCount : 0;
  const mode = roomMode(snapshot.roomThemeDocument, now);
  const since = formatAnniversary(space.anniversaryDate, i18n.language);
  return (
    <>
      {scroll(<>
        <View style={{ minHeight: tokens.touch.minimum, justifyContent: 'center' }}><AppText accessibilityRole="header" style={[emphasis(18), { color: color.text }]}>{t('main.appName')}</AppText></View>
        {state.offline && <Banner kind="offline" text={t('main.offline.title')} body={t('main.offline.body')} />}
        <MilestoneCard celebration={milestone ?? null} offline={state.offline} onClose={onMilestoneSeen ?? (() => {})} onSuggest={onMilestoneSuggest ?? (() => {})} />
        {!milestone && milestonePreset?.presetAvailable && <Button label={t('milestone.action.suggest')} icon="sparkle" variant="secondary" disabled={state.offline} onPress={onMilestoneSuggest ?? (() => {})} />}
        {!state.offline && state.status === 'error' && <Banner kind="warn" text={t('main.sync.title')} body={t('main.sync.body')} action={refresh ? { label: t('common.retry'), onPress: refresh } : undefined} />}
        <View accessible accessibilityLabel={`${t('dday.eyebrow')} ${t('dday.count', { n })}, ${since}`} style={{ alignItems: 'center', gap: tokens.spacing[1], paddingVertical: tokens.spacing[3] }}>
          <AppText style={[emphasis(18), { color: color.text2 }]}>{t('dday.eyebrow')}</AppText>
          <AppText variant="display" align="center">{t('dday.count', { n })}</AppText>
          <AppText tone="text2" align="center" style={type('body')}>{since}</AppText>
          {pending && <View style={{ alignSelf: 'center', marginTop: tokens.spacing[1] }}><Chip kind="warn" icon="people" label={t('main.chip.waiting')} /></View>}
        </View>
        {pending && <Banner kind="info" icon="people" text={t('main.invitePending.title')} body={hoursLeft !== null ? t('main.invitePending.body', { h: hoursLeft }) : null}
          action={{ label: t('main.invitePending.action'), onPress: onOpenInvite }} />}
        <Pressable accessibilityRole="button" accessibilityLabel={`${t('main.roomCard.title')}, ${t(mode === 'day' ? 'main.roomCard.day' : 'main.roomCard.night')}`} onPress={onOpenRoom}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[3], padding: tokens.spacing[2], paddingRight: tokens.spacing[3], borderRadius: tokens.radius.card, borderWidth: tokens.border.outline.normal, borderColor: color.divider, backgroundColor: color.surface, opacity: pressed ? 0.85 : 1 })}>
          <RoomThumb snapshot={snapshot} mode={mode} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={[emphasis(20), { color: color.text }]}>{t('main.roomCard.title')}</AppText>
            <AppText variant="bodySm" tone="text2">{t(mode === 'day' ? 'main.roomCard.day' : 'main.roomCard.night')}</AppText>
          </View>
          <Icon name="forward" size={20} color={color.text2} />
        </Pressable>
        <View style={{ flexGrow: 1, minHeight: tokens.spacing[5] }} />
        {saved && <Toast text={t('main.editSheet.saved')} onHide={hideSaved} />}
        <View style={{ gap: tokens.spacing[1] }}>
          <Button label={t('main.openRoom')} icon="sparkle" onPress={onOpenRoom} />
          <Button label={t('main.editDate')} variant="ghost" disabled={state.offline} onPress={() => { setSaved(false); setEditing(true); }} />
          {state.lastSyncedAt && (state.offline || state.status === 'error') && <AppText variant="caption" tone="text2" align="center">{t('main.lastSeen', { time: new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(new Date(state.lastSyncedAt)) })}</AppText>}
        </View>
      </>)}
      {editing && <EditDateSheet initial={space.anniversaryDate} now={now} timeZone={space.timeZone} onClose={() => setEditing(false)} onSave={async (date) => { await onSaveDate(date); setSaved(true); }} />}
    </>
  );
}
