import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAroomiBody, makeAroomiKnot, makeAroomiScarf, swingArms } from '../../apps/mobile/src/features/planet/aroomiBody.ts';

const size = (geometry) => {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  return [max.x - min.x, min.y, max.y, max.z - min.z].map((value) => Math.round(value * 100) / 100 + 0);
};
// Half width of the body on design/mascot/harmonized/mascot_wave_main.png as a share of its widest row, by height
// above the soles as a share of the full height. Rows crossed by an arm, the sash tail or a foot are left out.
const DRAWN = [[0.912, 0.667], [0.857, 0.766], [0.803, 0.844], [0.748, 0.909], [0.721, 0.935], [0.612, 0.99], [0.422, 1], [0.34, 1], [0.231, 0.941], [0.177, 0.882], [0.15, 0.836]];

test('the temporary Aroomi is one closed K01-sized skin within the mobile triangle budget', () => {
  const body = makeAroomiBody(); const index = body.geometry.index;
  assert.deepEqual(size(body.geometry), [1.03, 0, 1, 0.76]);
  assert.ok(index.count / 3 < 8000, `${index.count / 3} triangles`);
  const edges = new Map();
  for (let i = 0; i < index.count; i += 3) for (let corner = 0; corner < 3; corner += 1) {
    const a = index.getX(i + corner); const b = index.getX(i + (corner + 1) % 3); const edge = `${Math.min(a, b)}-${Math.max(a, b)}`;
    edges.set(edge, (edges.get(edge) ?? 0) + 1);
  }
  assert.deepEqual([...edges.values()].filter((uses) => uses % 2), [], 'no open edges');
});

test('the body outline follows the drawn Aroomi', () => {
  const positions = makeAroomiBody().geometry.getAttribute('position'); const back = [];
  for (let i = 0; i < positions.count; i += 1) if (Math.abs(positions.getX(i)) < 0.02 && positions.getZ(i) < 0) back.push([positions.getY(i), -positions.getZ(i) / 0.38]);
  back.sort((a, b) => a[0] - b[0]);
  for (const [height, share] of DRAWN) {
    const above = back.findIndex(([y]) => y >= height); const [y0, s0] = back[above - 1]; const [y1, s1] = back[above];
    const modelled = s0 + (s1 - s0) * (height - y0) / (y1 - y0);
    assert.ok(Math.abs(modelled - share) < 0.03, `at ${height} of the height the body is ${modelled.toFixed(3)} of its widest, drawn ${share}`);
  }
});

test('the arms rest lowered and lift around the shoulders without moving the body', () => {
  const body = makeAroomiBody(); const positions = body.geometry.getAttribute('position');
  let tip = 0; for (let i = 0; i < positions.count; i += 1) if (positions.getX(i) > positions.getX(tip)) tip = i;
  assert.ok(positions.getY(tip) > 0.26 && positions.getY(tip) < 0.34, `arm tip at height ${positions.getY(tip)}`);
  for (let i = 0; i < positions.count; i += 1) if (positions.getY(i) > 0.6 || positions.getY(i) < 0.15) assert.ok(!body.follow[i]);
  swingArms(body, 0.3);
  assert.ok(positions.getY(tip) > 0.34, `lifted arm tip at height ${positions.getY(tip)}`);
  swingArms(body, 0);
  assert.deepEqual(size(body.geometry), [1.03, 0, 1, 0.76]);
});

test('the scarf follows the drawn slant and its knot and tails sit behind the right arm', () => {
  const scarf = makeAroomiScarf().getAttribute('position'); const sides = { left: [], right: [] };
  for (let i = 0; i < scarf.count; i += 1) if (Math.abs(scarf.getX(i)) > 0.4) sides[scarf.getX(i) > 0 ? 'left' : 'right'].push(scarf.getY(i));
  const middle = (heights) => (Math.min(...heights) + Math.max(...heights)) / 2;
  assert.ok(Math.abs(middle(sides.left) - 0.55) < 0.02 && Math.abs(middle(sides.right) - 0.36) < 0.02, `scarf at ${middle(sides.left)} and ${middle(sides.right)}`);
  const { geometry: knot, at } = makeAroomiKnot(); knot.computeBoundingBox(); const { min, max } = knot.boundingBox;
  assert.ok(at[0] + max.x < -0.36 && at[0] + min.x > -0.66 && at[0] + min.x < -0.6, `knot and tails span x ${at[0] + min.x} to ${at[0] + max.x}`);
  assert.ok(at[2] + max.z < -0.1, `knot and tails come forward to z ${at[2] + max.z}, the arm reaches back to -0.1`);
});
