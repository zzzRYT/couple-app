import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { RoomScene } from '../../scene/RoomScene';
import { estimateLayout, type RoomLayout } from '../../scene/protectedZones';
import { roomMode } from '../../scene/dayNight';
import { tokens } from '../../theme/tokens';
import type { SpaceState } from '../space/types';
import { DdayWidget } from './DdayWidget';
import { partnerLabel } from '../prompt/PromptPanel';
import { shouldAutoRecall } from './recallPolicy';
const color = tokens.color.app.light.normal;
/** S07 room: scene + native D-day widget + top toolbar with a single "decorate" action (settings, delete and leave live in the settings tab). */
export function RoomScreen({ state, now, onDecorate, onRecall, reducedMotion, layout: layoutOverride }: {
  state: SpaceState; now: string; onDecorate: () => void; onRecall: () => Promise<unknown>; reducedMotion?: boolean; layout?: RoomLayout;
}) {
  const { t } = useTranslation();
  const window = useWindowDimensions();
  const snapshot = state.snapshot;
  const baseLayout = layoutOverride ?? estimateLayout(window.width, window.height, window.fontScale, Platform.OS === 'android' ? 'android' : 'ios');
  const presentation = snapshot?.roomPresentation;
  const layout = useMemo(() => presentation?.visible
    ? { ...baseLayout, ddayWidget: { x: (presentation.x - presentation.width / 2) * baseLayout.width, y: (presentation.y - presentation.height / 2) * baseLayout.height, width: presentation.width * baseLayout.width, height: presentation.height * baseLayout.height } }
    : baseLayout, [baseLayout, presentation]);
  const hasMascot = !!snapshot?.sceneDocument.objects.some((node) => node.assetId === 'app_mascot');
  const session = snapshot?.promptSession;
  const partnerOccupying = !!session && session.status === 'occupied' && session.ownerUserId !== snapshot?.me.userId && Date.parse(session.expiresAt) > Date.parse(now);
  const occupied = !!session && session.status === 'occupied' && Date.parse(session.expiresAt) > Date.parse(now);
  const tried = useRef(false);
  const [recalling, setRecalling] = useState(false);
  useEffect(() => {
    if (!snapshot || !shouldAutoRecall({ hasMascot, occupied, online: !state.offline, alreadyTried: tried.current })) return;
    tried.current = true;
    void onRecall();
  }, [snapshot, hasMascot, occupied, state.offline, onRecall]);
  if (!snapshot) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: color.bg }}>
      {state.status === 'error' ? <View style={{ gap: 8, padding: 24 }}><Banner kind="danger" text={t('room.recover.title')} /><Text style={{ color: color.text2 }}>{t('room.recover.body')}</Text></View> : <><CycleLoader label={t('room.loading')} /><Text style={{ color: color.text }}>{t('room.loading')}</Text></>}
    </View>;
  }
  const mode = roomMode(snapshot.roomThemeDocument, now);
  const outline = tokens.color.roomOverlayControlOutline[mode].normal;
  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.room[mode].wall }}>
      <RoomScene scene={snapshot.sceneDocument} mode={mode} layout={layout} reducedMotion={reducedMotion}>
        <View accessibilityLabel={t('a11y.toolbar')} testID="room-toolbar" style={{ position: 'absolute', left: 0, right: 0, top: layout.toolbar.y, height: layout.toolbar.height, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16, zIndex: 50 }}>
          <View style={{ borderWidth: 2, borderColor: outline, backgroundColor: color.surface }}>
            <Button label={t('room.ctl.decorate')} accessibilityLabel={t('a11y.decorate')} variant="ghost" disabled={state.offline} onPress={onDecorate} />
          </View>
        </View>
        <DdayWidget presentation={snapshot.roomPresentation} anniversaryDate={snapshot.space.anniversaryDate} timeZone={snapshot.space.timeZone} now={now} width={layout.width} height={layout.height} />
        <View style={{ position: 'absolute', left: 16, right: 16, top: layout.toolbar.y + layout.toolbar.height + 8, gap: 8, zIndex: 45 }}>
          {state.offline && <Banner kind="offline" text={t('room.offline')} />}
          {!state.offline && state.status === 'error' && <Banner kind="warn" text={t('room.syncFail.title')} />}
          {!snapshot.roomPresentation.visible && <Banner text={t('room.ddayHidden')} />}
          {partnerOccupying && <Banner text={t('room.partnerLive', { name: partnerLabel(t) })} />}
        </View>
        {!hasMascot && <View style={{ position: 'absolute', left: 16, right: 16, bottom: layout.safeBottom + layout.tabBarHeight + 16, gap: 4, zIndex: 45 }}>
          <Text style={{ color: tokens.color.room[mode].line }}>{t('room.mascot.missing')}</Text>
          {partnerOccupying && <Text style={{ color: tokens.color.room[mode].line }}>{t('prompt.partner', { name: partnerLabel(t) })}</Text>}
          <Button label={t('room.mascot.recall')} disabled={occupied || state.offline || recalling} onPress={() => { setRecalling(true); void onRecall().finally(() => setRecalling(false)); }} />
        </View>}
      </RoomScene>
    </View>
  );
}
