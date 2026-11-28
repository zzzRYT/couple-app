import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAroomiBody } from '../../apps/mobile/src/features/planet/aroomiBody.ts';

test('the temporary Aroomi is one closed K01-sized skin within the mobile triangle budget', () => {
  const geometry = makeAroomiBody();
  const index = geometry.index; const positions = geometry.getAttribute('position'); const weights = geometry.getAttribute('skinWeight');
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  assert.deepEqual([max.x - min.x, min.y, max.y, max.z - min.z].map((value) => Math.round(value * 100) / 100 + 0), [1.22, 0, 1, 0.76]);
  assert.ok(index.count / 3 < 8000, `${index.count / 3} triangles`);
  const edges = new Map();
  for (let i = 0; i < index.count; i += 3) for (let corner = 0; corner < 3; corner += 1) {
    const a = index.getX(i + corner); const b = index.getX(i + (corner + 1) % 3); const edge = `${Math.min(a, b)}-${Math.max(a, b)}`;
    edges.set(edge, (edges.get(edge) ?? 0) + 1);
  }
  assert.deepEqual([...edges.values()].filter((uses) => uses % 2), [], 'no open edges');
  for (let i = 0; i < positions.count; i += 1) if (Math.abs(positions.getX(i)) < 0.4) assert.equal(weights.getX(i), 1);
});
