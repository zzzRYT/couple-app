import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { mascotPoses } from './catalog';
import { poseAt, ROAM_CYCLE_MS, TAP_CHEER_MS, type RoamPose } from './roamCycle';
import { useLoopActive, useReducedMotion } from '../ui/motion';
import { useLoopClock } from '../ui/useLoopClock';
export { poseAt, ROAM_CYCLE_MS } from './roamCycle';

/** One stacked layer per drawable pose (walking right is the mirrored walk art), shown while the clock is in its segment. */
const LAYERS: { key: string; pose: RoamPose; flip: boolean }[] = [
  { key: 'wave_main', pose: 'wave_main', flip: false }, { key: 'walkL', pose: 'walk', flip: false }, { key: 'walkR', pose: 'walk', flip: true },
  { key: 'cheer', pose: 'cheer', flip: false }, { key: 'lookup', pose: 'lookup', flip: false }, { key: 'lie', pose: 'lie', flip: false }, { key: 'sleep', pose: 'sleep', flip: false },
];
function PoseLayer({ clock, pose, flip, size }: { clock: SharedValue<number>; pose: RoamPose; flip: boolean; size: number }) {
  const style = useAnimatedStyle(() => {
    const frame = poseAt(clock.value);
    return { opacity: frame.pose === pose && frame.flipX === flip ? 1 : 0 };
  });
  return <Animated.Image source={mascotPoses[pose]} resizeMode="contain" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size, transform: [{ scaleX: flip ? -1 : 1 }] }, style]} />;
}
function Roaming({ size, roamWidth, running, cheering }: { size: number; roamWidth: number; running: boolean; cheering: boolean }) {
  const clock = useLoopClock(ROAM_CYCLE_MS, running && !cheering);
  const move = useAnimatedStyle(() => {
    const frame = poseAt(clock.value);
    return { transform: [{ translateX: frame.offsetX * roamWidth }, { translateY: frame.bob }] };
  });
  return (
    <Animated.View testID="mascot-roaming" style={[{ width: size, height: size }, move]}>
      <View style={{ opacity: cheering ? 0 : 1 }}>{LAYERS.map((layer) => <PoseLayer key={layer.key} clock={clock} pose={layer.pose} flip={layer.flip} size={size} />)}</View>
      {cheering && <Image testID="mascot-pose" source={mascotPoses.cheer} resizeMode="contain" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }} />}
    </Animated.View>
  );
}
/**
 * The room's mascot (interaction-notes.md §11). The app picks the pose; it is never stored in the scene or on the server.
 * Still (single waving pose) with reduced motion, in miniatures, and while the room is changing (`paused`). A tap shows an
 * excited greeting for 1.2 s and the cycle then continues from where it stopped. The cycle runs on the UI thread and stops
 * while the screen is unfocused or the app is in the background.
 */
export function MascotRoam({ size, roamWidth, reducedMotion, compact = false, paused = false }: { size: number; roamWidth: number; reducedMotion?: boolean; compact?: boolean; paused?: boolean }) {
  const { t } = useTranslation();
  const systemReduced = useReducedMotion();
  const loopActive = useLoopActive();
  const still = (reducedMotion ?? systemReduced) || compact;
  const [cheering, setCheering] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const label = useRef(t('a11y.mascot', { pose: t('a11y.pose.wave_main') })).current;
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function cheer() {
    if (compact) return;
    if (timer.current) clearTimeout(timer.current);
    setCheering(true);
    timer.current = setTimeout(() => setCheering(false), TAP_CHEER_MS);
  }
  const animated = !still && !paused;
  return (
    <Pressable testID="mascot" accessible accessibilityRole="image" accessibilityLabel={label} disabled={compact} onPress={cheer} style={{ width: size, height: size }}>
      {/* The greeting is drawn inside the moving layer, which pauses its clock, so the mascot cheers where it stands and then carries on. */}
      {animated ? <Roaming size={size} roamWidth={roamWidth} running={loopActive} cheering={cheering} />
        : <Image testID="mascot-pose" source={mascotPoses[cheering ? 'cheer' : 'wave_main']} resizeMode="contain" style={{ width: size, height: size }} />}
    </Pressable>
  );
}
