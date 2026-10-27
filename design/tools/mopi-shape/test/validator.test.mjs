import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateGeneratedObject as V, validateJsonText as VT, contrastRatio, parsePath, serializePath, normalizeGeneratedObject, labelProblem, LIMITS, PALETTE_ALLOWLIST } from '../validate.mjs';

const bg = () => ({ schemaVersion: 1, format: 'mopi-shape-v1', kind: 'background_piece', layerHint: 'wall', label: 'Dots patch', viewBox: { w: 128, h: 128 }, anchor: { x: 0.5, y: 0.5 }, palette: ['#FFF4DF', '#F4B79B'], shapes: [{ t: 'rect', fill: 0, stroke: true, x: 8, y: 8, w: 112, h: 112, rx: 14 }, { t: 'ellipse', fill: 1, stroke: false, cx: 64, cy: 64, rx: 20, ry: 20 }] });
const bubble = () => ({ schemaVersion: 1, format: 'mopi-shape-v1', kind: 'bubble_frame', label: 'Round bubble', viewBox: { w: 128, h: 96 }, anchor: { x: 0.2, y: 0.95 }, palette: ['#FFF4DF', '#F2A7B4'], shapes: [{ t: 'ellipse', fill: 0, stroke: true, cx: 64, cy: 44, rx: 56, ry: 38 }], textArea: { x: 32, y: 26, w: 64, h: 36 }, textFill: 0 });
const code = r => r.errors[0]?.code ?? 'OK';

test('baseline documents are valid', () => {
  assert.equal(V(bg()).ok, true);
  assert.equal(V(bubble()).ok, true);
});

test('contrast ratio follows WCAG', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#FFFFFF')), 21);
  assert.ok(Math.abs(contrastRatio('#FFFFFF', '#FFFFFF') - 1) < 1e-9);
  assert.ok(contrastRatio('#FFF4DF', '#3A261C') > 12);
  assert.ok(contrastRatio('#7A5C48', '#3A261C') < 4.5);
});

test('guard: odd inputs never throw and give a stable code', () => {
  const cyc = bg(); cyc.self = cyc;
  const getter = bg(); Object.defineProperty(getter, 'label', { enumerable: true, get() { throw new Error('boom'); } });
  class Foo { constructor() { this.a = 1; } }
  const fn = bg(); fn.shapes[0].fill = () => 0;
  const deep = bg(); let p = deep; for (let i = 0; i < 50; i++) { p.n = {}; p = p.n; }
  const big = bg(); big.shapes = new Array(5000).fill(0);
  const sparse = bg(); sparse.shapes = new Array(3); sparse.shapes[1] = {};
  for (const [name, input, want] of [['null', null, 'SCHEMA_TYPE'], ['array', [], 'SCHEMA_TYPE'], ['string', 'x', 'SCHEMA_TYPE'], ['number', 5, 'SCHEMA_TYPE'], ['undefined', undefined, 'SCHEMA_TYPE'], ['cyclic', cyc, 'SCHEMA_TYPE'], ['getter', getter, 'SCHEMA_TYPE'], ['class', new Foo(), 'SCHEMA_TYPE'], ['function value', fn, 'SCHEMA_TYPE'], ['deep', deep, 'SCHEMA_TYPE'], ['huge array', big, 'SCHEMA_TYPE'], ['sparse array', sparse, 'SCHEMA_TYPE']]) {
    let r;
    assert.doesNotThrow(() => { r = V(input); }, name);
    assert.equal(r.ok, false, name);
    assert.equal(code(r), want, name);
  }
  const nan = bg(); nan.shapes[0].x = NaN;
  assert.equal(code(V(nan)), 'SCHEMA_TYPE');
  const inf = bg(); inf.shapes[0].x = Infinity;
  assert.equal(code(V(inf)), 'SCHEMA_TYPE');
});

test('guard: forbidden keys win over everything and are found at any depth', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    for (const where of ['top', 'shape', 'viewBox']) {
      const d = bg();
      const target = where === 'top' ? d : where === 'shape' ? d.shapes[0] : d.viewBox;
      Object.defineProperty(target, key, { value: { x: 1 }, enumerable: true, configurable: true, writable: true });
      const r = V(d);
      assert.equal(code(r), 'FORBIDDEN_KEY', `${key} in ${where}`);
      assert.ok(r.errors.every(e => e.code === 'FORBIDDEN_KEY'));
    }
  }
  assert.equal(code(VT('{"a":{"b":[{"__proto__":1}]}}')), 'FORBIDDEN_KEY');
});

test('text entry: size, BOM, syntax, duplicates, depth', () => {
  assert.equal(code(VT(5)), 'SCHEMA_TYPE');
  assert.equal(code(VT('')), 'JSON_SYNTAX');
  assert.equal(code(VT('﻿{}')), 'JSON_SYNTAX');
  assert.equal(code(VT('{"a":1,}')), 'JSON_SYNTAX');
  assert.equal(code(VT('{"a":1} x')), 'JSON_SYNTAX');
  assert.equal(code(VT("{'a':1}")), 'JSON_SYNTAX');
  assert.equal(code(VT('{"a":01}')), 'JSON_SYNTAX');
  assert.equal(code(VT('{"a":1e999}')), 'JSON_SYNTAX');
  assert.equal(code(VT('{"a":"\\ud800"}')), 'JSON_SYNTAX');
  assert.equal(code(VT('{"a":"x\ny"}')), 'JSON_SYNTAX');
  assert.equal(code(VT('[[[[[[[[[[1]]]]]]]]]]')), 'JSON_SYNTAX');
  assert.equal(code(VT('{"a":1,"a":1}')), 'JSON_DUPLICATE_KEY');
  assert.equal(code(VT('{"a":{"b":1,"b":2}}')), 'JSON_DUPLICATE_KEY');
  assert.equal(code(VT('[]')), 'SCHEMA_TYPE');
  assert.equal(code(VT(' '.repeat(LIMITS.maxBytes + 1))), 'LIMIT_BYTES');
  assert.equal(code(VT('{' + '"k":"' + 'x'.repeat(LIMITS.maxBytes) + '"}')), 'LIMIT_BYTES');
  // multibyte text is measured in bytes, not characters
  assert.equal(code(VT('["' + '모'.repeat(4200) + '"]')), 'LIMIT_BYTES');
  assert.equal(VT(JSON.stringify(bg())).ok, true);
});

test('object route measures canonical bytes', () => {
  const d = bg(); d.shapes = Array.from({ length: 40 }, () => ({ t: 'path', fill: 0, stroke: true, d: 'M10 10C' + '10.55 10.55 '.repeat(2) + '20.55 20.55L30 30Z'.repeat(1) }));
  const r = V(d);
  assert.ok(r.stats.bytes > 0);
  const huge = bg(); huge.extra = 'x'.repeat(LIMITS.maxBytes);
  assert.equal(code(V(huge)), 'LIMIT_BYTES');
});

test('labels', () => {
  for (const ok of ['모피 방', 'Sofa-1', "It's ok", 'ありがとう', 'ABC, def.', 'a', 'x'.repeat(24), '가'.repeat(24)]) assert.equal(labelProblem(ok), null, ok);
  for (const bad of ['', ' lead', 'trail ', 'a  b', 'x.com', 'a_b', 'hi!', '😀', '\u0000a', 'ａｂｃ', '1234567', '010-1234-5678', '12345', 'a@b', '<b>', 'x'.repeat(25), 'go to www.a.b', 'ftp://x', 'tab\there', 'line\nbreak', 'ｗｗｗ', 'data:text']) assert.notEqual(labelProblem(bad), null, JSON.stringify(bad));
  assert.notEqual(labelProblem(5), null);
});

test('path parser: accepted forms', () => {
  const ok = ['M0 0L10 10', 'M0,0 L10,10Z', 'M1.5 2.25H10V20Z', 'M0 0C1 1 2 2 3 3Q4 4 5 5Z', 'M-5 -5L-1.5 -2', 'M10 10 L20 20 M30 30 L40 40Z'];
  for (const d of ok) { const r = parsePath(d); assert.ok(r.cmds, d); assert.equal(parsePath(serializePath(r.cmds)).cmds.length, r.cmds.length); }
  assert.equal(serializePath(parsePath('M0,0 L10.50,10Z').cmds), 'M0 0L10.5 10Z');
});

test('path parser: rejected forms and codes', () => {
  const bad = {
    'M0 0A5 5 0 0 1 10 10': 'PATH_COMMAND', 'm0 0l10 10': 'PATH_COMMAND', 'M0 0S1 1 2 2': 'PATH_COMMAND', 'M0 0T5 5': 'PATH_COMMAND', 'M0 0B1': 'PATH_COMMAND', 'M0 0 z': 'PATH_COMMAND',
    'M0 0L1e2 5': 'PATH_NUMBER', 'M0 0L1E2 5': 'PATH_NUMBER', 'M0 0LNaN 5': 'PATH_NUMBER', 'M0 0LInfinity 5': 'PATH_NUMBER', 'M0 0L-Infinity 5': 'PATH_NUMBER', 'M0 0L.5 5': 'PATH_NUMBER', 'M0 0L+5 5': 'PATH_NUMBER', 'M0 0L1.234 5': 'PATH_NUMBER', 'M0 0L1.2.3 5': 'PATH_NUMBER',
    'L0 0L5 5': 'PATH_SYNTAX', 'M0 0': 'PATH_SYNTAX', 'M0': 'PATH_SYNTAX', 'M0 0L5': 'PATH_SYNTAX', 'M0 0L5 5 6 6': 'PATH_SYNTAX', 'M0 0L5-5': 'PATH_SYNTAX', 'M0 0L5;5': 'PATH_SYNTAX', 'M0 0\nL5 5': 'PATH_SYNTAX', 'M0 0L5 5 Z 7': 'PATH_SYNTAX', '': 'LIMIT_PATH',
  };
  for (const [d, want] of Object.entries(bad)) assert.equal(parsePath(d).error?.code, want, JSON.stringify(d));
  assert.equal(parsePath('M0 0' + 'L1 1'.repeat(48)).error?.code, 'LIMIT_PATH');
  assert.equal(parsePath('M0 0' + 'L1 1'.repeat(47)).error, undefined);
  assert.equal(parsePath('M0 0L' + '1'.repeat(600)).error?.code, 'LIMIT_PATH');
  assert.equal(parsePath(5).error?.code, 'SCHEMA_TYPE');
});

test('shape rules', () => {
  const t = (mut, want) => { const d = bg(); mut(d); assert.equal(code(V(d)), want, JSON.stringify(d.shapes[1])); };
  t(d => { d.shapes[1].fill = null; d.shapes[1].stroke = false; }, 'SHAPE_INVISIBLE');
  t(d => { d.shapes[1].fill = 1.5; }, 'PALETTE_INDEX');
  t(d => { d.shapes[1].fill = -1; }, 'PALETTE_INDEX');
  t(d => { d.shapes[1].stroke = 1; }, 'SCHEMA_TYPE');
  t(d => { d.shapes[1].rx = -3; }, 'ZERO_AREA');
  t(d => { d.shapes[1].cx = -8.01; }, 'RANGE_COORD');
  t(d => { d.shapes[1].cx = 20; d.shapes[1].rx = 29; }, 'RANGE_COORD');
  t(d => { d.shapes[1] = { t: 'rect', fill: 1, stroke: false, x: 0, y: 0, w: 10, h: 10, rx: 6 }; }, 'RANGE_SIZE');
  t(d => { d.shapes[1] = { t: 'rect', fill: 1, stroke: false, x: -8, y: -8, w: 144, h: 144 }; }, 'OK');
  t(d => { d.shapes[1] = { t: 'rect', fill: 1, stroke: false, x: -8, y: -8, w: 144.01, h: 144 }; }, 'RANGE_COORD');
  t(d => { d.shapes[1] = { t: 'poly', fill: 1, stroke: false, pts: [[0, 0], [10, 10], [20, 20]] }; }, 'ZERO_AREA');
  t(d => { d.shapes[1] = { t: 'poly', fill: 1, stroke: false, pts: [[0, 0], [10, 10], [20]] }; }, 'SCHEMA_TYPE');
  t(d => { d.shapes[1] = { t: 'path', fill: 1, stroke: false, d: 'M10 10H50V10Z' }; }, 'ZERO_AREA');
  t(d => { d.shapes[1] = { t: 'path', fill: null, stroke: true, d: 'M10 10H50' }; }, 'OK');
  t(d => { d.shapes[1] = { t: 'path', fill: null, stroke: true, d: 'M10 10H10' }; }, 'ZERO_AREA');
  t(d => { d.shapes[1] = { t: 'path', fill: 1, stroke: false, d: 'M10 10L5000 20L30 30Z' }; }, 'RANGE_COORD');
  t(d => { d.shapes[1] = { t: 'path', fill: 1, stroke: false, d: 'M10 10C10 10 200 200 30 30Z' }; }, 'RANGE_COORD');
  t(d => { d.shapes[1] = { t: 'path', fill: 1, stroke: false, d: 'M10 10H200V20Z' }; }, 'RANGE_COORD');
  t(d => { d.shapes[1] = 5; }, 'SCHEMA_TYPE');
  t(d => { d.shapes[1] = { fill: 1, stroke: false }; }, 'SCHEMA_MISSING_KEY');
  t(d => { d.shapes[1].t = ['rect']; }, 'SHAPE_TYPE');
  t(d => { d.shapes[1].t = 'constructor'; }, 'SHAPE_TYPE');
});

test('palette rules', () => {
  const t = (colors, want) => { const d = bg(); d.palette = colors; assert.equal(code(V(d)), want, JSON.stringify(colors)); };
  t(['#FFF4DF', '#FFF4DF'], 'PALETTE_COUNT');
  t(['#FFF4DF', '#FFF4DE'], 'PALETTE_NOT_ALLOWED');
  t(['#FFF4DF', 'F4B79B'], 'PALETTE_NOT_ALLOWED');
  t(['#FFF4DF', 'url(#x)'], 'PALETTE_NOT_ALLOWED');
  t(['#FFF4DF', 5], 'SCHEMA_TYPE');
  t(['#FBF1E3', '#F3E0C4'], 'OK');
  const d = bg(); d.palette = 'nope'; assert.equal(code(V(d)), 'SCHEMA_TYPE');
  assert.equal(Object.keys(PALETTE_ALLOWLIST).length, 17);
});

test('viewBox and anchor rules', () => {
  const t = (mut, want) => { const d = bg(); mut(d); assert.equal(code(V(d)), want); };
  t(d => { d.viewBox = { w: 128.5, h: 128 }; }, 'SCHEMA_TYPE');
  t(d => { d.viewBox = { w: 128, h: 31 }; }, 'RANGE_SIZE');
  t(d => { d.viewBox = { w: 513, h: 128 }; }, 'RANGE_SIZE');
  t(d => { d.viewBox = { w: 127, h: 127 }; }, 'RANGE_SIZE');
  const small = d => { d.shapes = [{ t: 'rect', fill: 0, stroke: true, x: 4, y: 4, w: 20, h: 20, rx: 4 }]; };
  t(d => { d.viewBox = { w: 512, h: 32 }; small(d); }, 'OK');
  t(d => { d.viewBox = { w: 128, h: 32 }; small(d); }, 'OK');
  t(d => { d.viewBox = { w: 128 }; }, 'SCHEMA_MISSING_KEY');
  t(d => { d.anchor = { x: 0.5 }; }, 'SCHEMA_MISSING_KEY');
  t(d => { d.anchor = { x: 0.333, y: 0.5 }; }, 'RANGE_COORD');
  t(d => { d.anchor = { x: -0.1, y: 0.5 }; }, 'RANGE_COORD');
  t(d => { d.schemaVersion = 2; }, 'SCHEMA_TYPE');
  t(d => { d.layerHint = 'ceiling'; }, 'SCHEMA_TYPE');
});

test('complexity score formula', () => {
  const d = bg();
  d.shapes = [{ t: 'rect', fill: 0, stroke: true, x: 8, y: 8, w: 50, h: 50 }, { t: 'path', fill: 1, stroke: false, d: 'M10 10L50 10L50 50L10 50Z' }, { t: 'poly', fill: 1, stroke: false, pts: [[10, 10], [60, 10], [60, 60], [10, 60], [5, 30], [30, 5]] }];
  const r = V(d);
  assert.equal(r.ok, true);
  assert.equal(r.stats.complexityScore, 3 + 5 / 4 + 6 / 6);
  assert.equal(r.stats.shapes, 3);
});

test('bubble: textArea rules', () => {
  const t = (mut, want) => { const d = bubble(); mut(d); assert.equal(code(V(d)), want, JSON.stringify(d.textArea)); };
  t(d => { d.textArea.w = 51.2; d.textArea.x = 38; }, 'OK');
  t(d => { d.textArea.w = 51.1; d.textArea.x = 38; }, 'BUBBLE_TEXTAREA');
  t(d => { d.textArea.h = 23.9; }, 'BUBBLE_TEXTAREA');
  t(d => { d.textArea.x = -1; }, 'BUBBLE_TEXTAREA');
  t(d => { d.textArea.y = 70; }, 'BUBBLE_TEXTAREA');
  t(d => { d.textArea.w = 0; }, 'BUBBLE_TEXTAREA');
  t(d => { d.textArea.w = 64.123; }, 'BUBBLE_TEXTAREA');
  t(d => { d.textArea = 5; }, 'SCHEMA_TYPE');
  t(d => { d.textArea.z = 1; }, 'SCHEMA_UNKNOWN_KEY');
  t(d => { delete d.textArea.h; }, 'SCHEMA_MISSING_KEY');
  t(d => { d.textFill = 2; }, 'PALETTE_INDEX');
  t(d => { d.textFill = '0'; }, 'SCHEMA_TYPE');
  t(d => { d.tail = { x: 64, y: 104 }; }, 'OK');
  t(d => { d.tail = { x: 64, y: 104.5 }; }, 'RANGE_COORD');
  t(d => { d.tail = { x: -8, y: 90 }; }, 'OK');
});

test('bubble: cover must contain the text area plus half an outline and the fill offset', () => {
  const t = (shapes, want, mut) => { const d = bubble(); d.shapes = shapes; if (mut) mut(d); assert.equal(code(V(d)), want, JSON.stringify(shapes)); };
  const body = (x, y, w, h, rx = 0) => ({ t: 'rect', fill: 0, stroke: true, x, y, w, h, rx });
  t([body(32, 26, 64, 36)], 'BUBBLE_COVER'); // exactly the text area: no room for the outline
  t([body(26, 20, 76, 48)], 'OK');
  t([body(30, 24, 68, 40)], 'BUBBLE_COVER'); // misses on the offset/outline margin at the left edge (x0 needs >= 32-2.4-2.6)
  t([body(25, 20, 76, 48, 20)], 'BUBBLE_COVER'); // rounded corner cuts the text area corner
  t([{ t: 'ellipse', fill: 0, stroke: true, cx: 64, cy: 44, rx: 40, ry: 24 }], 'BUBBLE_COVER');
  t([{ t: 'path', fill: 0, stroke: true, d: 'M0 0H128V96H0Z' }], 'BUBBLE_COVER');
  t([{ t: 'rect', fill: 1, stroke: true, x: 0, y: 0, w: 128, h: 96 }], 'BUBBLE_COVER'); // wrong fill index
  t([body(0, 0, 128, 96), { t: 'ellipse', fill: 1, stroke: false, cx: 64, cy: 44, rx: 5, ry: 5 }], 'BUBBLE_COVER'); // later shape over the text
  t([body(0, 0, 128, 96), { t: 'ellipse', fill: 0, stroke: false, cx: 64, cy: 44, rx: 5, ry: 5 }], 'OK'); // same fill, no outline: invisible on the text
  t([body(0, 0, 128, 96), { t: 'ellipse', fill: 0, stroke: true, cx: 64, cy: 44, rx: 5, ry: 5 }], 'BUBBLE_COVER'); // its outline would cross the text
  t([body(0, 0, 128, 96), { t: 'path', fill: null, stroke: true, d: 'M0 0L128 96' }], 'BUBBLE_COVER');
  t([body(0, 0, 128, 96), { t: 'ellipse', fill: 1, stroke: true, cx: 110, cy: 10, rx: 8, ry: 8 }], 'OK'); // decoration away from the text
  t([{ t: 'ellipse', fill: 1, stroke: true, cx: 64, cy: 44, rx: 5, ry: 5 }, body(0, 0, 128, 96)], 'OK'); // below the cover
});

test('bubble: concave polygon cover is not fooled by corner-only tests', () => {
  const d = bubble();
  // U-shaped polygon: all four text corners lie inside the arms, but the notch cuts through the text area
  d.shapes = [{ t: 'poly', fill: 0, stroke: true, pts: [[4, 4], [124, 4], [124, 92], [4, 92], [4, 60], [60, 60], [60, 36], [4, 36]] }];
  d.textArea = { x: 8, y: 8, w: 108, h: 80 };
  assert.equal(code(V(d)), 'BUBBLE_COVER');
  d.shapes = [{ t: 'poly', fill: 0, stroke: true, pts: [[0, 0], [128, 0], [128, 96], [0, 96]] }];
  assert.equal(code(V(d)), 'OK');
  // a notch between the corners
  d.shapes = [{ t: 'poly', fill: 0, stroke: true, pts: [[4, 4], [50, 4], [64, 40], [78, 4], [124, 4], [124, 92], [4, 92]] }];
  d.textArea = { x: 20, y: 6, w: 90, h: 60 };
  assert.equal(code(V(d)), 'BUBBLE_COVER');
});

test('bubble: contrast threshold uses the text color #3A261C', () => {
  for (const [name, hex] of Object.entries(PALETTE_ALLOWLIST)) {
    const d = bubble(); d.palette = [hex];
    const r = V(d);
    const want = contrastRatio(hex, '#3A261C') >= 4.5;
    assert.equal(r.ok, want, `${name} ${hex} ${contrastRatio(hex, '#3A261C').toFixed(2)}`);
    if (!want) assert.equal(code(r), 'BUBBLE_CONTRAST');
  }
});

test('kind rules', () => {
  const t = (mut, want, mk = bg) => { const d = mk(); mut(d); assert.equal(code(V(d)), want); };
  t(d => { d.tail = { x: 1, y: 1 }; }, 'KIND_FIELDS');
  t(d => { d.textFill = 0; }, 'KIND_FIELDS');
  t(d => { delete d.textFill; }, 'KIND_FIELDS', bubble);
  t(d => { delete d.kind; }, 'SCHEMA_MISSING_KEY');
  t(d => { d.kind = null; }, 'SCHEMA_TYPE');
  t(d => { d.extra = 1; }, 'SCHEMA_UNKNOWN_KEY', bubble);
});

test('normalize: key order and rounding are canonical', () => {
  const a = bg();
  const b = { shapes: a.shapes, palette: a.palette, anchor: a.anchor, viewBox: a.viewBox, label: a.label, layerHint: a.layerHint, kind: a.kind, format: a.format, schemaVersion: 1 };
  assert.equal(JSON.stringify(normalizeGeneratedObject(a)), JSON.stringify(normalizeGeneratedObject(b)));
  const c = bg(); c.shapes[1] = { t: 'path', fill: 1, stroke: false, d: 'M10,10 L50.50,10 L50,50.0Z' };
  assert.equal(normalizeGeneratedObject(c).shapes[1].d, 'M10 10L50.5 10L50 50Z');
  const r = V(c, { normalize: true });
  assert.equal(r.ok, true);
  assert.equal(JSON.stringify(V(r.normalized, { normalize: true }).normalized), JSON.stringify(r.normalized), 'idempotent');
});

test('maxErrors caps the error list', () => {
  const d = bg(); d.shapes = Array.from({ length: 40 }, () => ({ t: 'text' }));
  assert.equal(V(d).errors.length, 40);
  assert.equal(V(d, { maxErrors: 3 }).errors.length, 3);
});

// ---------------------------------------------------------------- props
const prop = () => ({ schemaVersion: 1, format: 'mopi-shape-v1', kind: 'prop', layerHint: 'floor', label: 'Pouf', viewBox: { w: 96, h: 96 }, anchor: { x: 0.5, y: 1 }, palette: ['#F4B79B', '#FFF4DF', '#7A5C48'], shapes: [{ t: 'ellipse', fill: 0, stroke: true, cx: 48, cy: 56, rx: 40, ry: 30 }, { t: 'rect', fill: 1, stroke: false, x: 38, y: 36, w: 20, h: 8, rx: 4 }] });
const face = () => {
  const d = prop();
  d.shapes.push({ t: 'ellipse', fill: 2, stroke: false, cx: 34, cy: 48, rx: 4, ry: 5 }, { t: 'ellipse', fill: 2, stroke: false, cx: 62, cy: 48, rx: 4, ry: 5 }, { t: 'path', fill: null, stroke: true, d: 'M38 62Q48 70 58 62' });
  return d;
};

test('prop: baseline, limits and layer hints', () => {
  assert.equal(V(prop()).ok, true);
  const t = (mut, want, mk = prop) => { const d = mk(); mut(d); assert.equal(code(V(d)), want); };
  for (const hint of ['floor', 'wall', 'shelf']) t(d => { d.layerHint = hint; }, 'OK');
  for (const hint of ['backdrop', 'window_view']) t(d => { d.layerHint = hint; }, 'KIND_FIELDS');
  t(d => { d.layerHint = 'ceiling'; }, 'SCHEMA_TYPE');
  t(d => { delete d.layerHint; }, 'KIND_FIELDS');
  for (const k of ['textArea', 'textFill', 'tail']) t(d => { d[k] = k === 'textFill' ? 0 : { x: 1, y: 1, w: 10, h: 10 }; }, 'KIND_FIELDS');
  // background_piece may not use the prop-only hint, and keeps its own hints
  t(d => { d.layerHint = 'shelf'; }, 'KIND_FIELDS', bg);
  t(d => { d.layerHint = 'window_view'; }, 'OK', bg);
  // size: longer side 64..256
  t(d => { d.viewBox = { w: 64, h: 32 }; d.shapes = [{ t: 'ellipse', fill: 0, stroke: true, cx: 32, cy: 16, rx: 20, ry: 10 }]; }, 'OK');
  t(d => { d.viewBox = { w: 63, h: 63 }; d.shapes = [{ t: 'ellipse', fill: 0, stroke: true, cx: 30, cy: 30, rx: 20, ry: 10 }]; }, 'RANGE_SIZE');
  t(d => { d.viewBox = { w: 256, h: 256 }; }, 'OK');
  t(d => { d.viewBox = { w: 257, h: 100 }; }, 'RANGE_SIZE');
  t(d => { d.viewBox = { w: 300, h: 300 }; }, 'RANGE_SIZE');
  // the same sizes stay legal for backgrounds
  t(d => { d.viewBox = { w: 300, h: 300 }; d.shapes = [d.shapes[0]]; }, 'OK', bg);
  // shapes <= 30, complexity <= 45
  const many = n => d => { d.shapes = Array.from({ length: n }, (_, i) => ({ t: 'rect', fill: i % 2, stroke: false, x: 2 + (i % 8) * 10, y: 2 + Math.floor(i / 8) * 10, w: 8, h: 8 })); };
  t(many(30), 'OK');
  t(many(31), 'LIMIT_SHAPES');
  t(d => { d.shapes = Array.from({ length: 22 }, (_, i) => ({ t: 'path', fill: i % 2, stroke: false, d: `M${6 + (i % 11) * 8} ${10 + Math.floor(i / 11) * 40}L20 20L30 10L40 20L50 10L60 20Z` })); }, 'COMPLEXITY');
  t(many(41), 'LIMIT_SHAPES', bg);
  assert.equal(V(prop()).stats.shapes, 2);
});

test('prop: normalize keeps layerHint, renders', () => {
  const r = V(prop(), { normalize: true });
  assert.equal(r.normalized.layerHint, 'floor');
  assert.equal(r.normalized.kind, 'prop');
});

test('PROP_FACE_LIKE: eyes plus mouth inside a body is rejected, near misses are not', () => {
  const r = V(face());
  assert.equal(code(r), 'PROP_FACE_LIKE');
  assert.equal(r.errors.length, 1);
  const t = (mut, want, mk = face) => { const d = mk(); mut(d); assert.equal(code(V(d)), want, JSON.stringify(d.shapes.slice(2))); };
  // eyes relative to the body fill instead of the "dark" color: wood eyes on a cream body
  t(d => { d.palette = ['#FFF4DF', '#FFF4DF'.replace('FFF4DF', 'F4B79B'), '#C99A6B']; d.shapes[0].fill = 0; d.shapes[2].fill = 2; d.shapes[3].fill = 2; }, 'PROP_FACE_LIKE');
  // stroke-only small circles count as eyes as well
  t(d => { d.shapes[2].fill = null; d.shapes[2].stroke = true; d.shapes[3].fill = null; d.shapes[3].stroke = true; }, 'PROP_FACE_LIKE');
  // a cubic mouth works too, a filled mouth too
  t(d => { d.shapes[4] = { t: 'path', fill: 2, stroke: false, d: 'M38 62C40 70 56 70 58 62Z' }; }, 'PROP_FACE_LIKE');
  // near misses
  t(d => { d.shapes.pop(); }, 'OK'); // eyes without a mouth
  t(d => { d.shapes.splice(2, 2); }, 'OK'); // mouth without eyes
  t(d => { d.shapes.splice(3, 1); }, 'OK'); // one eye only
  t(d => { d.shapes[2].rx = 8; d.shapes[2].ry = 8; d.shapes[3].rx = 8; d.shapes[3].ry = 8; }, 'OK'); // not small (> 6% of 96 = 5.76)
  t(d => { d.shapes[4].d = 'M38 62L58 62'; }, 'OK'); // straight line, not a curve
  t(d => { d.shapes[4].d = 'M38 40Q48 30 58 40'; }, 'OK'); // curve above the eyes
  t(d => { d.shapes[3].cy = 70; d.shapes[4].d = 'M38 80Q48 86 58 80'; }, 'OK'); // eyes not side by side
  t(d => { d.shapes[2].fill = 0; d.shapes[3].fill = 0; }, 'OK'); // eyes as light as the body
  t(d => { d.shapes[4].d = 'M20 62Q48 74 76 62'; }, 'OK'); // mouth wider than 40% of the body
  t(d => { d.shapes[2].cx = 4; d.shapes[3].cx = 92; }, 'OK'); // eyes outside the body (and too far apart)
  // a face on a background piece or a bubble is not this guard's business
  const b = bg(); b.palette = ['#F4B79B', '#7A5C48']; b.shapes = face().shapes.map(s => ({ ...s, fill: s.fill === 2 ? 1 : s.fill }));
  b.viewBox = { w: 128, h: 128 };
  assert.equal(V(b).ok, true);
});

test('PROP_FACE_LIKE is only evaluated after the other checks pass (primary code stays stable)', () => {
  const d = face(); d.layerHint = 'backdrop';
  assert.equal(code(V(d)), 'KIND_FIELDS');
  const e = face(); e.palette = ['#F4B79B', '#FFF4DF', '#39FF14'];
  assert.equal(code(V(e)), 'PALETTE_NOT_ALLOWED');
});
