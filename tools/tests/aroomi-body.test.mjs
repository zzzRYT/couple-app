import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAroomiBody, swingArms } from '../../apps/mobile/src/features/planet/aroomiBody.ts';

const size = (geometry) => {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  return [max.x - min.x, min.y, max.y, max.z - min.z].map((value) => Math.round(value * 100) / 100 + 0);
};

test('the temporary Aroomi is one closed K01-sized skin within the mobile triangle budget', () => {
  const body = makeAroomiBody(); const index = body.geometry.index; const positions = body.geometry.getAttribute('position');
  assert.deepEqual(size(body.geometry), [1.22, 0, 1, 0.76]);
  assert.ok(index.count / 3 < 8000, `${index.count / 3} triangles`);
  const edges = new Map();
  for (let i = 0; i < index.count; i += 3) for (let corner = 0; corner < 3; corner += 1) {
    const a = index.getX(i + corner); const b = index.getX(i + (corner + 1) % 3); const edge = `${Math.min(a, b)}-${Math.max(a, b)}`;
    edges.set(edge, (edges.get(edge) ?? 0) + 1);
  }
  assert.deepEqual([...edges.values()].filter((uses) => uses % 2), [], 'no open edges');
  for (let i = 0; i < positions.count; i += 1) if (Math.abs(positions.getX(i)) < 0.4) assert.ok(!body.follow[i]);
});

test('swinging the arms lowers both tips around the shoulders and returns to the rest pose', () => {
  const body = makeAroomiBody();
  swingArms(body, 0.45);
  const [width] = size(body.geometry);
  assert.ok(width > 1.17 && width < 1.2, `width ${width}`);
  swingArms(body, 0);
  assert.deepEqual(size(body.geometry), [1.22, 0, 1, 0.76]);
});
