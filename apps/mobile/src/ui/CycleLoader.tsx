import { Image, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { catalogArt } from '../scene/catalog';
import { tokens } from '../theme/tokens';
import { useAppColor } from '../theme/useAppColor';
import { useType } from '../theme/typography';
import { useLoopActive, useReducedMotion } from './motion';
import { useLoopClock } from './useLoopClock';

/** Plant → balloon → window (loader-only art, not in the catalog) → book. */
const frames = [catalogArt('obj_plant_potted'), catalogArt('obj_party_balloon'), require('../../assets/loader/window.png'), catalogArt('obj_decor_books')];
export const LOADER_CYCLE_MS = 4800;
export const LOADER_STEP_MS = 1200;
const BOX = 130;
const OBJECT = 96;
type Pose = { opacity: number; scale: number; rotate: number; lift: number };
const ease = (p: number) => { 'worklet'; return p * p * (3 - 2 * p); };
const mix = (a: number, b: number, p: number) => { 'worklet'; return a + (b - a) * ease(p); };
/**
 * Canvas `cpl-cycle` keyframes for one object at a time in the 4.8 s cycle; object `index` starts 1.2 s after the previous.
 * 0-5% pops in (scale .6→1.05, -6°→0), 5-10% settles, 10-22% floats up 3pt, 22-27% shrinks out (→.7, 6°), then stays hidden.
 */
export function loaderPose(elapsedMs: number, index: number): Pose {
  'worklet';
  const local = (((elapsedMs - index * LOADER_STEP_MS) % LOADER_CYCLE_MS) + LOADER_CYCLE_MS) % LOADER_CYCLE_MS;
  const p = local / LOADER_CYCLE_MS;
  if (p < 0.05) return { opacity: mix(0, 1, p / 0.05), scale: mix(0.6, 1.05, p / 0.05), rotate: mix(-6, 0, p / 0.05), lift: 0 };
  if (p < 0.1) return { opacity: 1, scale: mix(1.05, 1, (p - 0.05) / 0.05), rotate: 0, lift: 0 };
  if (p < 0.22) return { opacity: 1, scale: 1, rotate: 0, lift: mix(0, -3, (p - 0.1) / 0.12) };
  if (p < 0.27) { const q = (p - 0.22) / 0.05; return { opacity: mix(1, 0, q), scale: mix(1, 0.7, q), rotate: mix(0, 6, q), lift: mix(-3, 0, q) }; }
  return { opacity: 0, scale: 0.7, rotate: 0, lift: 0 };
}
function Frame({ clock, index }: { clock: SharedValue<number>; index: number }) {
  const style = useAnimatedStyle(() => {
    const pose = loaderPose(clock.value, index);
    return { opacity: pose.opacity, transform: [{ translateY: pose.lift }, { scale: pose.scale }, { rotate: `${pose.rotate}deg` }] };
  });
  return <Animated.Image source={frames[index]} resizeMode="contain" style={[{ position: 'absolute', width: OBJECT, height: OBJECT }, style]} />;
}
function Cycling() {
  const clock = useLoopClock(LOADER_CYCLE_MS, useLoopActive());
  return <>{frames.map((_, index) => <Frame key={index} clock={clock} index={index} />)}</>;
}
/**
 * Global loading indicator (interaction-notes.md §10.2): one object at a time, 4.8 s per round, the message below it, no spinner.
 * The art is hidden from screen readers; the message is announced once. Reduced motion shows the plant, still.
 */
export function CycleLoader({ label, reducedMotion, showLabel = true }: { label: string; reducedMotion?: boolean; showLabel?: boolean }) {
  const color = useAppColor();
  const { type } = useType();
  const systemReduced = useReducedMotion();
  const reduced = reducedMotion ?? systemReduced;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: tokens.spacing[3] }}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' }}>
        {reduced ? <Image testID="loader-frame" source={frames[0]} resizeMode="contain" style={{ width: OBJECT, height: OBJECT }} /> : <Cycling />}
      </View>
      {showLabel && <Text style={[type('body'), { color: color.text, textAlign: 'center' }]}>{label}</Text>}
    </View>
  );
}
/** Full-screen loading state: the loader centred on the app background. */
export function LoadingScreen({ label }: { label: string }) {
  const color = useAppColor();
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: tokens.spacing[4], backgroundColor: color.bg }}><CycleLoader label={label} /></View>;
}
