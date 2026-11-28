import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Image, KeyboardAvoidingView, PanResponder, Platform, Pressable, Text, View } from 'react-native';
import { Canvas as BackgroundCanvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useType } from '../../theme/typography';
import { V1_FEATURES } from '../../config/features';
import { Button, TextField, useTabBarClearance } from '../../ui/components';
import { useLoopActive } from '../../ui/motion';
import { dayCount } from '../../lib/dday';
import { roomVariant } from '../settings/followTime';
import { drag, face, inertia, initialCamera, pinch, themes, type Camera } from './model';
import { PlanetScene } from './PlanetScene';
import { fitObject, planetLevel } from './level';
import { canPlace, spots, type Placement } from './placement';
import { readPlanet, writePlanet, type PlanetData } from './planetStorage';
import { demoAsset } from './demoAsset';
import { disposePlanetAsset, loadPlanetAsset } from './planetAsset';
import type { Object3D } from 'three';
import { SampleObject } from './SampleObject';
import { fakeGenerator, type GenerationInput, type GenerationJob } from './generator';
import { pickRegion } from './photo';
import { initialWalker, walk, walkerCoordinates, walkSpeed } from './walk';

const generator = fakeGenerator();
type Spot = Placement | 'planet.capacity' | 'planet.noSpace' | 'planet.failed';
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
  const [creating, setCreating] = useState(false); const [prompt, setPrompt] = useState(''); const [photo, setPhoto] = useState<string | null>(null);
  const [job, setJob] = useState<GenerationJob | null>(null); const [panelHeight, setPanelHeight] = useState(0); const [pillBottom, setPillBottom] = useState(0);
  useEffect(() => {
    if (!job || (job.state !== 'queued' && job.state !== 'running')) return;
    const timer = setTimeout(() => setJob((current) => current ? generator.poll(current) : current), 1000);
    return () => clearTimeout(timer);
  }, [job]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState(initialCamera); const cameraRef = useRef(camera);
  const [poke, setPoke] = useState({ x: 0, y: 0, n: 0 });
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
    onPanResponderRelease: (event, gesture) => {
      stick.current = null;
      // A touch that did not move is a tap; Aroomi reacts when it lands on it.
      if (Math.abs(gesture.dx) < 8 && Math.abs(gesture.dy) < 8) { const { locationX, locationY } = event.nativeEvent; setPoke((last) => ({ x: locationX, y: locationY, n: last.n + 1 })); }
      if (world.current.walking) return;
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
  const spotFor = (object: Pick<Placement, 'radius' | 'assetId' | 'scale'>, placements: readonly Placement[]): Spot => {
    if (placements.length >= growth.capacity) return 'planet.capacity';
    const id = `${Date.now()}-${placements.length}`;
    return spots.map((position): Placement => ({ ...position, ...object, id, heading: 0 })).find((item) => canPlace(placements, item, growth.capacity, growth.scale, walkerCoordinates(walkerRef.current)) === 'ok') ?? 'planet.noSpace';
  };
  const preview = useMemo(() => {
    if (!data || job?.state !== 'succeeded') return null;
    const fit = fitObject(job.boundingRadius, growth.maxObject);
    return fit ? spotFor({ ...fit, assetId: job.assetId }, data.placements) : 'planet.failed';
  }, [data, job, growth.level]);
  useEffect(() => { if (preview && typeof preview !== 'string') update(face(cameraRef.current, preview.latitude, preview.longitude)); }, [job]);
  // shortcut: the fake generator only makes the sample tree; render inventory assets by id once they exist.
  const rendered = useMemo(() => [...(data?.placements ?? []), ...(preview && typeof preview !== 'string' ? [preview] : [])].flatMap((item) => item.assetId === 'sample-tree' ? [{ ...item, content: <group scale={item.scale ?? 1}><SampleObject /></group> }] : asset ? [{ ...item, content: <primitive object={asset.clone()} /> }] : []), [asset, data, preview]);
  const place = async (spot: Spot) => {
    if (!data) return false;
    if (typeof spot === 'string') { setMessage(spot); return false; }
    const saved = await save({ maxLevel: growth.level, placements: [...data.placements, spot] });
    if (saved) setMessage('');
    return saved;
  };
  const closeCreate = () => { setCreating(false); setJob(null); setPhoto(null); setMessage(''); };
  const submit = (input: GenerationInput) => { setMessage(''); setJob(generator.submit(input)); };
  const choosePhoto = async (source: 'camera' | 'library') => {
    try {
      const picked = await pickRegion(source);
      if (picked === 'denied') setMessage('planet.photoDenied');
      else if (picked !== 'cancelled') { setPhoto(picked.uri); setMessage(''); }
    } catch { setMessage('planet.photoError'); }
  };
  const backgroundColor = timeOfDay === 'day' ? themes.potato.sky[0] : '#1E1B3A';
  const sky = timeOfDay === 'day' ? themes.potato.sky : ['#1E1B3A', '#3A3260'];
  const notice = walking && blocked ? 'planet.walkBlocked' : message || (walking ? 'planet.walkHint' : '');
  return <View style={{ flex: 1, backgroundColor }} onLayout={(event) => setSize(event.nativeEvent.layout)}>
    <BackgroundCanvas pointerEvents="none" style={{ position: 'absolute', inset: 0 }}><Rect x={0} y={0} width={size.width} height={size.height}><LinearGradient start={vec(0, 0)} end={vec(0, size.height)} colors={sky} /></Rect></BackgroundCanvas>
    <View onLayout={(event) => setPillBottom(event.nativeEvent.layout.y + event.nativeEvent.layout.height)} style={{ position: 'absolute', left: 20, top: insets.top + 16, zIndex: 1, borderRadius: 30, padding: 14, backgroundColor: timeOfDay === 'day' ? '#FFFAF2' : '#2E2942' }}>
      <Text style={{ ...type('title'), color: timeOfDay === 'day' ? '#3F2D22' : '#F7EBDD' }}>{t('planet.days', { n: count.ok ? count.dayCount : 0 })}</Text>
    </View>
    {/* The create panel covers the lower screen, so the planet moves to the middle of the area left between it and the day count. */}
    <View style={{ flex: 1, transform: [{ translateY: creating ? (pillBottom - panelHeight - clearance) / 2 : 0 }] }} accessible accessibilityLabel={t('planet.a11y', { n: data?.placements.length ?? 0 })} accessibilityActions={walking ? Object.keys(walkActions).map((name) => ({ name, label: t(`planet.${name}`) })) : [{ name: 'increment', label: t('planet.right') }, { name: 'decrement', label: t('planet.left') }, { name: 'zoomIn', label: t('planet.zoomIn') }, { name: 'zoomOut', label: t('planet.zoomOut') }]} onAccessibilityAction={(event) => { const action = event.nativeEvent.actionName; if (action in walkActions) stride(walkActions[action as keyof typeof walkActions], 0.3); else if (action === 'increment' || action === 'decrement') update(drag(cameraRef.current, action === 'increment' ? 30 : -30, 0)); else if (action === 'zoomIn' || action === 'zoomOut') update(pinch(cameraRef.current, action === 'zoomIn' ? 1.2 : 1 / 1.2)); }} {...responder.panHandlers}>
      {active && <PlanetScene scene={{ theme: themes.potato, timeOfDay, camera }} reducedMotion={reducedMotion} scale={growth.scale} placements={rendered} walker={walker} walkBlend={walkBlend} poke={poke} />}
    </View>
    {V1_FEATURES.planet && <Pressable accessibilityRole="switch" accessibilityState={{ checked: devEntitlement }} onPress={() => setDevEntitlement((value) => !value)} style={{ position: 'absolute', right: 20, top: insets.top + 16, padding: 12, backgroundColor: '#FFFAF2', borderRadius: 20 }}><Text>{t('planet.devEntitlement', { level: growth.level })}</Text></Pressable>}
    {!creating && <View style={{ position: 'absolute', alignSelf: 'center', bottom: clearance + 12, alignItems: 'center', gap: 8 }}>
      <Pressable accessibilityRole="button" onPress={toggleWalk} style={{ padding: 12, borderRadius: 20, backgroundColor: '#FFFAF2' }}><Text>{t(walking ? 'planet.overview' : 'planet.walk')}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={!data || !asset || busy} onPress={() => { if (data) void place(spotFor({ radius: 0.31 }, data.placements)); }} style={{ padding: 12, borderRadius: 20, backgroundColor: '#FFFAF2' }}><Text>{t('planet.devPlace')}</Text></Pressable>
      <Button label={t('planet.create')} disabled={!data} onPress={() => { if (data && data.placements.length >= growth.capacity) { setMessage('planet.capacity'); return; } setMessage(''); setCreating(true); setJob(null); if (walking) toggleWalk(); }} />
      {/* In the walk view this line lies on the planet, whose colours do not change at night. */}
      {!!notice && <Text accessibilityLiveRegion="polite" style={{ color: timeOfDay === 'day' || walking ? '#3F2D22' : '#F7EBDD' }}>{t(notice)}</Text>}
    </View>}
    {creating && <KeyboardAvoidingView onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)} behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', bottom: clearance, left: 12, right: 12 }}>
      <View style={{ backgroundColor: '#FFFAF2', borderRadius: 20, padding: 16, gap: 8 }}>
        <Text>{t('planet.sampleNotice')}</Text>
        {!job && <><TextField label={t('planet.createPrompt')} value={prompt} onChangeText={setPrompt} maxLength={300} multiline />
          <Button label={t('planet.createSend')} disabled={!prompt.trim()} onPress={() => submit({ kind: 'text', prompt })} />
          <View style={{ flexDirection: 'row', gap: 8 }}><Button compact variant="secondary" label={t('planet.photoTake')} onPress={() => void choosePhoto('camera')} /><Button compact variant="secondary" label={t('planet.photoPick')} onPress={() => void choosePhoto('library')} /></View>
          {!!photo && <><Image accessibilityLabel={t('planet.photoRegion')} source={{ uri: photo }} style={{ width: 96, height: 96, borderRadius: 12, alignSelf: 'center' }} />
            <Button label={t('planet.photoSend')} onPress={() => submit({ kind: 'photo', croppedRegionUri: photo })} /></>}</>}
        {job && (job.state === 'queued' || job.state === 'running') && <><Text accessibilityLiveRegion="polite">{t(job.state === 'queued' ? 'planet.queued' : 'planet.running')}</Text><Button variant="secondary" label={t('common.cancel')} onPress={() => setJob(generator.cancel(job))} /></>}
        {job?.state === 'succeeded' && preview && (typeof preview === 'string' ? <Text accessibilityLiveRegion="polite">{t(preview)}</Text> : <><Text>{t('planet.preview')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><Button compact variant="secondary" label={t('planet.left')} onPress={() => update(drag(cameraRef.current, -30, 0))} /><Button compact variant="secondary" label={t('planet.right')} onPress={() => update(drag(cameraRef.current, 30, 0))} /></View>
          <Button label={t('planet.place')} disabled={busy} onPress={() => void place(preview).then((saved) => { if (saved) { closeCreate(); setPrompt(''); } })} />
          <Button variant="secondary" label={t('planet.regenerate')} onPress={() => setJob(null)} /></>)}
        {job && ['failed', 'rejected', 'cancelled'].includes(job.state) && <><Text accessibilityLiveRegion="polite">{t(job.state === 'failed' ? 'planet.failed' : job.state === 'rejected' ? 'planet.rejected' : 'planet.cancelled')}</Text><Button label={t('common.retry')} onPress={() => setJob(null)} /></>}
        {!!message && <Text accessibilityLiveRegion="polite">{t(message)}</Text>}
        <Button variant="ghost" label={t('common.close')} onPress={closeCreate} />
      </View>
    </KeyboardAvoidingView>}
  </View>;
}
