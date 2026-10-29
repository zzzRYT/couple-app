/** design/interaction-notes.md §11: a 40 s cycle of the six room poses; walking segments move between the offsets, everything else stands at `from`. Pure (and worklet-safe) so the UI thread and tests share it. */
export type RoamPose = 'wave_main' | 'walk' | 'cheer' | 'lookup' | 'lie' | 'sleep';
type Segment = { pose: RoamPose; ms: number; from: number; to: number };
/** Roaming range as a fraction of the room width (±27%). */
export const ROAM_RANGE = 0.27;
const R = ROAM_RANGE;
export const ROAM_SEGMENTS: readonly Segment[] = [
  { pose: 'wave_main', ms: 2000, from: 0, to: 0 }, { pose: 'walk', ms: 4000, from: 0, to: R }, { pose: 'cheer', ms: 2400, from: R, to: R },
  { pose: 'walk', ms: 6400, from: R, to: -R }, { pose: 'lookup', ms: 2400, from: -R, to: -R }, { pose: 'lie', ms: 3200, from: -R, to: -R },
  { pose: 'sleep', ms: 5600, from: -R, to: -R }, { pose: 'lookup', ms: 2000, from: -R, to: -R }, { pose: 'walk', ms: 4800, from: -R, to: 0 },
  { pose: 'wave_main', ms: 2400, from: 0, to: 0 }, { pose: 'lookup', ms: 4800, from: 0, to: 0 },
];
export const ROAM_CYCLE_MS = ROAM_SEGMENTS.reduce((sum, segment) => sum + segment.ms, 0);
/** Tap reaction length: an excited greeting, then the cycle continues where it was. */
export const TAP_CHEER_MS = 1200;
/** Walking bob: 4pt up and back every second (canvas `cpl-step`, 0.5 s each way). */
export const STEP_MS = 1000;
export const STEP_HEIGHT = 4;
export type RoamFrame = { pose: RoamPose; offsetX: number; flipX: boolean; bob: number };
/** Pose, horizontal offset (fraction of the room width) and bob for a time in the cycle. The walk art faces left, so walking right flips it. */
export function poseAt(elapsedMs: number): RoamFrame {
  'worklet';
  let t = ((elapsedMs % ROAM_CYCLE_MS) + ROAM_CYCLE_MS) % ROAM_CYCLE_MS;
  for (let i = 0; i < ROAM_SEGMENTS.length; i += 1) {
    const segment = ROAM_SEGMENTS[i]!;
    if (t < segment.ms) {
      const progress = t / segment.ms;
      const walking = segment.pose === 'walk';
      const bob = walking ? -STEP_HEIGHT * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / STEP_MS)) : 0;
      return { pose: segment.pose, offsetX: segment.from + (segment.to - segment.from) * progress, flipX: walking && segment.to > segment.from, bob };
    }
    t -= segment.ms;
  }
  return { pose: 'wave_main', offsetX: 0, flipX: false, bob: 0 };
}
