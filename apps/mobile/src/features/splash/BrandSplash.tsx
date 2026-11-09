import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SPLASH } from '../../config/splash';
import { useReducedMotion } from '../../ui/motion';
import { FLOAT_LIFT, FLOAT_MS } from '../../ui/Spot';

const image = require('../../../assets/icon/splash-icon.png');
/** V0-12: seen at least this long once it appears, then a short fade; reduced motion fades only, a little faster. */
export const SPLASH_MIN_MS = 800;
export const SPLASH_EXIT_MS = 250;
export const SPLASH_EXIT_REDUCED_MS = 150;
const EXIT_SCALE = 1.04;
type Phase = 'shown' | 'leaving' | 'gone';
type Props = { holding: boolean; replay?: number; scheme: 'light' | 'dark'; label?: string; onDrawn?: () => void };

/**
 * V0-12: Aroomi on the app ground, where the native launch screen draws it. It stays while `holding` (the app is not
 * ready), and at least SPLASH_MIN_MS from when it appeared, then fades out. Each new `replay` count shows it once more.
 * The ground keeps the scheme it appeared with, so a display setting read meanwhile never recolours it mid-way.
 */
export function BrandSplash({ holding, replay = 0, scheme, label, onDrawn }: Props) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('shown');
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [ground, setGround] = useState(scheme);
  const latest = useRef(scheme);
  latest.current = scheme;
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const show = useCallback(() => {
    cancelAnimation(opacity); cancelAnimation(scale);
    opacity.value = 1; scale.value = 1;
    setShownAt(Date.now());
    setGround(latest.current);
    setPhase('shown');
  }, [opacity, scale]);
  useEffect(() => { if (holding) show(); }, [holding, show]);
  useEffect(() => { if (replay > 0) show(); }, [replay, show]);
  const exitMs = reduced ? SPLASH_EXIT_REDUCED_MS : SPLASH_EXIT_MS;
  useEffect(() => {
    if (holding || phase !== 'shown') return;
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: exitMs, easing: Easing.inOut(Easing.ease) });
      if (!reduced) scale.value = withTiming(EXIT_SCALE, { duration: exitMs, easing: Easing.inOut(Easing.ease) });
      setPhase('leaving');
    }, Math.max(0, SPLASH_MIN_MS - (Date.now() - shownAt)));
    return () => clearTimeout(timer);
  }, [holding, phase, shownAt, reduced, exitMs, opacity, scale]);
  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = setTimeout(() => setPhase('gone'), exitMs);
    return () => clearTimeout(timer);
  }, [phase, exitMs]);
  // The same 6pt float as Spot (interaction-notes.md §10.1) while it waits; still with reduced motion.
  const visible = phase !== 'gone';
  useEffect(() => {
    if (reduced || !visible) { cancelAnimation(lift); lift.value = 0; return; }
    lift.value = withRepeat(withTiming(-FLOAT_LIFT, { duration: FLOAT_MS, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(lift);
  }, [lift, reduced, visible]);
  const groundStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const imageStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }, { scale: scale.value }] }));
  if (!visible) return null;
  return (
    <Animated.View testID="brand-splash" accessible accessibilityLabel={label} accessibilityViewIsModal pointerEvents={phase === 'leaving' ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, { zIndex: 1000, alignItems: 'center', justifyContent: 'center', backgroundColor: SPLASH.background[ground] }, groundStyle]}>
      <Animated.Image testID="brand-splash-image" source={image} onLoad={onDrawn} resizeMode="contain" style={[{ width: SPLASH.imageWidth, height: SPLASH.imageWidth }, imageStyle]} />
    </Animated.View>
  );
}
