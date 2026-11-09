import { Image, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { catalogArt, mascotPoses } from '../scene/catalog';
import { useLoopActive, useReducedMotion } from './motion';
import { useLoopClock } from './useLoopClock';

const sparkle = catalogArt('obj_shape_sparkle');
const sparkles = [{ side: 22, rotate: '-8deg', left: -4, top: 2 }, { side: 18, rotate: '10deg', right: -2, top: -4 }];
export const HOP_MS = 2400;
export const TWINKLE_MS = 1400;
const ease = (p: number) => { 'worklet'; return p * p * (3 - 2 * p); };
/** S29 `cpl-hop`: up 16, down, up 8, down at 18/36/52/68% of the loop, then rest. */
export function hopLift(elapsedMs: number): number {
  'worklet';
  const keys: [number, number][] = [[0, 0], [0.18, -16], [0.36, 0], [0.52, -8], [0.68, 0]];
  const p = (elapsedMs % HOP_MS) / HOP_MS;
  for (let i = 1; i < keys.length; i++) {
    const [start, from] = keys[i - 1]!; const [end, to] = keys[i]!;
    if (p < end) return from + (to - from) * ease((p - start) / (end - start));
  }
  return 0;
}
/** S29 `cpl-twinkle`: 0 → 1 → 0 over the loop, where 1 is the dimmest and smallest (opacity .45, scale .8). */
export function twinkleDepth(elapsedMs: number): number {
  'worklet';
  const p = (elapsedMs % TWINKLE_MS) / TWINKLE_MS;
  return ease(p < 0.5 ? p * 2 : (1 - p) * 2);
}
/** Mopi cheering with two sparkles (V0-start-connected): hops and twinkles while on screen, and stays still as drawn with Reduce Motion. */
export function CheerMascot({ size, label }: { size: number; label: string }) {
  const reduced = useReducedMotion();
  const running = useLoopActive() && !reduced;
  const hop = useLoopClock(HOP_MS, running);
  const twinkle = useLoopClock(TWINKLE_MS, running);
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: hopLift(hop.value) }] }));
  const shine = useAnimatedStyle(() => { const depth = twinkleDepth(twinkle.value); return { opacity: 1 - 0.55 * depth, transform: [{ scale: 1 - 0.2 * depth }] }; });
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Animated.Image accessible accessibilityLabel={label} source={mascotPoses.cheer} resizeMode="contain" style={[{ width: size, height: size }, body]} />
      {sparkles.map(({ side, rotate, ...place }, index) => (
        <Animated.View key={index} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ position: 'absolute', ...place }, shine]}>
          <Image source={sparkle} style={{ width: side, height: side, transform: [{ rotate }] }} />
        </Animated.View>
      ))}
    </View>
  );
}
