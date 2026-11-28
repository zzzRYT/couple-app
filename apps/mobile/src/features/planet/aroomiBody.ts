import { BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, Uint16BufferAttribute } from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Body half extents from the K01 dimension table (height 1, soles at y 0).
export const BODY = [0.42, 0.5, 0.38] as const;

type Run = [end: number, cells: number];
const lines = (start: number, runs: Run[]) => runs.reduce((out, [end, cells]) => {
  const from = out.at(-1)!;
  for (let i = 1; i <= cells; i += 1) out.push(from + (end - from) * i / cells);
  return out;
}, [start]);
// Sampling planes per axis: fine cells around the arms and feet, coarse ones on the body.
// MarchingCubes samples a cube, so every axis has 40 cells and the last run of y and z is padding.
const half = lines(0, [[0.39, 11], [0.47, 3], [0.54, 1], [0.62, 3], [0.72, 2]]);
const AXES = [
  [...half.slice(1).reverse().map((x) => -x), ...half],
  lines(-0.06, [[-0.015, 1], [0.125, 7], [0.35, 5], [0.53, 8], [1.01, 12], [1.1, 2], [1.3, 5]]),
  lines(-0.47, [[-0.42, 1], [-0.1, 8], [0.1, 8], [0.22, 5], [0.4, 5], [0.48, 2], [1, 11]]),
];
const SIZE = AXES[0]!.length - 1;

const ellipsoid = (x: number, y: number, z: number, rx: number, ry: number, rz: number) => {
  const k0 = Math.hypot(x / rx, y / ry, z / rz); const k1 = Math.hypot(x / rx ** 2, y / ry ** 2, z / rz ** 2);
  return k1 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
};
// Union that rounds the join over a band of width k instead of leaving a crease.
const blend = (a: number, b: number, k: number) => Math.min(a, b) - Math.max(k - Math.abs(a - b), 0) ** 2 / (4 * k);
// Signed distance to the body with K01 arms (0.14 thick, tips at 0.61) and feet (0.17 x 0.10 x 0.20, 0.30 apart).
function distance(x: number, y: number, z: number) {
  const side = Math.abs(x);
  const arm = Math.hypot(side - Math.min(Math.max(side, 0.3), 0.54), y - 0.44, z) - 0.07;
  const foot = ellipsoid(side - 0.15, y - 0.05, z - 0.09, 0.085, 0.05, 0.1);
  return blend(blend(ellipsoid(side, y - 0.5, z, ...BODY), arm, 0.06), foot, 0.035);
}

// One closed skin for body, arms and feet. Bone 0 is the body, bones 1 and 2 the arms at -x and +x.
export function makeAroomiBody() {
  const surface = new MarchingCubes(SIZE, new MeshStandardMaterial());
  surface.isolation = 0;
  for (let z = 0; z < SIZE; z += 1) for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) surface.field[(z * SIZE + y) * SIZE + x] = -distance(AXES[0]![x]!, AXES[1]![y]!, AXES[2]![z]!);
  surface.update();
  const sampled = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(surface.geometry.getAttribute('position').array.slice(0, surface.count * 3), 3));
  const geometry = mergeVertices(sampled);
  surface.geometry.dispose(); (surface.material as MeshStandardMaterial).dispose(); sampled.dispose();
  const positions = geometry.getAttribute('position'); const normals: number[] = []; const bones: number[] = []; const weights: number[] = [];
  for (let i = 0; i < positions.count; i += 1) {
    const [x, y, z] = AXES.map((axis, component) => {
      const at = (positions.getComponent(i, component) + 1) * SIZE / 2; const cell = Math.floor(at);
      return axis[cell]! + (axis[cell + 1]! - axis[cell]!) * (at - cell);
    }) as [number, number, number];
    positions.setXYZ(i, x, y, z);
    const e = 0.002; const n = [distance(x + e, y, z) - distance(x - e, y, z), distance(x, y + e, z) - distance(x, y - e, z), distance(x, y, z + e) - distance(x, y, z - e)]; const length = Math.hypot(...n) || 1;
    normals.push(n[0]! / length, n[1]! / length, n[2]! / length);
    // The shoulder fillet bends between the body bone and the arm bone.
    const arm = Math.max(0, Math.min(1, (Math.abs(x) - 0.4) / 0.06));
    bones.push(0, x < 0 ? 1 : 2, 0, 0); weights.push(1 - arm, arm, 0, 0);
  }
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(bones, 4));
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(weights, 4));
  return geometry;
}
