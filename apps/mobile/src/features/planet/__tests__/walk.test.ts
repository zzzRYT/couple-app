import { planetLevel } from '../level';
import { initialCamera, surfacePosition } from '../model';
import { canPlace, type Placement } from '../placement';
import { cameraRig, initialWalker, planetOrientation, walk, walkerCoordinates, walkerPose, walkSpeed, type Quat, type Walker } from '../walk';

const scales = [1, 2, 3, 4].map((level) => planetLevel(0, [level]).scale);
const dot = (a: number[], b: number[]) => a.reduce((sum, value, index) => sum + value * b[index]!, 0);
const between = (a: number[], b: number[]) => Math.hypot(...a.map((value, index) => value - b[index]!));
const toward = (from: number[], to: number[]) => to.map((value, index) => (value - from[index]!) / between(from, to));
const cross = (a: number[], b: number[]) => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
// Rotation matrix rows of a unit quaternion, written out separately from the code under test.
const rotate = ([x, y, z, w]: Quat, v: number[]) => [
  dot([1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], v),
  dot([2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], v),
  dot([2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)], v),
];
const close = (values: number[]) => values.map((value) => expect.closeTo(value));

it('starts where the overview stood the character: on the north pole, facing the camera', () => {
  const pose = walkerPose(initialWalker, 1.3);
  expect(pose.position).toEqual(close(surfacePosition(90, 0).map((value) => value * 1.3)));
  expect(rotate(pose.quaternion, [0, 0, 1])[2]).toBeGreaterThan(0.95);
  expect(walkerCoordinates(initialWalker).latitude).toBeCloseTo(90);
});

it.each(scales)('circles a planet of scale %s through both poles at a constant surface speed without drift or flip', (scale) => {
  const step = walkSpeed / 60; let walker: Walker = { ...initialWalker, facing: 0 }; const start = walkerPose(walker, scale); let pose = start; let south = 90; let home = Infinity;
  for (let i = 0; i < 2 * Math.PI * scale / step; i += 1) {
    walker = walk(walker, 0, step, scale, []); const next = walkerPose(walker, scale);
    const moved = between(next.position, pose.position);
    expect(moved / step).toBeGreaterThan(0.97); expect(moved / step).toBeLessThan(1.03);
    expect(Math.abs(dot(next.quaternion, pose.quaternion))).toBeGreaterThan(0.999);
    expect(Math.abs(walkerCoordinates(walker).longitude % 180)).toBeLessThan(1e-6);
    south = Math.min(south, walkerCoordinates(walker).latitude); pose = next;
    if (south < -89) home = Math.min(home, between(pose.position, start.position));
  }
  expect(south).toBeLessThan(-89);
  expect(Math.hypot(...walker.frame)).toBeCloseTo(1, 12);
  expect(home).toBeLessThan(step);
});

it.each([0, 1, 2.5, -2])('stands on the surface normal and faces the screen direction %s it walks in', (direction) => {
  let walker: Walker = initialWalker;
  for (let i = 0; i < 40; i += 1) walker = walk(walker, 0.7, 0.05, 1.15, []);
  const before = walkerPose(walker, 1.15).position; walker = walk(walker, direction, 0.01, 1.15, []); const pose = walkerPose(walker, 1.15);
  const face = rotate(pose.quaternion, [0, 0, 1]); const head = rotate(pose.quaternion, [0, 1, 0]);
  expect(dot(face, toward(before, pose.position))).toBeGreaterThan(0.97);
  const probe = (screen: number) => walkerPose(walk(walker, screen, 0.001, 1.15, []), 1.15).position;
  const normal = cross(toward(probe(-Math.PI / 2), probe(Math.PI / 2)), toward(probe(Math.PI), probe(0)));
  expect(dot(head, toward([0, 0, 0], normal))).toBeGreaterThan(0.9995);
  const onScreen = rotate(planetOrientation(initialCamera, walker, 1), face);
  expect(Math.atan2(onScreen[0]!, -onScreen[2]!)).toBeCloseTo(Math.atan2(Math.sin(direction), Math.cos(direction)), 0);
});

it.each(scales)('stops in front of a placed object on a planet of scale %s, turns to it, and can walk away', (scale) => {
  const object: Placement = { id: 'a', latitude: 0, longitude: 180, heading: 0, radius: 0.31 };
  const center = surfacePosition(0, 180).map((value) => value * scale);
  let walker = initialWalker;
  for (let i = 0; i < 400; i += 1) walker = walk(walker, 0, 0.01, scale, [object]);
  const stopped = walkerPose(walker, scale);
  expect(between(stopped.position, center)).toBeGreaterThanOrEqual(0.31 + 0.16);
  expect(between(stopped.position, center)).toBeLessThan(0.31 + 0.16 + 0.02);
  expect(dot(rotate(stopped.quaternion, [0, 0, 1]), toward(stopped.position, center))).toBeGreaterThan(0.8);
  expect(canPlace([], object, 4, scale, walkerCoordinates(walker))).toBe('overlap');
  expect(canPlace([], object, 4, scale)).toBe('ok');
  expect(between(walkerPose(walk(walker, Math.PI, 0.2, scale, [object]), scale).position, center)).toBeGreaterThan(0.31 + 0.16 + 0.15);
});

it.each(scales)('covers one long step like many short ones on a planet of scale %s, and stops at an object instead of passing over it', (scale) => {
  let short = initialWalker;
  for (let i = 0; i < 100; i += 1) short = walk(short, 1, 0.01, scale, []);
  expect(walkerPose(walk(initialWalker, 1, 1, scale, []), scale).position).toEqual(walkerPose(short, scale).position.map((value) => expect.closeTo(value, 2)));
  const object: Placement = { id: 'a', latitude: 0, longitude: 180, heading: 0, radius: 0.31 };
  const gap = between(walkerPose(walk(initialWalker, 0, 3 * scale, scale, [object]), scale).position, surfacePosition(0, 180).map((value) => value * scale));
  expect(gap).toBeGreaterThanOrEqual(0.31 + 0.16); expect(gap).toBeLessThan(0.31 + 0.16 + 0.06);
});

it.each(scales)('zooms from the unchanged overview to a close view behind the walker on a planet of scale %s', (scale) => {
  const overview = { yaw: 2, pitch: -0.4, zoom: 1.5 }; let walker = initialWalker;
  for (let i = 0; i < 50; i += 1) walker = walk(walker, 2, 0.05, scale, []);
  expect(cameraRig(1.5, 0.5, scale, 0)).toEqual({ position: close([0, 0, 1 / (0.62 * Math.tan(Math.PI / 12) * 0.5 * 1.5)]), target: [0, 0, 0] });
  const [sinPitch, cosPitch, sinYaw, cosYaw] = [Math.sin(-0.4), Math.cos(-0.4), Math.sin(2), Math.cos(2)];
  expect(rotate(planetOrientation(overview, walker, 0), [1, 2, 3])).toEqual(close([cosYaw + 3 * sinYaw, 2 * cosPitch - sinPitch * (3 * cosYaw - sinYaw), 2 * sinPitch + cosPitch * (3 * cosYaw - sinYaw)]));
  const feet = rotate(planetOrientation(overview, walker, 1), walkerPose(walker, scale).position);
  expect(toward([0, 0, 0], feet)[1]).toBeGreaterThan(0.99);
  const near = cameraRig(1.5, 0.5, scale, 1);
  expect(near.position[2]).toBeGreaterThan(0); expect(near.position[1]).toBeGreaterThan(feet[1]!);
  expect(between(near.target, feet)).toBeLessThan(0.5);
  let distance = Infinity;
  for (let blend = 0; blend <= 1; blend += 0.05) {
    const rig = cameraRig(1.5, 0.5, scale, blend);
    expect(Math.hypot(...rig.position)).toBeGreaterThan(scale * 1.5);
    expect(between(rig.position, feet)).toBeLessThan(distance); distance = between(rig.position, feet);
  }
});
