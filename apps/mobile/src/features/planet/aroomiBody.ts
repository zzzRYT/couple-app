import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, MeshStandardMaterial, SphereGeometry } from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Sizes are the K01 table with height 1 and the soles at y 0. Shape and pose are measured on the drawn Aroomi,
// design/mascot/harmonized/mascot_wave_main.png.
const WIDE = 0.42; const DEEP = 0.38;
// The drawn outline is a superellipse: fullest at 45% of the height, rounder above (power 2.5) than below (power 3),
// with the underside 0.05 above the soles.
const MID = 0.45;
const SHOULDER = [0.37, 0.44] as const;
// K02 lowers a resting arm 1.1 rad below level, which puts the hand where it is drawn: 0.1 past the body at 0.3 of the height.
const ARM_REST = 1.1; const ARM = [Math.cos(ARM_REST), -Math.sin(ARM_REST)] as const;

type Run = [end: number, cells: number];
const lines = (start: number, runs: Run[]) => runs.reduce((out, [end, cells]) => {
  const from = out.at(-1)!;
  for (let i = 1; i <= cells; i += 1) out.push(from + (end - from) * i / cells);
  return out;
}, [start]);
// Sampling planes per axis: fine cells around the arms and feet, coarse ones on the body.
// MarchingCubes samples a cube, so every axis has 42 cells and the last run of y and z is padding.
const half = lines(0, [[0.39, 11], [0.59, 8], [0.65, 2]]);
const AXES = [
  [...half.slice(1).reverse().map((x) => -x), ...half],
  lines(-0.06, [[-0.015, 1], [0.125, 7], [0.25, 3], [0.53, 11], [1.01, 11], [1.1, 2], [1.3, 7]]),
  lines(-0.47, [[-0.42, 1], [-0.1, 8], [0.1, 8], [0.22, 5], [0.4, 5], [0.48, 2], [1, 13]]),
];
const SIZE = AXES[0]!.length - 1;

const gradient = [0, 0, 0];
// The body as a level set that is 1 on the surface. Leaves its gradient in `gradient`.
function level(x: number, y: number, z: number) {
  const up = y > MID; const n = up ? 2.5 : 3; const h = up ? 1 - MID : MID - 0.05;
  const r = Math.hypot(x / WIDE, z / DEEP); const v = Math.abs(y - MID) / h;
  const g = (r ** n + v ** n) ** (1 / n) || 1e-9; const k = g ** (1 - n);
  gradient[0] = k * r ** (n - 2) * x / WIDE ** 2; gradient[1] = (up ? k : -k) * v ** (n - 1) / h; gradient[2] = k * r ** (n - 2) * z / DEEP ** 2;
  return g;
}
const bodyDistance = (x: number, y: number, z: number) => (level(x, y, z) - 1) / (Math.hypot(gradient[0]!, gradient[1]!, gradient[2]!) || 1);
// K01 arm: 0.14 thick and 0.24 long from the shoulder.
function armDistance(x: number, y: number, z: number) {
  const dx = x - SHOULDER[0]; const dy = y - SHOULDER[1];
  const along = Math.min(Math.max(dx * ARM[0] + dy * ARM[1], 0), 0.17);
  return Math.hypot(dx - along * ARM[0], dy - along * ARM[1], z) - 0.07;
}
// K01 foot: 0.17 x 0.10 x 0.20, 0.30 apart.
function footDistance(x: number, y: number, z: number) {
  const k0 = Math.hypot((x - 0.15) / 0.085, (y - 0.05) / 0.05, (z - 0.06) / 0.1); const k1 = Math.hypot((x - 0.15) / 0.085 ** 2, (y - 0.05) / 0.05 ** 2, (z - 0.06) / 0.1 ** 2);
  return k1 ? k0 * (k0 - 1) / k1 : -0.05;
}
// Union that rounds the join over a band of width k instead of leaving a crease.
const blend = (a: number, b: number, k: number) => Math.min(a, b) - Math.max(k - Math.abs(a - b), 0) ** 2 / (4 * k);
function distance(x: number, y: number, z: number) {
  const side = Math.abs(x);
  return blend(blend(bodyDistance(side, y, z), armDistance(side, y, z), 0.06), footDistance(side, y, z), 0.035);
}

const front = { z: 0, normal: [0, 0, 1] as [number, number, number] };
/** Where the front of the body is at (x, y) and which way it faces there. Returns one shared object, so read it before the next call. */
export function bodyFront(x: number, y: number) {
  const up = y > MID; const n = up ? 2.5 : 3; const h = up ? 1 - MID : MID - 0.05;
  front.z = DEEP * Math.sqrt((1 - (Math.abs(y - MID) / h) ** n) ** (2 / n) - (x / WIDE) ** 2);
  level(x, y, front.z);
  const length = Math.hypot(gradient[0]!, gradient[1]!, gradient[2]!);
  front.normal[0] = gradient[0]! / length; front.normal[1] = gradient[1]! / length; front.normal[2] = gradient[2]! / length;
  return front;
}

// The scarf: a strip of the body shell, 0.10 wide, on the drawn slant from 0.55 of the height on the left side to 0.36 on the right.
export function makeAroomiScarf() {
  const band = new CylinderGeometry(1, 1, 1, 48, 2, true);
  const positions = band.getAttribute('position'); const normals = band.getAttribute('normal');
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i) * WIDE; const z = positions.getZ(i) * DEEP; const lift = 0.455 + positions.getY(i) * 0.1025;
    let inside = 0; let outside = 1.2;
    for (let step = 0; step < 20; step += 1) {
      const reach = (inside + outside) / 2;
      if (level(x * reach, lift + 0.226 * x * reach, z * reach) < 1) inside = reach; else outside = reach;
    }
    level(x * inside, lift + 0.226 * x * inside, z * inside);
    const length = Math.hypot(gradient[0]!, gradient[1]!, gradient[2]!);
    normals.setXYZ(i, gradient[0]! / length, gradient[1]! / length, gradient[2]! / length);
    positions.setXYZ(i, x * inside + normals.getX(i) * 0.012, lift + 0.226 * x * inside + normals.getY(i) * 0.012, z * inside + normals.getZ(i) * 0.012);
  }
  return band;
}

// The scarf's knot and its two leaf-shaped tails, shaped as on design/mascot/harmonized/mascot_back.png: the knot sits 0.38 from
// the middle and the tails reach about 0.24 outward and down. K01 puts them on the right waist, where the scarf is lowest.
// They sit behind the arm so the arm never crosses them. The geometry is centred on the knot, at `at`, so the tails can swing around it.
export function makeAroomiKnot() {
  const x = -0.38; const y = 0.455 + 0.226 * x; const { z, normal } = bodyFront(x, y);
  const tails = [0.26, 0.87].map((droop, i) => new SphereGeometry(1, 12, 8).scale(0.12, 0.055, 0.015).rotateZ(Math.PI + droop)
    .translate(-Math.cos(droop) * 0.11, -Math.sin(droop) * 0.11, -0.01 - i * 0.02));
  return { geometry: mergeGeometries([new SphereGeometry(0.045, 12, 8), ...tails]), at: [x + normal[0] * 0.03, y + normal[1] * 0.03, -z - normal[2] * 0.03] as [number, number, number] };
}

// One closed skin for body, arms and feet. `follow` is how far each vertex goes with its arm, negative on -x.
export function makeAroomiBody() {
  const surface = new MarchingCubes(SIZE, new MeshStandardMaterial());
  surface.isolation = 0;
  for (let z = 0; z < SIZE; z += 1) for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) surface.field[(z * SIZE + y) * SIZE + x] = -distance(AXES[0]![x]!, AXES[1]![y]!, AXES[2]![z]!);
  surface.update();
  const sampled = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(surface.geometry.getAttribute('position').array.slice(0, surface.count * 3), 3));
  const geometry = mergeVertices(sampled);
  surface.geometry.dispose(); (surface.material as MeshStandardMaterial).dispose(); sampled.dispose();
  const positions = geometry.getAttribute('position'); const normals = new Float32Array(positions.count * 3); const follow = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i += 1) {
    const [x, y, z] = AXES.map((axis, component) => {
      const at = (positions.getComponent(i, component) + 1) * SIZE / 2; const cell = Math.floor(at);
      return axis[cell]! + (axis[cell + 1]! - axis[cell]!) * (at - cell);
    }) as [number, number, number];
    positions.setXYZ(i, x, y, z);
    const e = 0.002; const n = [distance(x + e, y, z) - distance(x - e, y, z), distance(x, y + e, z) - distance(x, y - e, z), distance(x, y, z + e) - distance(x, y, z - e)]; const length = Math.hypot(...n) || 1;
    normals.set([n[0]! / length, n[1]! / length, n[2]! / length], i * 3);
    // Skin that is nearer the arm than the body goes with the arm, and the join between them bends.
    follow[i] = Math.sign(x) * Math.max(0, Math.min(1, 0.5 + (bodyDistance(Math.abs(x), y, z) - armDistance(Math.abs(x), y, z)) / 0.06));
  }
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  return { geometry, follow, rest: { position: Float32Array.from(positions.array), normal: normals.slice() } };
}

// Lift both arms by `angle` from the resting pose around the shoulders.
// The vertices move here, not in a skinned shader: that second shader program added about 1.5 s to the first draw on the simulator.
export function swingArms({ geometry, follow, rest }: ReturnType<typeof makeAroomiBody>, angle: number) {
  const position = geometry.getAttribute('position'); const normal = geometry.getAttribute('normal');
  const cos = Math.cos(angle) - 1;
  for (let i = 0; i < follow.length; i += 1) {
    const weight = Math.abs(follow[i]!);
    if (!weight) continue;
    const side = Math.sign(follow[i]!); const sin = side * Math.sin(angle);
    const x = rest.position[i * 3]!; const y = rest.position[i * 3 + 1]!; const nx = rest.normal[i * 3]!; const ny = rest.normal[i * 3 + 1]!;
    const dx = x - side * SHOULDER[0]; const dy = y - SHOULDER[1];
    position.setXY(i, x + weight * (dx * cos - dy * sin), y + weight * (dx * sin + dy * cos));
    normal.setXY(i, nx + weight * (nx * cos - ny * sin), ny + weight * (nx * sin + ny * cos));
  }
  position.needsUpdate = true; normal.needsUpdate = true;
}
