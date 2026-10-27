import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { toSvg } from '../render-svg.mjs';
import { strokeMetrics, STYLE } from '../validate.mjs';
import { SAMPLES, LIBRARY, jsonFiles, readJson, libraryIndex } from './paths.mjs';

const docs = [
  ...jsonFiles(join(SAMPLES, 'valid')).map(f => readJson(join(SAMPLES, 'valid', f))),
  ...libraryIndex().objects.map(o => readJson(join(LIBRARY, o.file))),
];

test('stroke metrics follow the measured house ratios', () => {
  assert.deepEqual(strokeMetrics({ w: 64, h: 64 }), { outline: 2.4, rim: 5.8, offsetX: 1.3, offsetY: 1 });
  assert.deepEqual(strokeMetrics({ w: 192, h: 80 }), { outline: 7.2, rim: 17.4, offsetX: 3.9, offsetY: 3 });
  assert.deepEqual(strokeMetrics({ w: 128, h: 96 }), { outline: 4.8, rim: 11.6, offsetX: 2.6, offsetY: 2 });
});

test('svg output only contains allowlisted elements and attributes (no script, href, style, event handlers)', () => {
  const tags = new Set(['svg', 'title', 'rect', 'ellipse', 'polygon', 'path']);
  const attrs = new Set(['xmlns', 'viewBox', 'width', 'height', 'x', 'y', 'rx', 'ry', 'cx', 'cy', 'd', 'points', 'fill', 'stroke', 'stroke-width', 'stroke-linejoin', 'stroke-linecap', 'transform']);
  for (const doc of docs) for (const opts of [{}, { background: 'night', pad: 12, scale: 2 }]) {
    const svg = toSvg(doc, opts);
    for (const m of svg.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) assert.ok(tags.has(m[1]), `tag ${m[1]}`);
    for (const m of svg.matchAll(/\s([a-zA-Z:-]+)="/g)) assert.ok(attrs.has(m[1]), `attribute ${m[1]}`);
    assert.doesNotMatch(svg, /script|javascript|href|style=|on[a-z]+=|<!|\]\]>|&#/i);
    assert.doesNotMatch(svg, /NaN|undefined|Infinity|e[+-]\d/);
  }
});

test('draw order: rim pass first, then fill (offset) and outline per shape', () => {
  const doc = { schemaVersion: 1, format: 'aroomi-shape-v1', kind: 'background_piece', layerHint: 'wall', label: 'Two', viewBox: { w: 128, h: 128 }, anchor: { x: 0.5, y: 0.5 }, palette: ['#F4B79B', '#A8C6A0'], shapes: [{ t: 'rect', fill: 0, stroke: true, x: 10, y: 10, w: 50, h: 50 }, { t: 'ellipse', fill: 1, stroke: false, cx: 90, cy: 90, rx: 20, ry: 20 }, { t: 'path', fill: null, stroke: true, d: 'M10 100L60 100' }] };
  const lines = toSvg(doc).split('\n');
  const m = strokeMetrics(doc.viewBox);
  const rim = lines.filter(l => l.includes(`stroke="${STYLE.rim}"`));
  assert.equal(rim.length, 2, 'only stroked shapes get a rim');
  assert.ok(rim.every(l => l.includes(`stroke-width="${m.rim}"`)));
  assert.ok(rim[0].includes(`fill="${STYLE.rim}"`) && rim[1].includes('fill="none"'));
  const firstFill = lines.findIndex(l => l.includes('transform="translate('));
  assert.ok(lines.indexOf(rim[1]) < firstFill, 'every rim comes before the first fill');
  assert.equal(lines.filter(l => l.includes('transform=')).length, 2, 'two filled shapes are offset');
  assert.ok(lines.filter(l => l.includes('transform=')).every(l => l.includes(`translate(${m.offsetX} ${m.offsetY})`)));
  const outlines = lines.filter(l => l.includes(`stroke="${STYLE.outline}"`));
  assert.equal(outlines.length, 2);
  assert.ok(outlines.every(l => l.includes(`stroke-width="${m.outline}"`) && l.includes('stroke-linejoin="round"') && l.includes('fill="none"')));
  assert.ok(lines[0].includes('viewBox="0 0 128 128"') && lines[1] === '<title>Two</title>');
});

test('background, pad and scale options', () => {
  const doc = docs[0];
  const { w, h } = doc.viewBox;
  const svg = toSvg(doc, { background: 'night', scale: 2, pad: 10 });
  assert.ok(svg.includes(`viewBox="-10 -10 ${w + 20} ${h + 20}"`) && svg.includes(`width="${(w + 20) * 2}"`));
  assert.ok(svg.includes(`fill="${STYLE.roomColors.night.wall}"`));
  assert.ok(toSvg(doc, { background: 'day' }).includes(`fill="${STYLE.roomColors.day.wall}"`));
  assert.ok(toSvg(doc, { background: 'night', surface: 'floor' }).includes(`fill="${STYLE.roomColors.night.floor}"`));
  assert.ok(!toSvg(doc).includes('<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#FBF1E3"'));
  assert.throws(() => toSvg(doc, { background: 'red' }), /background/);
  assert.throws(() => toSvg(doc, { scale: 0 }), /scale/);
  assert.throws(() => toSvg(doc, { pad: -1 }), /pad/);
});

test('output does not depend on key order or number spelling in the input', () => {
  const a = docs[0];
  const b = JSON.parse(JSON.stringify(a), (k, v) => v);
  const shuffled = Object.fromEntries(Object.entries(b).reverse());
  shuffled.shapes = shuffled.shapes.map(s => Object.fromEntries(Object.entries(s).reverse()));
  assert.equal(toSvg(shuffled), toSvg(a));
});
