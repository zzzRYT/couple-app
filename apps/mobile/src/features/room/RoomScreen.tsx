import { useAppColor } from '../../theme/useAppColor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Banner, Button, GUTTER, Toast } from '../../ui/components';
import { LoadingScreen } from '../../ui/CycleLoader';
import { Icon } from '../../ui/Icon';
import { useScreenFocused } from '../../ui/motion';
import { RoomScene } from '../../scene/RoomScene';
import { estimateLayout, type RoomLayout } from '../../scene/protectedZones';
import { roomMode } from '../../scene/dayNight';
import { tokens } from '../../theme/tokens';
import type { SpaceState } from '../space/types';
import { DdayWidget } from './DdayWidget';
import { partnerLabel } from '../prompt/PromptPanel';
import { shouldAutoRecall } from './recallPolicy';
import type { MilestoneCelebration } from '../../lib/client';
import { MilestoneBubble } from '../milestone/MilestoneBubble';

/** S07 room: scene + native D-day widget + top toolbar with a single "decorate" action (settings, delete and leave live in the settings tab). */
export function RoomScreen({ state, now, onDecorate, onRecall, onRetry, reducedMotion, layout: layoutOverride, milestone, milestonePreset, onMilestoneSeen, onMilestoneSuggest }: {
  state: SpaceState; now: string; onDecorate: () => void; onRecall: () => Promise<unknown>; onRetry?: () => Promise<unknown>; reducedMotion?: boolean; layout?: RoomLayout;
  milestone?: MilestoneCelebration | null; milestonePreset?: MilestoneCelebration | null; onMilestoneSeen?: () => void; onMilestoneSuggest?: () => void;
}) {
  const focused = useScreenFocused();
  const color = useAppColor();
  const { t } = useTranslation();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const snapshot = state.snapshot;
  const estimated = estimateLayout(window.width, window.height, window.fontScale, Platform.OS === 'android' ? 'android' : 'ios');
  const baseLayout = layoutOverride ?? { ...estimated, safeTop: insets.top, safeBottom: insets.bottom, toolbar: { ...estimated.toolbar, y: insets.top } };
  const originalPresentation = snapshot?.roomPresentation;
  // Keep the stored position, but shift the visible widget below the toolbar when a
  // device's safe area makes the two overlap. Scene protection uses the same frame.
  const presentation = originalPresentation && originalPresentation.visible &&
    (originalPresentation.y - originalPresentation.height / 2) * baseLayout.height < baseLayout.toolbar.y + baseLayout.toolbar.height &&
    (originalPresentation.y + originalPresentation.height / 2) * baseLayout.height > baseLayout.toolbar.y
    ? { ...originalPresentation, y: (baseLayout.toolbar.y + baseLayout.toolbar.height) / baseLayout.height + originalPresentation.height / 2 }
    : originalPresentation;
  const layout = useMemo(() => presentation?.visible
    ? { ...baseLayout, ddayWidget: { x: (presentation.x - presentation.width / 2) * baseLayout.width, y: (presentation.y - presentation.height / 2) * baseLayout.height, width: presentation.width * baseLayout.width, height: presentation.height * baseLayout.height } }
    : baseLayout, [baseLayout, presentation]);
  const hasMascot = !!snapshot?.sceneDocument.objects.some((node) => node.assetId === 'app_mascot');
  const session = snapshot?.promptSession;
  const partnerOccupying = !!session && session.status === 'occupied' && session.ownerUserId !== snapshot?.me.userId && Date.parse(session.expiresAt) > Date.parse(now);
  const occupied = !!session && session.status === 'occupied' && Date.parse(session.expiresAt) > Date.parse(now);
  const roomFull = (snapshot?.sceneDocument.objects.length ?? 0) >= 16;
  const tried = useRef(false);
  const [recalling, setRecalling] = useState(false);
  useEffect(() => {
    if (!snapshot || !shouldAutoRecall({ hasMascot, occupied, online: !state.offline, alreadyTried: tried.current })) return;
    tried.current = true;
    void onRecall();
  }, [snapshot, hasMascot, occupied, state.offline, onRecall]);
  const version = snapshot?.versionNumber;
  const lastVersion = useRef(version);
  const [changed, setChanged] = useState(false);
  const hideChanged = useCallback(() => setChanged(false), []);
  useEffect(() => {
    // §9: the partner changed the room while it is on screen; my own applies happen in the decorate sheet, which covers the room.
    if (version !== undefined && lastVersion.current !== undefined && version > lastVersion.current && focused) setChanged(true);
    lastVersion.current = version;
  }, [version, focused]);
  if (!snapshot) {
    if (state.status === 'error') {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: GUTTER, gap: tokens.spacing[3], backgroundColor: color.bg }}>
          <Banner kind="danger" text={t('room.recover.title')} body={t('room.recover.body')} action={onRetry ? { label: t('room.recover.action'), onPress: () => void onRetry() } : undefined} />
        </View>
      );
    }
    return <LoadingScreen label={t('room.loading')} />;
  }
  const mode = roomMode(snapshot.roomThemeDocument, now);
  const outline = tokens.color.roomOverlayControlOutline[mode].normal;
  const bottom = layout.safeBottom + layout.tabBarHeight + tokens.spacing[3];
  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.room[mode].wall }}>
      <RoomScene scene={snapshot.sceneDocument} mode={mode} layout={layout} reducedMotion={reducedMotion} celebrating={!!milestone}>
        <View accessibilityRole="toolbar" accessibilityLabel={t('a11y.toolbar')} testID="room-toolbar" style={{ position: 'absolute', left: GUTTER, right: GUTTER, top: layout.toolbar.y, height: layout.toolbar.height, justifyContent: 'center', zIndex: 50 }}>
          {partnerOccupying
            ? <Button label={t('room.watch')} icon="eye" variant="secondary" outline={outline} disabled={state.offline} onPress={onDecorate} />
            : <Button label={t('room.ctl.decorate')} accessibilityLabel={t('a11y.decorate')} icon="sparkle" outline={outline} disabled={state.offline} onPress={onDecorate} />}
        </View>
        <DdayWidget presentation={presentation ?? snapshot.roomPresentation} anniversaryDate={snapshot.space.anniversaryDate} timeZone={snapshot.space.timeZone} now={now} width={layout.width} height={layout.height} />
        <MilestoneBubble top={layout.toolbar.y + layout.toolbar.height + tokens.spacing[2]} celebration={milestone ?? null} preset={milestonePreset ?? null} onClose={onMilestoneSeen ?? (() => {})} onSuggest={onMilestoneSuggest ?? (() => {})} disabled={state.offline || occupied || roomFull || !milestonePreset?.presetAvailable} busy={occupied} full={roomFull} />
        <View pointerEvents="box-none" style={{ position: 'absolute', left: GUTTER, right: GUTTER, bottom, gap: tokens.spacing[1], zIndex: 45 }}>
          {changed && <Toast text={t('room.partnerChanged', { name: partnerLabel(t) })} onHide={hideChanged} />}
          {state.offline && <Banner kind="offline" text={t('room.offline')} />}
          {!state.offline && state.status === 'error' && <Banner kind="warn" text={t('room.syncFail.title')} body={t('room.syncFail.body')} action={onRetry ? { label: t('common.retry'), onPress: () => void onRetry() } : undefined} />}
          {!snapshot.roomPresentation.visible && <Banner quiet text={t('room.ddayHidden')} />}
          {partnerOccupying && <Banner icon="eye" text={t('room.partnerLive', { name: partnerLabel(t) })} />}
          {!hasMascot && <Pressable accessibilityRole="button" accessibilityLabel={t('room.mascot.recall')} accessibilityHint={t('room.mascot.missing')} disabled={occupied || state.offline || recalling}
            onPress={() => { setRecalling(true); void onRecall().finally(() => setRecalling(false)); }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2], padding: tokens.spacing[3], borderRadius: tokens.radius.card, borderWidth: tokens.border.outline.normal, borderColor: outline, backgroundColor: color.surface, opacity: occupied || state.offline ? 0.55 : pressed ? 0.85 : 1 })}>
            <Icon name={occupied ? 'lock' : 'heart'} size={22} color={color.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label">{t('room.mascot.recall')}</AppText>
              <AppText variant="bodySm" tone="text2">{partnerOccupying ? t('prompt.partner', { name: partnerLabel(t) }) : t('room.mascot.missing')}</AppText>
            </View>
            <Icon name="forward" size={18} color={color.text2} />
          </Pressable>}
        </View>
      </RoomScene>
    </View>
  );
}
