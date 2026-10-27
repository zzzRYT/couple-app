import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { validateGeneratedObject, validateJsonText, LIMITS } from '../validate.mjs';
import { toSvg } from '../render-svg.mjs';

// The largest document the structural limits allow: 40 shapes (maximum), a 48-command path, a 24-point poly,
// complexity just under 60, bubble cover test included.
function largest() {
  const shapes = [{ t: 'ellipse', fill: 0, stroke: true, cx: 256, cy: 190, rx: 240, ry: 180 }];
  for (let i = 0; i < 37; i++) shapes.push({ t: i % 2 ? 'rect' : 'ellipse', fill: 1 + (i % 3), stroke: i % 3 === 0, ...(i % 2 ? { x: 10 + (i % 8) * 60, y: 380 + (i % 3) * 20, w: 30.55, h: 20.25, rx: 4.5 } : { cx: 30 + (i % 9) * 55.55, cy: 450, rx: 12.25, ry: 8.75 }) });
  shapes.push({ t: 'path', fill: 1, stroke: true, d: 'M20 20' + 'C30.55 10.25 40.75 40.5 50.25 30.75'.repeat(1) + 'L60.5 20.5Q70.25 10.5 80.5 20.25'.repeat(1) + 'L90 30'.repeat(40) + 'Z' });
  shapes.push({ t: 'poly', fill: 2, stroke: false, pts: Array.from({ length: 24 }, (_, i) => [450 + Math.round(40 * Math.cos(i / 24 * 6.2832) * 100) / 100, 400 + Math.round(40 * Math.sin(i / 24 * 6.2832) * 100) / 100]) });
  return { schemaVersion: 1, format: 'mopi-shape-v1', kind: 'bubble_frame', label: 'Largest bubble', viewBox: { w: 512, h: 512 }, anchor: { x: 0.5, y: 0.9 }, palette: ['#FFF4DF', '#F4B79B', '#A8C6A0', '#AACBE2'], shapes, textArea: { x: 100, y: 100, w: 300, h: 160 }, textFill: 0, tail: { x: 256, y: 500 } };
}

const median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

test('the largest allowed document validates in under 50 ms', t => {
  const doc = largest();
  const r = validateGeneratedObject(doc);
  assert.deepEqual(r.errors, []);
  assert.equal(r.stats.shapes, LIMITS.maxShapes);
  assert.ok(r.stats.complexityScore <= LIMITS.maxComplexity && r.stats.complexityScore > 50, `complexity ${r.stats.complexityScore}`);
  for (let i = 0; i < 10; i++) validateGeneratedObject(doc); // warm up
  const times = [];
  for (let i = 0; i < 30; i++) { const t0 = performance.now(); validateGeneratedObject(doc); times.push(performance.now() - t0); }
  t.diagnostic(`validate(largest): median ${median(times).toFixed(3)} ms, max ${Math.max(...times).toFixed(3)} ms, ${r.stats.bytes} bytes`);
  assert.ok(Math.max(...times) < 50, `max ${Math.max(...times)} ms`);
});

test('a text document at the byte limit validates in under 50 ms and renders quickly', t => {
  const doc = largest();
  const base = JSON.stringify(doc, null, 1);
  const text = base + ' '.repeat(LIMIT_MINUS(base));
  assert.ok(Buffer.byteLength(text) > LIMITS.maxBytes - 20 && Buffer.byteLength(text) <= LIMITS.maxBytes);
  assert.equal(validateJsonText(text).ok, true);
  const times = [];
  for (let i = 0; i < 30; i++) { const t0 = performance.now(); validateJsonText(text); times.push(performance.now() - t0); }
  const rt = [];
  for (let i = 0; i < 10; i++) { const t0 = performance.now(); toSvg(doc); rt.push(performance.now() - t0); }
  t.diagnostic(`validateJsonText(~12 KB): median ${median(times).toFixed(3)} ms, max ${Math.max(...times).toFixed(3)} ms; toSvg median ${median(rt).toFixed(3)} ms`);
  assert.ok(Math.max(...times) < 50);
});

test('hostile inputs stay cheap', () => {
  const nasty = ['{"a":' .repeat(8) + '1' + '}'.repeat(8), '['.repeat(100000), '"' + 'a'.repeat(11000) + '\\'.repeat(100) + '"', '{"k":[' + '1,'.repeat(5000) + '1]}', 'M0 0' + 'L1 1'.repeat(150000)];
  for (const s of nasty) { const t0 = performance.now(); validateJsonText(s); assert.ok(performance.now() - t0 < 50, `slow on ${s.slice(0, 20)}`); }
  const manyPoints = largest(); manyPoints.shapes[39].pts = Array.from({ length: 5000 }, () => [1, 1]);
  const t0 = performance.now(); const r = validateGeneratedObject(manyPoints);
  assert.equal(r.ok, false); assert.ok(performance.now() - t0 < 50);
});

function LIMIT_MINUS(s) { return LIMITS.maxBytes - Buffer.byteLength(s) - 1; }
