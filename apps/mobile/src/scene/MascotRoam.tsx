import { useEffect, useRef, useState } from 'react';
import { Image, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mascotPoses } from './catalog';
import { useReducedMotion } from '../ui/motion';
type Pose = keyof typeof mascotPoses;
type Segment = { pose: Pose; ms: number; from: number; to: number };
const RANGE = 0.27;
/** design/interaction-notes.md §11; walking segments move between the offsets, everything else stands at `from`. */
const SEGMENTS: Segment[] = [
  { pose: 'wave_main', ms: 2000, from: 0, to: 0 }, { pose: 'walk', ms: 4000, from: 0, to: RANGE }, { pose: 'cheer', ms: 2400, from: RANGE, to: RANGE },
  { pose: 'walk', ms: 6400, from: RANGE, to: -RANGE }, { pose: 'lookup', ms: 2400, from: -RANGE, to: -RANGE }, { pose: 'lie', ms: 3200, from: -RANGE, to: -RANGE },
  { pose: 'sleep', ms: 5600, from: -RANGE, to: -RANGE }, { pose: 'lookup', ms: 2000, from: -RANGE, to: -RANGE }, { pose: 'walk', ms: 4800, from: -RANGE, to: 0 },
  { pose: 'wave_main', ms: 2400, from: 0, to: 0 }, { pose: 'lookup', ms: 4800, from: 0, to: 0 },
];
export const ROAM_CYCLE_MS = SEGMENTS.reduce((sum, segment) => sum + segment.ms, 0);
const TICK_MS = 50;
/** Pose, horizontal offset (fraction of the room width) and bob for a time in the cycle. The walk art faces left, so walking right flips it. */
export function poseAt(elapsedMs: number): { pose: Pose; offsetX: number; flipX: boolean; bob: number } {
  let t = elapsedMs % ROAM_CYCLE_MS;
  for (const segment of SEGMENTS) {
    if (t < segment.ms) {
      const progress = t / segment.ms;
      const walking = segment.pose === 'walk';
      return { pose: segment.pose, offsetX: segment.from + (segment.to - segment.from) * progress, flipX: walking && segment.to > segment.from, bob: walking ? -4 * Math.abs(Math.sin(progress * Math.PI * 8)) : 0 };
    }
    t -= segment.ms;
  }
  return { pose: 'wave_main', offsetX: 0, flipX: false, bob: 0 };
}
/** The app picks the pose; it is never stored in the scene or on the server. */
export function MascotRoam({ size, roamWidth, reducedMotion, compact = false, paused = false }: { size: number; roamWidth: number; reducedMotion?: boolean; compact?: boolean; paused?: boolean }) {
  const { t } = useTranslation();
  const systemReduced = useReducedMotion();
  const still = (reducedMotion ?? systemReduced) || compact;
  const [elapsed, setElapsed] = useState(0);
  const [pressed, setPressed] = useState(false);
  const label = useRef(t('a11y.mascot', { pose: t('a11y.pose.wave_main') })).current;
  useEffect(() => {
    if (still || paused) return;
    const timer = setInterval(() => setElapsed((current) => current + TICK_MS), TICK_MS);
    return () => clearInterval(timer);
  }, [still, paused]);
  const frame = still ? poseAt(0) : poseAt(elapsed);
  const pose: Pose = pressed && !compact ? 'cheer' : frame.pose;
  return (
    <Pressable testID="mascot" accessible accessibilityRole="image" accessibilityLabel={label} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
      style={{ width: size, height: size, transform: [{ translateX: frame.offsetX * roamWidth }, { translateY: frame.bob }] }}>
      <Image testID="mascot-pose" source={mascotPoses[pose]} resizeMode="contain" style={{ width: size, height: size, transform: [{ scaleX: frame.flipX && pose === 'walk' ? -1 : 1 }] }} />
    </Pressable>
  );
}
