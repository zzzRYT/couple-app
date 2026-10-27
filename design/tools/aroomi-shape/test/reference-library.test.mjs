import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { validateJsonText, validateGeneratedObject, PALETTE_ALLOWLIST, STYLE, LIMITS } from '../validate.mjs';
import { toSvg } from '../render-svg.mjs';
import { styleCheck } from '../style-check.mjs';
import { LIBRARY, TOKENS, SKETCHES, readText, readJson, libraryIndex, jsonFiles } from './paths.mjs';

const idx = libraryIndex();

test('index describes 6 background, 4 bubble and 4 prop references, all placeholders', () => {
  assert.equal(idx.version, 1);
  assert.equal(idx.format, 'aroomi-shape-v1');
  assert.equal(idx.status, 'placeholder');
  assert.equal(idx.objects.filter(o => o.kind === 'background_piece').length, 6);
  assert.equal(idx.objects.filter(o => o.kind === 'bubble_frame').length, 4);
  assert.equal(idx.objects.filter(o => o.kind === 'prop').length, 4);
  assert.deepEqual(idx.objects.filter(o => o.kind === 'prop').map(o => o.layerHint).sort(), ['floor', 'floor', 'shelf', 'wall']);
  for (const o of idx.objects) {
    assert.equal(o.status, 'placeholder');
    assert.equal(o.provenance, 'drawn for this project (placeholder)');
    assert.match(o.id, /^[a-z0-9-]+$/);
  }
  const files = jsonFiles(join(LIBRARY, 'objects'));
  assert.deepEqual(files, idx.objects.map(o => o.file.replace('objects/', '')).sort());
});

for (const o of idx.objects) {
  test(`reference ${o.id} is valid, matches its index entry, and renders deterministically`, () => {
    const text = readText(join(LIBRARY, o.file));
    const r = validateJsonText(text);
    assert.deepEqual(r.errors, []);
    const doc = JSON.parse(text);
    assert.equal(doc.kind, o.kind);
    assert.equal(doc.layerHint ?? null, o.layerHint ?? null);
    assert.ok(r.stats.bytes <= 4096, `reference files stay small (${r.stats.bytes} bytes)`);
    assert.ok(doc.palette.length <= 4 && doc.shapes.length <= 40);
    assert.equal(toSvg(doc, { background: 'night', pad: 12 }), toSvg(JSON.parse(text), { background: 'night', pad: 12 }));
    assert.equal(styleCheck(doc).pass, true, 'reference objects conform to the style heuristics');
  });
  test(`preview files of ${o.id} are up to date`, () => {
    const doc = readJson(join(LIBRARY, o.file));
    const surface = o.layerHint === 'floor' ? 'floor' : 'wall';
    for (const bg of ['day', 'night']) assert.equal(readText(join(LIBRARY, 'previews', `${o.id}.${bg}.svg`)), toSvg(doc, { background: bg, surface, scale: 2, pad: 12 }) + '\n', `${o.id}.${bg}.svg is stale; run: node design/tools/aroomi-shape/cli.mjs previews`);
  });
}

test('every bubble reference reports its text contrast (>= 4.5)', () => {
  for (const o of idx.objects.filter(x => x.kind === 'bubble_frame')) {
    const r = validateJsonText(readText(join(LIBRARY, o.file)));
    assert.ok(r.stats.contrast >= 4.5, `${o.id}: ${r.stats.contrast}`);
  }
});

test('prop references respect the prop limits and the face-like guard', () => {
  for (const o of idx.objects.filter(x => x.kind === 'prop')) {
    const doc = readJson(join(LIBRARY, o.file));
    assert.ok(Math.max(doc.viewBox.w, doc.viewBox.h) >= 64 && Math.max(doc.viewBox.w, doc.viewBox.h) <= 256, `${o.id} size`);
    assert.ok(doc.shapes.length <= 30);
    const r = validateJsonText(readText(join(LIBRARY, o.file)));
    assert.ok(r.stats.complexityScore <= 45);
    assert.ok(['floor', 'wall', 'shelf'].includes(doc.layerHint));
    if (doc.layerHint !== 'wall') assert.deepEqual([doc.anchor.x, doc.anchor.y], [0.5, 1], `${o.id}: floor/shelf props anchor at bottom center`);
    assert.equal('textArea' in doc || 'textFill' in doc || 'tail' in doc, false);
  }
});

test('the face-like guard has no false positive on the reference backgrounds and bubbles (re-labelled as props)', () => {
  let n = 0;
  for (const o of idx.objects.filter(x => x.kind !== 'prop')) {
    const doc = readJson(join(LIBRARY, o.file));
    const asProp = { ...doc, kind: 'prop', layerHint: 'floor' };
    delete asProp.textArea; delete asProp.textFill; delete asProp.tail;
    const r = validateGeneratedObject(asProp);
    assert.deepEqual(r.errors, [], `${o.id} as prop`);
    n++;
  }
  assert.equal(n, 10);
});

test('examples-dont are format-valid but fail the style heuristics', () => {
  const files = jsonFiles(join(LIBRARY, 'examples-dont'));
  assert.ok(files.length >= 3 && files.length <= 4);
  for (const f of files) {
    const text = readText(join(LIBRARY, 'examples-dont', f));
    assert.equal(validateJsonText(text).ok, true, `${f} must be schema-valid`);
    assert.match(JSON.parse(text).label, /^DONT /, `${f} is labelled as a dont example`);
    const s = styleCheck(JSON.parse(text));
    assert.equal(s.pass, false, `${f} must fail style-check (score ${s.score})`);
  }
});

test('style-check separates the sets by score as well as by hard fails', () => {
  const refMin = Math.min(...idx.objects.map(o => styleCheck(readJson(join(LIBRARY, o.file))).score));
  const dontMax = Math.max(...jsonFiles(join(LIBRARY, 'examples-dont')).map(f => styleCheck(readJson(join(LIBRARY, 'examples-dont', f))).score));
  assert.ok(refMin > dontMax, `lowest reference ${refMin} > highest dont ${dontMax}`);
});

test('previews directory holds only the generated svg files and the library has no stray files', () => {
  assert.deepEqual(readdirSync(join(LIBRARY, 'previews')).sort(), idx.objects.flatMap(o => [`${o.id}.day.svg`, `${o.id}.night.svg`]).sort());
});

test('palette allowlist and style constants mirror design/tokens.json', () => {
  const t = readJson(TOKENS).color;
  const fromTokens = Object.values(t.illustration.palette).concat([t.room.day.wall, t.room.day.floor]).sort();
  assert.deepEqual(Object.values(PALETTE_ALLOWLIST).sort(), fromTokens);
  assert.equal(STYLE.outline, t.illustration.outline);
  assert.equal(STYLE.rim, t.illustration.rim);
  assert.ok(Math.abs(STYLE.offsetXRatio - t.illustration.fillOffsetRatio.x) < 0.001);
  assert.ok(Math.abs(STYLE.offsetYRatio - t.illustration.fillOffsetRatio.y) < 0.001);
  assert.deepEqual(STYLE.roomColors.day, { wall: t.room.day.wall, floor: t.room.day.floor });
  assert.deepEqual(STYLE.roomColors.night, { wall: t.room.night.wall, floor: t.room.night.floor });
});

test('outline/rim/offset ratios match what the existing catalog sketches use', () => {
  const outline = new Map(), rim = new Map(), offsets = new Set();
  const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const f of readdirSync(SKETCHES).filter(x => x.endsWith('.svg'))) {
    const svg = readText(join(SKETCHES, f));
    assert.match(svg, /viewBox="0 0 64 64"/);
    for (const m of svg.matchAll(/stroke="#4A3426" stroke-width="([0-9.]+)"/g)) bump(outline, m[1]);
    for (const m of svg.matchAll(/stroke="#FFF4DF" stroke-width="([0-9.]+)"/g)) bump(rim, m[1]);
    for (const m of svg.matchAll(/translate\(([0-9.]+) ([0-9.]+)\)/g)) offsets.add(`${m[1]} ${m[2]}`);
  }
  const modal = m => [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
  assert.equal(modal(outline), '2.4', 'the dominant outline width of the sketches is 2.4 of 64');
  assert.equal(modal(rim), '5.8', 'the dominant rim stroke of the sketches is 5.8 of 64');
  assert.deepEqual([...offsets], ['1.3 1'], 'every sketch uses one fill offset');
  assert.ok(Math.abs(STYLE.outlineRatio * 64 - 2.4) < 1e-9);
  assert.ok(Math.abs(STYLE.rimStrokeRatio * 64 - 5.8) < 1e-9);
  assert.ok(Math.abs(STYLE.offsetXRatio * 64 - 1.3) < 1e-9 && Math.abs(STYLE.offsetYRatio * 64 - 1) < 1e-9);
  assert.equal(LIMITS.maxShapes, 40);
});
