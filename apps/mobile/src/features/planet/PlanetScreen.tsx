import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, PanResponder, Platform, Text, View } from 'react-native';
import { Canvas as BackgroundCanvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useType } from '../../theme/typography';
import { Button, TextField, useTabBarClearance } from '../../ui/components';
import { useLoopActive } from '../../ui/motion';
import { dayCount } from '../../lib/dday';
import { roomVariant } from '../settings/followTime';
import { drag, inertia, initialCamera, pinch, themes, type Camera } from './model';
import { PlanetScene } from './PlanetScene';
import { SurfaceAnchor } from './SurfaceAnchor';
import { SampleObject } from './SampleObject';
import { fakeGenerator, type GenerationJob } from './generator';

const generator = fakeGenerator();

export function PlanetScreen({ anniversary, timeZone, now }: { anniversary: string; timeZone: string; now: string }) {
  const { t } = useTranslation(); const { type } = useType(); const insets = useSafeAreaInsets(); const clearance = useTabBarClearance();
  const active = useLoopActive();
  const [creating, setCreating] = useState(false); const [prompt, setPrompt] = useState('');
  const [job, setJob] = useState<GenerationJob | null>(null); const [placed, setPlaced] = useState(false);
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
  const backgroundColor = timeOfDay === 'day' ? themes.potato.sky[0] : '#1E1B3A';
  const sky = timeOfDay === 'day' ? themes.potato.sky : ['#1E1B3A', '#3A3260'];
  return <View style={{ flex: 1, backgroundColor }} onLayout={(event) => setSize(event.nativeEvent.layout)}>
    <BackgroundCanvas pointerEvents="none" style={{ position: 'absolute', inset: 0 }}><Rect x={0} y={0} width={size.width} height={size.height}><LinearGradient start={vec(0, 0)} end={vec(0, size.height)} colors={sky} /></Rect></BackgroundCanvas>
    <View style={{ position: 'absolute', left: 20, top: insets.top + 16, zIndex: 1, borderRadius: 30, padding: 14, backgroundColor: timeOfDay === 'day' ? '#FFFAF2' : '#2E2942' }}>
      <Text style={{ ...type('title'), color: timeOfDay === 'day' ? '#3F2D22' : '#F7EBDD' }}>{t('planet.days', { n: count.ok ? count.dayCount : 0 })}</Text>
    </View>
    <View style={{ flex: 1 }} accessible accessibilityLabel={placed ? t('planet.a11yOne') : t('planet.a11y')} accessibilityActions={[{ name: 'increment', label: t('planet.right') }, { name: 'decrement', label: t('planet.left') }, { name: 'zoomIn', label: t('planet.zoomIn') }, { name: 'zoomOut', label: t('planet.zoomOut') }]} onAccessibilityAction={(event) => { const action = event.nativeEvent.actionName; if (action === 'increment' || action === 'decrement') update(drag(cameraRef.current, action === 'increment' ? 30 : -30, 0)); else if (action === 'zoomIn' || action === 'zoomOut') update(pinch(cameraRef.current, action === 'zoomIn' ? 1.2 : 1 / 1.2)); }} {...responder.panHandlers}>
      {active && <PlanetScene scene={{ theme: themes.potato, timeOfDay, camera }} reducedMotion={reducedMotion} objects={(placed || (creating && job?.state === 'succeeded')) ? <SurfaceAnchor latitude={62} longitude={-38}><SampleObject /></SurfaceAnchor> : undefined} />}
    </View>
    {!creating && <View style={{ position: 'absolute', alignSelf: 'center', bottom: clearance + 12, gap: 4 }}>
      <Text style={{ color: timeOfDay === 'day' ? '#3F2D22' : '#F7EBDD', textAlign: 'center' }}>{t('planet.hint')}</Text>
      <Button label={t('planet.create')} onPress={() => { setCreating(true); setJob(null); }} />
    </View>}
    {creating && <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', bottom: clearance, left: 12, right: 12 }}>
      <View style={{ backgroundColor: '#FFFAF2', borderRadius: 20, padding: 16, gap: 8 }}>
        <Text>{t('planet.sampleNotice')}</Text>
        {!job && <><TextField label={t('planet.createPrompt')} value={prompt} onChangeText={setPrompt} maxLength={300} multiline />
          <Button label={t('planet.createSend')} disabled={!prompt.trim()} onPress={() => setJob(generator.submit(prompt))} /></>}
        {job && (job.state === 'queued' || job.state === 'running') && <><Text accessibilityLiveRegion="polite">{t(job.state === 'queued' ? 'planet.queued' : 'planet.running')}</Text><Button variant="secondary" label={t('common.cancel')} onPress={() => setJob(generator.cancel(job))} /></>}
        {job?.state === 'succeeded' && <><Text>{t('planet.preview')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><Button compact variant="secondary" label={t('planet.left')} onPress={() => update(drag(cameraRef.current, -30, 0))} /><Button compact variant="secondary" label={t('planet.right')} onPress={() => update(drag(cameraRef.current, 30, 0))} /></View>
          <Button label={t('planet.place')} onPress={() => { setPlaced(true); setCreating(false); setJob(null); }} />
          <Button variant="secondary" label={t('planet.regenerate')} onPress={() => setJob(null)} /></>}
        {job && ['failed', 'rejected', 'cancelled'].includes(job.state) && <><Text accessibilityLiveRegion="polite">{t(job.state === 'failed' ? 'planet.failed' : job.state === 'rejected' ? 'planet.rejected' : 'planet.cancelled')}</Text><Button label={t('common.retry')} onPress={() => setJob(null)} /></>}
        <Button variant="ghost" label={t('common.close')} onPress={() => { setCreating(false); setJob(null); }} />
      </View>
    </KeyboardAvoidingView>}

  </View>;
}
