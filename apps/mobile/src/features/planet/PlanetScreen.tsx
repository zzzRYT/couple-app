import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, PanResponder, Pressable, Text, View } from 'react-native';
import { Canvas as BackgroundCanvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useType } from '../../theme/typography';
import { V1_FEATURES } from '../../config/features';
import { useTabBarClearance } from '../../ui/components';
import { useLoopActive } from '../../ui/motion';
import { dayCount } from '../../lib/dday';
import { roomVariant } from '../settings/followTime';
import { drag, inertia, initialCamera, pinch, themes, type Camera } from './model';
import { PlanetScene } from './PlanetScene';
import { planetLevel } from './level';
import { canPlace, type Placement } from './placement';
import { readPlanet, writePlanet, type PlanetData } from './planetStorage';
import { demoAsset } from './demoAsset';
import { disposePlanetAsset, loadPlanetAsset } from './planetAsset';
import type { Object3D } from 'three';
import { initialWalker, walk, walkerCoordinates, walkSpeed } from './walk';

const walkActions = { walkForward: 0, walkRight: Math.PI / 2, walkBack: Math.PI, walkLeft: -Math.PI / 2 };

export function PlanetScreen({ spaceId, anniversary, timeZone, now }: { spaceId: string; anniversary: string; timeZone: string; now: string }) {
  const { t } = useTranslation(); const { type } = useType(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance();
  const active = useLoopActive();
  const [devEntitlement, setDevEntitlement] = useState(false);
  const [data, setData] = useState<PlanetData | null>(null);
  const [asset, setAsset] = useState<Object3D | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false); const saving = useRef(false);
  useEffect(() => {
    let live = true; let loaded: Object3D | null = null;
    void readPlanet(spaceId).then((value) => { if (live) setData(value); }).catch(() => { if (live) setMessage('planet.storageError'); });
    void loadPlanetAsset(demoAsset).then((value) => { loaded = value; if (live) setAsset(value); else disposePlanetAsset(value); }).catch(() => { if (live) setMessage('planet.assetError'); });
    return () => { live = false; if (loaded) disposePlanetAsset(loaded); };
  }, [spaceId]);
  const save = async (next: PlanetData) => {
    if (saving.current) return false;
    saving.current = true; setBusy(true);
    try { await writePlanet(spaceId, next); setData(next); return true; }
    catch { setMessage('planet.storageError'); return false; }
    finally { saving.current = false; setBusy(false); }
  };
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState(initialCamera); const cameraRef = useRef(camera);
  const [reducedMotion, setReducedMotion] = useState(false); const reduced = useRef(false); const frame = useRef(0);
  const previous = useRef<{ x: number; y: number; distance: number; time: number; velocity: number } | null>(null);
  const update = (next: Camera) => { cameraRef.current = next; setCamera(next); };
  const [walking, setWalking] = useState(false); const [walkBlend, setWalkBlend] = useState(0); const zoomFrame = useRef(0);
  const [walker, setWalker] = useState(initialWalker); const walkerRef = useRef(walker); const [blocked, setBlocked] = useState(false);
  const stick = useRef<number | null>(null); const world = useRef({ walking, scale: 1, placements: [] as readonly Placement[] });
  const stride = (direction: number, distance: number) => {
    const next = walk(walkerRef.current, direction, distance, world.current.scale, world.current.placements);
    setBlocked(next.frame === walkerRef.current.frame); walkerRef.current = next; setWalker(next);
  };
  const toggleWalk = () => {
    const next = !walking; setWalking(next); setBlocked(false); stick.current = null; cancelAnimationFrame(frame.current); cancelAnimationFrame(zoomFrame.current);
    const target = next ? 1 : 0; if (reduced.current) { setWalkBlend(target); return; }
    let last = Date.now(); const end = last + 600;
    const zoom = () => {
      const nowMs = Date.now(); const step = (nowMs - last) / 600; last = nowMs;
      if (nowMs >= end) { setWalkBlend(target); return; }
      setWalkBlend((value) => Math.max(0, Math.min(1, value + (next ? step : -step)))); zoomFrame.current = requestAnimationFrame(zoom);
    };
    zoomFrame.current = requestAnimationFrame(zoom);
  };
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { reduced.current = value; setReducedMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => { reduced.current = value; setReducedMotion(value); });
    return () => { subscription.remove(); cancelAnimationFrame(frame.current); cancelAnimationFrame(zoomFrame.current); };
  }, []);
  useEffect(() => { if (!active) cancelAnimationFrame(frame.current); }, [active]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: () => { cancelAnimationFrame(frame.current); previous.current = null; },
    onPanResponderMove: (event, gesture) => {
      if (world.current.walking) {
        // The drag is a joystick: its direction from the touch start steers, and the walk lasts until the finger lifts.
        if (Math.hypot(gesture.dx, gesture.dy) <= 12) return;
        const resting = stick.current === null; stick.current = Math.atan2(gesture.dx, -gesture.dy); if (!resting) return;
        let last = Date.now();
        const stroll = () => { if (stick.current === null) return; const nowMs = Date.now(); stride(stick.current, walkSpeed * Math.min(1000, nowMs - last) / 1000); last = nowMs; frame.current = requestAnimationFrame(stroll); };
        frame.current = requestAnimationFrame(stroll); return;
      }
      const touches = event.nativeEvent.touches; const first = touches[0]; if (!first) return;
      const second = touches[1]; const distance = second ? Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY) : 0;
      const nowMs = Date.now(); const last = previous.current;
      let velocity = 0;
      if (last && !!distance === !!last.distance) {
        if (distance && last.distance) update(pinch(cameraRef.current, distance / last.distance));
        else { const dx = first.pageX - last.x; update(drag(cameraRef.current, dx, first.pageY - last.y)); velocity = dx / Math.max(1, nowMs - last.time); }
      }
      previous.current = { x: first.pageX, y: first.pageY, distance, time: nowMs, velocity };
    },
    onPanResponderRelease: () => {
      stick.current = null; if (world.current.walking) return;
      const start = Date.now(); const velocity = previous.current && start - previous.current.time < 100 ? previous.current.velocity : 0; let last = start;
      const animate = () => { const nowMs = Date.now(); const speed = inertia(velocity, nowMs - start, reduced.current); if (!speed) return; update(drag(cameraRef.current, speed * (nowMs - last), 0)); last = nowMs; frame.current = requestAnimationFrame(animate); };
      frame.current = requestAnimationFrame(animate); previous.current = null;
    },
    onPanResponderTerminate: () => { stick.current = null; previous.current = null; },
  }), []);
  const count = dayCount(anniversary, now, timeZone); const timeOfDay = roomVariant('follow_time', now, timeZone);
  // shortcut: replace the development entitlement with a server-verified purchase before release.
  const earned = planetLevel(count.ok ? Math.max(0, count.dayCount - 1) : 0, devEntitlement ? [4] : []);
  const growth = planetLevel(0, [earned.level, data?.maxLevel ?? 1]);
  world.current = { walking, scale: growth.scale, placements: data?.placements ?? [] };
  useEffect(() => { if (data && !busy && message !== 'planet.storageError' && earned.level > data.maxLevel) void save({ ...data, maxLevel: earned.level }); }, [data, earned.level, busy, message]);
  const rendered = useMemo(() => asset ? (data?.placements ?? []).map((item) => ({ ...item, content: <primitive object={asset.clone()} /> })) : [], [asset, data]);
  const addObject = async () => {
    if (!data || !asset) return;
    const positions = [...Array.from({ length: 6 }, (_, i) => ({ latitude: 0, longitude: i * 60 - 180 })), ...Array.from({ length: 4 }, (_, i) => ({ latitude: -55, longitude: i * 90 - 180 }))];
    if (data.placements.length >= growth.capacity) { setMessage('planet.capacity'); return; }
    const id = `${Date.now()}-${data.placements.length}`;
    const candidate = positions.map((position): Placement => ({ ...position, id, heading: 0, radius: 0.31 })).find((item) => canPlace(data.placements, item, growth.capacity, growth.scale, walkerCoordinates(walkerRef.current)) === 'ok');
    if (!candidate) { setMessage('planet.noSpace'); return; }
    if (await save({ maxLevel: growth.level, placements: [...data.placements, candidate] })) setMessage('');
  };
  const backgroundColor = timeOfDay === 'day' ? themes.potato.sky[0] : '#1E1B3A';
  const sky = timeOfDay === 'day' ? themes.potato.sky : ['#1E1B3A', '#3A3260'];
  const notice = walking && blocked ? 'planet.walkBlocked' : message;
  return <View style={{ flex: 1, backgroundColor }} onLayout={(event) => setSize(event.nativeEvent.layout)}>
    <BackgroundCanvas pointerEvents="none" style={{ position: 'absolute', inset: 0 }}><Rect x={0} y={0} width={size.width} height={size.height}><LinearGradient start={vec(0, 0)} end={vec(0, size.height)} colors={sky} /></Rect></BackgroundCanvas>
    <View style={{ position: 'absolute', left: 20, top: insets.top + 16, zIndex: 1, borderRadius: 30, padding: 14, backgroundColor: timeOfDay === 'day' ? '#FFFAF2' : '#2E2942' }}>
      <Text style={{ ...type('title'), color: timeOfDay === 'day' ? '#3F2D22' : '#F7EBDD' }}>{t('planet.days', { n: count.ok ? count.dayCount : 0 })}</Text>
    </View>
    <View style={{ flex: 1 }} accessible accessibilityLabel={t('planet.a11y', { n: data?.placements.length ?? 0 })} accessibilityActions={walking ? Object.keys(walkActions).map((name) => ({ name, label: t(`planet.${name}`) })) : [{ name: 'increment', label: t('planet.right') }, { name: 'decrement', label: t('planet.left') }, { name: 'zoomIn', label: t('planet.zoomIn') }, { name: 'zoomOut', label: t('planet.zoomOut') }]} onAccessibilityAction={(event) => { const action = event.nativeEvent.actionName; if (action in walkActions) stride(walkActions[action as keyof typeof walkActions], 0.3); else if (action === 'increment' || action === 'decrement') update(drag(cameraRef.current, action === 'increment' ? 30 : -30, 0)); else if (action === 'zoomIn' || action === 'zoomOut') update(pinch(cameraRef.current, action === 'zoomIn' ? 1.2 : 1 / 1.2)); }} {...responder.panHandlers}>
      {active && <PlanetScene scene={{ theme: themes.potato, timeOfDay, camera }} reducedMotion={reducedMotion} scale={growth.scale} placements={rendered} walker={walker} walkBlend={walkBlend} />}
    </View>
    {V1_FEATURES.planet && <Pressable accessibilityRole="switch" accessibilityState={{ checked: devEntitlement }} onPress={() => setDevEntitlement((value) => !value)} style={{ position: 'absolute', right: 20, top: insets.top + 16, padding: 12, backgroundColor: '#FFFAF2', borderRadius: 20 }}><Text>{t('planet.devEntitlement', { level: growth.level })}</Text></Pressable>}
    <View style={{ position: 'absolute', alignSelf: 'center', bottom: clearance + 42, alignItems: 'center', gap: 8 }}>
      <Pressable accessibilityRole="button" onPress={toggleWalk} style={{ padding: 12, borderRadius: 20, backgroundColor: '#FFFAF2' }}><Text>{t(walking ? 'planet.overview' : 'planet.walk')}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={!data || !asset || busy} onPress={() => void addObject()} style={{ padding: 12, borderRadius: 20, backgroundColor: '#FFFAF2' }}><Text>{t('planet.devPlace')}</Text></Pressable>
      {!!notice && <Text accessibilityLiveRegion="polite" style={{ color: timeOfDay === 'day' ? '#3F2D22' : '#F7EBDD' }}>{t(notice)}</Text>}
    </View>
    <Text style={{ position: 'absolute', alignSelf: 'center', bottom: clearance + 16, color: timeOfDay === 'day' ? '#3F2D22' : '#F7EBDD' }}>{t(walking ? 'planet.walkHint' : 'planet.hint')}</Text>
  </View>;
}
