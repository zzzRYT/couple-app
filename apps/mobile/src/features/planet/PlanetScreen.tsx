import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, PanResponder, Platform, Pressable, Text, View } from 'react-native';
import { Canvas as BackgroundCanvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useType } from '../../theme/typography';
import { V1_FEATURES } from '../../config/features';
import { Button, TextField, useTabBarClearance } from '../../ui/components';
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
import { SampleObject } from './SampleObject';
import { fakeGenerator, type GenerationJob } from './generator';

const generator = fakeGenerator();
const positions = [...Array.from({ length: 6 }, (_, i) => ({ latitude: 0, longitude: i * 60 - 180 })), ...Array.from({ length: 4 }, (_, i) => ({ latitude: -55, longitude: i * 90 - 180 }))];
type Spot = Placement | 'planet.capacity' | 'planet.noSpace';

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
  const [creating, setCreating] = useState(false); const [prompt, setPrompt] = useState('');
  const [job, setJob] = useState<GenerationJob | null>(null);
  useEffect(() => {
    if (!job || (job.state !== 'queued' && job.state !== 'running')) return;
    const timer = setTimeout(() => setJob((current) => current ? generator.poll(current) : current), 1000);
    return () => clearTimeout(timer);
  }, [job]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState(initialCamera); const cameraRef = useRef(camera);
  const [reducedMotion, setReducedMotion] = useState(false); const reduced = useRef(false); const frame = useRef(0);
  const previous = useRef<{ x: number; y: number; distance: number; time: number; velocity: number } | null>(null);
  const update = (next: Camera) => { cameraRef.current = next; setCamera(next); };
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { reduced.current = value; setReducedMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => { reduced.current = value; setReducedMotion(value); });
    return () => { subscription.remove(); cancelAnimationFrame(frame.current); };
  }, []);
  useEffect(() => { if (!active) cancelAnimationFrame(frame.current); }, [active]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: () => { cancelAnimationFrame(frame.current); previous.current = null; },
    onPanResponderMove: (event) => {
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
      const start = Date.now(); const velocity = previous.current && start - previous.current.time < 100 ? previous.current.velocity : 0; let last = start;
      const animate = () => { const nowMs = Date.now(); const speed = inertia(velocity, nowMs - start, reduced.current); if (!speed) return; update(drag(cameraRef.current, speed * (nowMs - last), 0)); last = nowMs; frame.current = requestAnimationFrame(animate); };
      frame.current = requestAnimationFrame(animate); previous.current = null;
    },
    onPanResponderTerminate: () => { previous.current = null; },
  }), []);
  const count = dayCount(anniversary, now, timeZone); const timeOfDay = roomVariant('follow_time', now, timeZone);
  // shortcut: replace the development entitlement with a server-verified purchase before release.
  const earned = planetLevel(count.ok ? Math.max(0, count.dayCount - 1) : 0, devEntitlement ? [4] : []);
  const growth = planetLevel(0, [earned.level, data?.maxLevel ?? 1]);
  useEffect(() => { if (data && !busy && message !== 'planet.storageError' && earned.level > data.maxLevel) void save({ ...data, maxLevel: earned.level }); }, [data, earned.level, busy, message]);
  const spotFor = (object: Pick<Placement, 'radius' | 'assetId'>, placements: readonly Placement[]): Spot => {
    if (placements.length >= growth.capacity) return 'planet.capacity';
    const id = `${Date.now()}-${placements.length}`;
    return positions.map((position): Placement => ({ ...position, ...object, id, heading: 0 })).find((item) => canPlace(placements, item, growth.capacity, growth.scale) === 'ok') ?? 'planet.noSpace';
  };
  const preview = useMemo(() => data && job?.state === 'succeeded' ? spotFor({ radius: 0.31, assetId: job.assetId }, data.placements) : null, [data, job, growth.level]);
  // shortcut: the fake generator only makes the sample tree; render inventory assets by id once they exist.
  const rendered = useMemo(() => [...(data?.placements ?? []), ...(preview && typeof preview !== 'string' ? [preview] : [])].flatMap((item) => item.assetId === 'sample-tree' ? [{ ...item, content: <SampleObject /> }] : asset ? [{ ...item, content: <primitive object={asset.clone()} /> }] : []), [asset, data, preview]);
  const place = async (spot: Spot) => {
    if (!data) return false;
    if (typeof spot === 'string') { setMessage(spot); return false; }
    const saved = await save({ maxLevel: growth.level, placements: [...data.placements, spot] });
    if (saved) setMessage('');
    return saved;
  };
  const closeCreate = () => { setCreating(false); setJob(null); };
  const backgroundColor = timeOfDay === 'day' ? themes.potato.sky[0] : '#1E1B3A';
  const sky = timeOfDay === 'day' ? themes.potato.sky : ['#1E1B3A', '#3A3260'];
  return <View style={{ flex: 1, backgroundColor }} onLayout={(event) => setSize(event.nativeEvent.layout)}>
    <BackgroundCanvas pointerEvents="none" style={{ position: 'absolute', inset: 0 }}><Rect x={0} y={0} width={size.width} height={size.height}><LinearGradient start={vec(0, 0)} end={vec(0, size.height)} colors={sky} /></Rect></BackgroundCanvas>
    <View style={{ position: 'absolute', left: 20, top: insets.top + 16, zIndex: 1, borderRadius: 30, padding: 14, backgroundColor: timeOfDay === 'day' ? '#FFFAF2' : '#2E2942' }}>
      <Text style={{ ...type('title'), color: timeOfDay === 'day' ? '#3F2D22' : '#F7EBDD' }}>{t('planet.days', { n: count.ok ? count.dayCount : 0 })}</Text>
    </View>
    <View style={{ flex: 1 }} accessible accessibilityLabel={t('planet.a11y', { n: data?.placements.length ?? 0 })} accessibilityActions={[{ name: 'increment', label: t('planet.right') }, { name: 'decrement', label: t('planet.left') }, { name: 'zoomIn', label: t('planet.zoomIn') }, { name: 'zoomOut', label: t('planet.zoomOut') }]} onAccessibilityAction={(event) => { const action = event.nativeEvent.actionName; if (action === 'increment' || action === 'decrement') update(drag(cameraRef.current, action === 'increment' ? 30 : -30, 0)); else if (action === 'zoomIn' || action === 'zoomOut') update(pinch(cameraRef.current, action === 'zoomIn' ? 1.2 : 1 / 1.2)); }} {...responder.panHandlers}>
      {active && <PlanetScene scene={{ theme: themes.potato, timeOfDay, camera }} reducedMotion={reducedMotion} scale={growth.scale} placements={rendered} />}
    </View>
    {V1_FEATURES.planet && <Pressable accessibilityRole="switch" accessibilityState={{ checked: devEntitlement }} onPress={() => setDevEntitlement((value) => !value)} style={{ position: 'absolute', right: 20, top: insets.top + 16, padding: 12, backgroundColor: '#FFFAF2', borderRadius: 20 }}><Text>{t('planet.devEntitlement', { level: growth.level })}</Text></Pressable>}
    {!creating && <View style={{ position: 'absolute', alignSelf: 'center', bottom: clearance + 12, alignItems: 'center', gap: 8 }}>
      <Pressable accessibilityRole="button" disabled={!data || !asset || busy} onPress={() => { if (data) void place(spotFor({ radius: 0.31 }, data.placements)); }} style={{ padding: 12, borderRadius: 20, backgroundColor: '#FFFAF2' }}><Text>{t('planet.devPlace')}</Text></Pressable>
      <Button label={t('planet.create')} disabled={!data} onPress={() => { if (data && data.placements.length >= growth.capacity) { setMessage('planet.capacity'); return; } setMessage(''); setCreating(true); setJob(null); }} />
      {!!message && <Text accessibilityLiveRegion="polite" style={{ color: timeOfDay === 'day' ? '#3F2D22' : '#F7EBDD' }}>{t(message)}</Text>}
    </View>}
    {creating && <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', bottom: clearance, left: 12, right: 12 }}>
      <View style={{ backgroundColor: '#FFFAF2', borderRadius: 20, padding: 16, gap: 8 }}>
        <Text>{t('planet.sampleNotice')}</Text>
        {!job && <><TextField label={t('planet.createPrompt')} value={prompt} onChangeText={setPrompt} maxLength={300} multiline />
          <Button label={t('planet.createSend')} disabled={!prompt.trim()} onPress={() => setJob(generator.submit(prompt))} /></>}
        {job && (job.state === 'queued' || job.state === 'running') && <><Text accessibilityLiveRegion="polite">{t(job.state === 'queued' ? 'planet.queued' : 'planet.running')}</Text><Button variant="secondary" label={t('common.cancel')} onPress={() => setJob(generator.cancel(job))} /></>}
        {job?.state === 'succeeded' && preview && (typeof preview === 'string' ? <Text accessibilityLiveRegion="polite">{t(preview)}</Text> : <><Text>{t('planet.preview')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><Button compact variant="secondary" label={t('planet.left')} onPress={() => update(drag(cameraRef.current, -30, 0))} /><Button compact variant="secondary" label={t('planet.right')} onPress={() => update(drag(cameraRef.current, 30, 0))} /></View>
          <Button label={t('planet.place')} disabled={busy} onPress={() => void place(preview).then((saved) => { if (saved) { closeCreate(); setPrompt(''); } })} />
          <Button variant="secondary" label={t('planet.regenerate')} onPress={() => setJob(null)} />
          {!!message && <Text accessibilityLiveRegion="polite">{t(message)}</Text>}</>)}
        {job && ['failed', 'rejected', 'cancelled'].includes(job.state) && <><Text accessibilityLiveRegion="polite">{t(job.state === 'failed' ? 'planet.failed' : job.state === 'rejected' ? 'planet.rejected' : 'planet.cancelled')}</Text><Button label={t('common.retry')} onPress={() => setJob(null)} /></>}
        <Button variant="ghost" label={t('common.close')} onPress={closeCreate} />
      </View>
    </KeyboardAvoidingView>}
  </View>;
}
