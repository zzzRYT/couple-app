import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { validateJsonText, validateGeneratedObject, ERROR_CODES } from '../validate.mjs';
import { toSvg } from '../render-svg.mjs';
import { SAMPLES, jsonFiles, readText } from './paths.mjs';

const validFiles = jsonFiles(join(SAMPLES, 'valid'));
const invalidFiles = jsonFiles(join(SAMPLES, 'invalid'));
const expectations = JSON.parse(readText(join(SAMPLES, 'invalid/_expectations.json')));

test('sample sets are big enough', () => {
  assert.ok(validFiles.length >= 4, 'at least 4 valid samples');
  assert.ok(validFiles.some(f => f.startsWith('background')) && validFiles.some(f => f.startsWith('bubble')));
  assert.ok(validFiles.filter(f => f.startsWith('prop')).length >= 2, 'at least 2 valid props');
  assert.ok(invalidFiles.filter(f => f.startsWith('prop')).length >= 6, 'at least 6 invalid props');
  assert.ok(invalidFiles.length >= 24, 'at least 24 invalid samples');
});

for (const f of validFiles) {
  test(`valid/${f} passes and renders deterministically`, () => {
    const text = readText(join(SAMPLES, 'valid', f));
    const r = validateJsonText(text);
    assert.deepEqual(r.errors, []);
    assert.equal(r.ok, true);
    const doc = JSON.parse(text);
    for (const opts of [{}, { background: 'day' }, { background: 'night', scale: 2, pad: 10 }]) {
      const a = toSvg(doc, opts), b = toSvg(JSON.parse(text), opts);
      assert.equal(a, b, 'same input => byte-identical output');
      assert.ok(a.startsWith('<svg ') && a.endsWith('</svg>'));
    }
    // normalized output validates again and re-renders identically
    const n = validateJsonText(text, { normalize: true }).normalized;
    assert.equal(validateGeneratedObject(n).ok, true);
    assert.equal(toSvg(n), toSvg(doc));
  });
}

test('every invalid sample is listed in _expectations.json and vice versa', () => {
  assert.deepEqual(Object.keys(expectations).sort(), [...invalidFiles].sort());
});

test('expected codes are documented error codes', () => {
  for (const code of Object.values(expectations)) assert.ok(ERROR_CODES.includes(code), `${code} is in ERROR_CODES`);
});

test('the required defect families are covered by the invalid samples', () => {
  const codes = new Set(Object.values(expectations));
  for (const c of ['LABEL_INVALID', 'SCHEMA_TYPE', 'SHAPE_TYPE', 'PATH_COMMAND', 'PATH_NUMBER', 'LIMIT_PATH', 'LIMIT_SHAPES', 'RANGE_COORD', 'PALETTE_NOT_ALLOWED', 'PALETTE_COUNT', 'PALETTE_INDEX', 'KIND_FIELDS', 'BUBBLE_TEXTAREA', 'BUBBLE_CONTRAST', 'BUBBLE_COVER', 'ZERO_AREA', 'PROP_FACE_LIKE', 'SCHEMA_UNKNOWN_KEY', 'FORBIDDEN_KEY', 'LIMIT_BYTES', 'RANGE_SIZE', 'COMPLEXITY']) assert.ok(codes.has(c), `${c} has a sample`);
});

for (const f of invalidFiles) {
  test(`invalid/${f} fails with exactly ${expectations[f]}`, () => {
    const r = validateJsonText(readText(join(SAMPLES, 'invalid', f)));
    assert.equal(r.ok, false);
    assert.equal(r.errors[0].code, expectations[f]);
    assert.ok(r.errors.length >= 1 && r.errors.every(e => ERROR_CODES.includes(e.code) && typeof e.path === 'string' && typeof e.message === 'string'));
  });
}

test('invalid documents cannot be rendered', () => {
  const doc = JSON.parse(readText(join(SAMPLES, 'invalid/shape-type-text.json')));
  assert.throws(() => toSvg(doc), /invalid document/);
});
