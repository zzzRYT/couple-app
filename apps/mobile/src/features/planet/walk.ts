import { surfacePoint, type Camera } from './model';
import { overlaps, type Placement } from './placement';

// Proposed values; the owner must confirm the speed, the reach and the close camera.
export const walkSpeed = 0.6;
const reach = 0.16; const stride = 0.05;
const closeHeight = 1.9; const closeBack = 2.2; const closeTarget = 0.05;

type Vec3 = [number, number, number];
// x, y, z, w, the order three.js takes.
export type Quat = [number, number, number, number];
// frame turns the planet so the walker stands on top with the camera behind it, so no latitude or longitude can degenerate at a pole.
// facing and every walk direction are screen angles: 0 is away from the camera, a quarter turn is screen right.
export type Walker = { frame: Quat; facing: number };
export const initialWalker: Walker = { frame: [0, 0, 0, 1], facing: Math.PI };

const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = <T extends number[]>(v: T): T => { const length = Math.hypot(...v); return v.map((value) => value / length) as T; };
const inverse = ([x, y, z, w]: Quat): Quat => [-x, -y, -z, w];
const turn = ([x, y, z]: Vec3, angle: number): Quat => { const s = Math.sin(angle / 2); return [x * s, y * s, z * s, Math.cos(angle / 2)]; };
const multiply = ([ax, ay, az, aw]: Quat, [bx, by, bz, bw]: Quat): Quat => [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
function rotate(v: Vec3, [x, y, z, w]: Quat): Vec3 {
  const t = cross([x, y, z], v); const u = cross([x, y, z], t);
  return [v[0] + 2 * (w * t[0] + u[0]), v[1] + 2 * (w * t[1] + u[1]), v[2] + 2 * (w * t[2] + u[2])];
}
function slerp(a: Quat, b: Quat, t: number): Quat {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; const angle = Math.acos(Math.min(1, Math.abs(dot)));
  const [from, to] = angle < 1e-6 ? [1 - t, t] : [Math.sin((1 - t) * angle) / Math.sin(angle), Math.sin(t * angle) / Math.sin(angle)];
  return unit(a.map((value, index) => value * from + b[index]! * to * Math.sign(dot || 1)) as Quat);
}
const ease = (blend: number) => blend * blend * (3 - 2 * blend);

function surface(walker: Walker, x: number, z: number): Vec3 {
  return surfacePoint(...rotate(unit([x, 1, z]), inverse(walker.frame)));
}

export function walkerCoordinates(walker: Walker): { latitude: number; longitude: number } {
  const up = rotate([0, 1, 0], inverse(walker.frame));
  return { latitude: Math.asin(Math.max(-1, Math.min(1, up[1]))) * 180 / Math.PI, longitude: Math.atan2(up[0], up[2]) * 180 / Math.PI };
}

// Position and orientation inside the planet group: feet on the surface, up along its normal, face along the heading.
export function walkerPose(walker: Walker, scale: number): { position: Vec3; quaternion: Quat } {
  const slope = (x: number, z: number) => { const a = surface(walker, x, z); const b = surface(walker, -x, -z); return rotate([a[0] - b[0], a[1] - b[1], a[2] - b[2]], walker.frame); };
  const normal = unit(cross(slope(0, 0.001), slope(0.001, 0)));
  const tilt = unit<Quat>([normal[2], 0, -normal[0], 1 + normal[1]]);
  return { position: surface(walker, 0, 0).map((value) => value * scale) as Vec3, quaternion: multiply(inverse(walker.frame), multiply(tilt, turn([0, 1, 0], Math.PI - walker.facing))) };
}

// Rolls the planet under the walker by a surface distance in world units. It walks in short strides, so a long step after a slow frame
// keeps the speed and cannot pass over an object; in front of an object the walker stops, and a walker that cannot move only turns.
export function walk(walker: Walker, direction: number, distance: number, scale: number, placements: readonly Placement[]): Walker {
  let current: Walker = { frame: walker.frame, facing: direction };
  for (let left = distance; left > 0; left -= stride) {
    const roll = turn([Math.cos(direction), 0, Math.sin(direction)], Math.min(left, stride) / (Math.hypot(...surface(current, 0, 0)) * scale));
    const next = { frame: unit(multiply(roll, current.frame)), facing: direction };
    const position = surface(next, 0, 0).map((value) => value * scale);
    if (placements.some((other) => overlaps(position, reach, other, scale))) break;
    current = next;
  }
  return current;
}

export function planetOrientation(camera: Camera, walker: Walker, blend: number): Quat {
  return slerp(multiply(turn([1, 0, 0], camera.pitch), turn([0, 1, 0], camera.yaw)), walker.frame, ease(blend));
}

export function cameraRig(zoom: number, aspect: number, scale: number, blend: number): { position: Vec3; target: Vec3 } {
  const t = ease(blend); const overview = 1 / (0.62 * Math.tan(Math.PI / 12) * aspect * zoom);
  return { position: [0, (scale + closeHeight) * t, overview + (closeBack - overview) * t], target: [0, (scale + closeTarget) * t, 0] };
}
