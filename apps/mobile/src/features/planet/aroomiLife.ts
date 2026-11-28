// How the idle Aroomi moves over time. Pure: the same seed and inputs give the same poses.
// Each number and where it comes from is in specs/003-ai-couple-planet-v1/aroomi-liveliness.md.

export type Pose = {
  /** Height scale. Girth is 1 / sqrt(stretch), so the volume stays the same. */
  stretch: number;
  /** Height above the ground, in body heights. */
  lift: number;
  /** Sideways lean, rad. */
  lean: number;
  /** Body turn toward what it looks at, rad. */
  turn: number;
  /** Face offset from the body, rad. The eyes get there before the body does. */
  gazeYaw: number; gazePitch: number;
  /** 1 open, 0 closed, above 1 wide. */
  eyes: number;
  /** Arm lift above the resting pose, rad. */
  arms: number;
  /** Scarf tails around the knot, rad. */
  tailSwing: number; tailLift: number;
};
type Act = 'idle' | 'hop' | 'stretch' | 'tilt' | 'poked';
export type Life = {
  random: () => number; t: number;
  blinkAt: number; nextBlink: number;
  lookAt: 'viewer' | 'away'; look: number; lookPitch: number; nextGlance: number;
  act: Act; actAt: number; nextAct: number; side: number;
  turn: number; gazeYaw: number; gazePitch: number;
  swing: number; swingSpeed: number; flap: number; flapSpeed: number;
};

export const FRAME = 1 / 24;
const BREATH = 3.4;
const ACT_SECONDS = { idle: 0, hop: 0.9, stretch: 1.6, tilt: 1.6, poked: 0.7 };
const PONDER = 0.35;
const TAIL = 2 * Math.PI * 1.6; const TAIL_DAMPING = 0.25;

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const ease = (x: number) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };
const toward = (seconds: number, dt: number) => 1 - Math.exp(-dt / seconds);
// Up over the first 30%, held, down over the last 40%.
const bell = (p: number) => p < 0.3 ? ease(p / 0.3) : p < 0.6 ? 1 : ease((1 - p) / 0.4);

function mulberry(seed: number) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
    x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
}

/** Seconds between blinks for a uniform draw: 2 to 10, with short gaps more common. */
export const blinkGap = (u: number) => 2 + 8 * u * u;

/** A blink closes over 2 frames, stays shut for 1 and opens over 3. */
export function eyeOpening(since: number) {
  if (since < 0 || since >= 6 * FRAME) return 1;
  if (since < 2 * FRAME) return 1 - ease(since / (2 * FRAME));
  if (since < 3 * FRAME) return 0;
  return ease((since - 3 * FRAME) / (3 * FRAME));
}

export function restPose(pose: Pose) {
  pose.stretch = 1; pose.lift = 0; pose.lean = 0; pose.turn = 0; pose.gazeYaw = 0; pose.gazePitch = 0; pose.eyes = 1; pose.arms = 0; pose.tailSwing = 0; pose.tailLift = 0;
  return pose;
}
export const newPose = () => restPose({} as Pose);

export function newLife(seed: number): Life {
  const random = mulberry(seed);
  return {
    random, t: 0, blinkAt: -1, nextBlink: 1 + blinkGap(random()),
    lookAt: 'viewer', look: 0, lookPitch: 0, nextGlance: 1.5 + 2 * random(),
    act: 'idle', actAt: 0, nextAct: 6 + 6 * random(), side: 1,
    turn: 0, gazeYaw: 0, gazePitch: 0, swing: 0, swingSpeed: 0, flap: 0, flapSpeed: 0,
  };
}

// A jump: squash down first, stretch in the air, squash on landing, settle. The arms trail the body.
function jump(p: number, height: number, pose: Pose) {
  if (p < 0.2) pose.stretch *= 1 - 0.1 * ease(p / 0.2);
  else if (p < 0.6) {
    const air = (p - 0.2) / 0.4;
    pose.lift += height * 4 * air * (1 - air);
    pose.stretch *= 1 + 0.08 * Math.sin(Math.PI * air) - 0.1 * (1 - ease(air * 4));
  } else if (p < 0.8) pose.stretch *= 1 - 0.08 * Math.sin(Math.PI * (p - 0.6) / 0.2);
  else pose.stretch *= 1 + 0.02 * Math.sin(Math.PI * (p - 0.8) / 0.2);
  pose.arms += 0.5 * Math.sin(Math.PI * clamp((p - 0.25) / 0.45, 0, 1));
}

/**
 * Advance to time `t` and write the pose. `viewer` is the direction of the camera around the character, rad.
 * `poked` starts the tap reaction.
 */
export function stepLife(life: Life, pose: Pose, t: number, viewer: number, poked: boolean) {
  const dt = clamp(t - life.t, 0, 0.05); life.t = t;
  const { random } = life;

  // Breathing, with the arms a fifth of a second behind the chest, and a slow shift of weight on two periods that never line up.
  const breath = Math.sin(2 * Math.PI * t / BREATH);
  pose.stretch = 1 + 0.015 * breath;
  pose.arms = 0.05 + 0.04 * Math.sin(2 * Math.PI * (t - 0.2) / BREATH);
  pose.lean = 0.035 * Math.sin(2 * Math.PI * t / 7.3) + 0.016 * Math.sin(2 * Math.PI * t / 3.1 + 1.3);
  pose.lift = 0;

  // A small habit now and then. It looks away and pauses first, so the change does not come out of nowhere.
  if (poked) {
    life.act = 'poked'; life.actAt = t; life.lookAt = 'viewer'; life.lookPitch = 0;
    life.blinkAt = t + 0.4; life.nextBlink = t + 0.75; life.nextGlance = t + 3;
  } else if (life.act === 'idle' && t >= life.nextAct) {
    const pick = random();
    life.act = pick < 0.4 ? 'hop' : pick < 0.7 ? 'stretch' : 'tilt'; life.actAt = t + PONDER; life.side = random() < 0.5 ? -1 : 1;
    life.lookAt = 'away'; life.look = clamp(life.turn + life.side * 0.3, -1.2, 1.2); life.lookPitch = 0.07;
    life.nextGlance = life.actAt + ACT_SECONDS[life.act];
  }
  let eyes = 1;
  if (life.act !== 'idle' && t >= life.actAt) {
    const p = (t - life.actAt) / ACT_SECONDS[life.act];
    if (p >= 1) {
      life.act = 'idle'; life.nextAct = t + 9 + 11 * random(); life.lookAt = 'viewer'; life.lookPitch = 0;
    } else if (life.act === 'hop') jump(p, 0.12, pose);
    else if (life.act === 'poked') {
      jump(p, 0.16, pose);
      if (p < 0.4) eyes = 1.25;
      else pose.lean += 0.08 * Math.sin(2 * Math.PI * 3 * (t - life.actAt)) * (1 - p);
    } else if (life.act === 'stretch') {
      const up = bell(p);
      pose.arms += 0.7 * up; pose.stretch *= 1 + 0.04 * up; life.lookPitch = 0.05 * up; eyes = 1 - 0.9 * up;
    } else {
      pose.lean += life.side * 0.14 * bell(p); life.lookAt = 'viewer';
    }
  }

  if (life.act === 'idle' && t >= life.nextGlance) {
    life.nextGlance = t + 2.5 + 3.5 * random();
    if (random() < 0.45) life.lookAt = 'viewer';
    else { life.lookAt = 'away'; life.look = clamp(viewer + (random() * 2 - 1) * 0.8, -1.2, 1.2); }
    life.lookPitch = (random() * 2 - 1) * 0.07;
  }

  // The eyes dart to the target in about three frames and the body turns after them.
  const target = life.lookAt === 'viewer' ? clamp(viewer, -1.2, 1.2) : life.look;
  life.turn += (target * 0.75 - life.turn) * toward(0.35, dt);
  const gaze = clamp(target - life.turn, -0.22, 0.22);
  const jumped = Math.abs(gaze - life.gazeYaw) > 0.15;
  life.gazeYaw += (gaze - life.gazeYaw) * toward(0.045, dt);
  life.gazePitch += (life.lookPitch - life.gazePitch) * toward(0.045, dt);
  pose.turn = life.turn; pose.gazeYaw = life.gazeYaw; pose.gazePitch = life.gazePitch;

  // Blinks come at uneven gaps, and also whenever the gaze jumps.
  if (t >= life.nextBlink) { life.blinkAt = t; life.nextBlink = t + blinkGap(random()); }
  if (jumped && t - life.blinkAt > 6 * FRAME) life.blinkAt = t;
  pose.eyes = Math.min(eyes, eyeOpening(t - life.blinkAt)) * (eyes > 1 ? eyes : 1);

  // The scarf tails chase the body on a loose spring, so they keep swinging after it stops.
  life.swingSpeed += (TAIL * TAIL * (life.turn + pose.lean - life.swing) - 2 * TAIL_DAMPING * TAIL * life.swingSpeed) * dt; life.swing += life.swingSpeed * dt;
  life.flapSpeed += (TAIL * TAIL * (pose.lift - life.flap) - 2 * TAIL_DAMPING * TAIL * life.flapSpeed) * dt; life.flap += life.flapSpeed * dt;
  pose.tailSwing = clamp(life.swing - life.turn - pose.lean, -0.6, 0.6) + 0.03 * Math.sin(2 * Math.PI * t / 1.9);
  pose.tailLift = clamp((life.flap - pose.lift) * 4, -0.5, 0.5) + 0.02 * Math.sin(2 * Math.PI * (t - 0.35) / BREATH);
}
