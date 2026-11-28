import { FRAME, blinkGap, eyeOpening, newLife, newPose, stepLife, type Pose } from '../aroomiLife';

const FPS = 60;
/** Runs the life for `seconds` and returns one pose per frame. */
function run(seed: number, seconds: number, options: { viewer?: (t: number) => number; pokeAt?: number; fps?: number } = {}) {
  const life = newLife(seed); const pose = newPose(); const frames: (Pose & { t: number })[] = []; const fps = options.fps ?? FPS;
  for (let i = 1; i <= seconds * fps; i += 1) {
    const t = i / fps;
    stepLife(life, pose, t, options.viewer?.(t) ?? 0, options.pokeAt !== undefined && i === Math.round(options.pokeAt * fps));
    frames.push({ ...pose, t });
  }
  return frames;
}
const blinkStarts = (frames: { eyes: number; t: number }[]) => frames.filter((frame, i) => frame.eyes < 1 && frames[i - 1]!.eyes >= 1).map((frame) => frame.t);

it('breathes on a 3.4 second cycle without changing volume by more than the squash of a jump', () => {
  const frames = run(1, 5.9);
  const stretches = frames.map((frame) => frame.stretch);
  expect(Math.max(...stretches)).toBeCloseTo(1.015, 3);
  expect(Math.min(...stretches)).toBeCloseTo(0.985, 3);
  const peak = frames.find((frame, i) => i > 0 && frame.stretch < frames[i - 1]!.stretch)!.t;
  const next = frames.find((frame, i) => frame.t > peak + 1 && frame.stretch < frames[i - 1]!.stretch && frames[i - 1]!.stretch > frames[i - 2]!.stretch)!.t;
  expect(next - peak).toBeCloseTo(3.4, 1);
});

it('blinks at uneven gaps of 2 to 10 seconds, more often short than long', () => {
  expect([blinkGap(0), blinkGap(0.5), blinkGap(1)]).toEqual([2, 4, 10]);
  const gaps = Array.from({ length: 1000 }, (_, i) => blinkGap((i + 0.5) / 1000));
  expect(gaps.filter((gap) => gap < 6).length).toBeGreaterThan(gaps.filter((gap) => gap >= 6).length * 2);
  const starts = blinkStarts(run(7, 300));
  const waits = starts.slice(1).map((start, i) => start - starts[i]!);
  expect(starts.length).toBeGreaterThan(40);
  const mean = waits.reduce((sum, wait) => sum + wait, 0) / waits.length;
  expect(Math.sqrt(waits.reduce((sum, wait) => sum + (wait - mean) ** 2, 0) / waits.length)).toBeGreaterThan(1);
  expect(Math.max(...waits)).toBeLessThanOrEqual(10.3);
});

it('closes the eyes over two frames, holds one and opens over three', () => {
  expect(eyeOpening(-0.01)).toBe(1);
  expect(eyeOpening(1 * FRAME)).toBeCloseTo(0.5);
  expect(eyeOpening(2.5 * FRAME)).toBe(0);
  expect(eyeOpening(4.5 * FRAME)).toBeCloseTo(0.5);
  expect(eyeOpening(6 * FRAME)).toBe(1);
});

it('looks toward the viewer with the eyes first and the body after, and blinks when the gaze jumps', () => {
  const frames = run(3, 90, { viewer: (t) => Math.max(0, Math.min(1, (t - 30) / 10)) });
  const before = frames.filter((frame) => frame.t > 10 && frame.t < 30); const after = frames.filter((frame) => frame.t > 50);
  const mean = (list: Pose[]) => list.reduce((sum, frame) => sum + frame.turn + frame.gazeYaw, 0) / list.length;
  expect(mean(after) - mean(before)).toBeGreaterThan(0.3);
  // A dart: the face moves more than 0.16 rad within an eighth of a second.
  const darts = frames.map((_, i) => i).filter((i) => i > 0 && i + 8 < frames.length && Math.abs(frames[i + 8]!.gazeYaw - frames[i]!.gazeYaw) > 0.16 && Math.abs(frames[i]!.gazeYaw - frames[i - 1]!.gazeYaw) < 0.005);
  expect(darts.length).toBeGreaterThan(3);
  for (const i of darts) {
    expect(Math.abs(frames[i + 8]!.gazeYaw - frames[i]!.gazeYaw)).toBeGreaterThan(Math.abs(frames[i + 8]!.turn - frames[i]!.turn));
    expect(frames.slice(i, i + 10).some((frame) => frame.eyes < 1)).toBe(true);
  }
  expect(Math.max(...frames.map((frame) => Math.abs(frame.gazeYaw)))).toBeLessThanOrEqual(0.221);
  expect(Math.max(...frames.map((frame) => Math.abs(frame.gazePitch)))).toBeLessThanOrEqual(0.071);
});

it('does a small habit now and then, after a pause, and is otherwise on the ground', () => {
  const frames = run(11, 240);
  const jumps = frames.filter((frame, i) => frame.lift > 0 && frames[i - 1]!.lift === 0);
  const stretches = frames.filter((frame, i) => frame.arms > 0.5 && frames[i - 1]!.arms <= 0.5);
  expect(jumps.length + stretches.length).toBeGreaterThan(4);
  expect(frames.filter((frame) => frame.t < 6).every((frame) => frame.lift === 0)).toBe(true);
  // Squash before every jump: the body is shorter just before it leaves the ground.
  for (const jump of jumps) expect(frames[frames.indexOf(jump) - 1]!.stretch).toBeLessThan(0.95);
});

it('reacts to a tap at once and returns to rest', () => {
  const frames = run(5, 5, { pokeAt: 1 });
  const lifted = frames.find((frame) => frame.lift > 0)!;
  expect(lifted.t - 1).toBeLessThan(0.2);
  expect(Math.max(...frames.map((frame) => frame.lift))).toBeCloseTo(0.16, 2);
  expect(frames.find((frame) => frame.t > 1 && frame.t < 1.2)!.eyes).toBeGreaterThan(1);
  expect(blinkStarts(frames.filter((frame) => frame.t > 1.3)).length).toBeGreaterThanOrEqual(2);
  expect(frames.filter((frame) => frame.t > 2).every((frame) => frame.lift === 0)).toBe(true);
});

it('lets the scarf tails keep swinging after the body has stopped', () => {
  const frames = run(5, 6, { pokeAt: 1 });
  const landed = frames.filter((frame) => frame.t > 1.75 && frame.t < 2.6).map((frame) => frame.tailLift);
  expect(Math.max(...landed)).toBeGreaterThan(0.05);
  expect(Math.min(...landed)).toBeLessThan(-0.02);
  expect(Math.max(...frames.filter((frame) => frame.t > 5).map((frame) => Math.abs(frame.tailLift)))).toBeLessThan(0.05);
});

it('gives the same poses for the same seed, different ones for another, and stays in range at any frame rate', () => {
  expect(run(9, 30)).toEqual(run(9, 30));
  expect(run(9, 30)).not.toEqual(run(10, 30));
  for (const fps of [20, 60, 120]) {
    const frames = run(13, 120, { fps, pokeAt: 50 });
    const range = (key: keyof Pose) => [Math.min(...frames.map((frame) => frame[key])), Math.max(...frames.map((frame) => frame[key]))];
    expect(frames.every((frame) => Object.values(frame).every(Number.isFinite))).toBe(true);
    expect(range('stretch')[0]).toBeGreaterThan(0.85); expect(range('stretch')[1]).toBeLessThan(1.15);
    expect(range('arms')[0]).toBeGreaterThanOrEqual(0); expect(range('arms')[1]).toBeLessThan(0.9);
    expect(Math.max(...range('lean').map(Math.abs))).toBeLessThan(0.3); expect(Math.max(...range('turn').map(Math.abs))).toBeLessThanOrEqual(0.9);
    expect(Math.max(...range('tailSwing').map(Math.abs))).toBeLessThan(0.7); expect(Math.max(...range('tailLift').map(Math.abs))).toBeLessThan(0.6);
  }
});
