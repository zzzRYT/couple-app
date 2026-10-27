import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateGeneratedObject, validateJsonText, ERROR_CODES } from '../validate.mjs';
import { toSvg } from '../render-svg.mjs';
import { sources, mutate, mutateText } from './fuzz-lib.mjs';

const SEED = 20260701;
const srcs = sources();

test('200 seeded mutations: no exceptions, forbidden constructs never validate', t => {
  let bad = 0, rejected = 0, stillValid = 0;
  const byCode = {};
  for (let i = 0; i < 200; i++) {
    const src = srcs[i % srcs.length];
    const { doc, bad: isBad, applied } = mutate(src.doc, SEED + i);
    let r;
    assert.doesNotThrow(() => { r = validateGeneratedObject(doc); }, `mutation ${i} (${applied.join('+')}) on ${src.name} threw`);
    assert.equal(typeof r.ok, 'boolean');
    assert.ok(r.errors.every(e => ERROR_CODES.includes(e.code)), `mutation ${i}: unknown error code`);
    assert.equal(r.ok, r.errors.length === 0);
    if (r.ok) { stillValid++; assert.doesNotThrow(() => toSvg(doc), `valid mutation ${i} must render`); }
    else { rejected++; byCode[r.errors[0].code] = (byCode[r.errors[0].code] ?? 0) + 1; }
    if (isBad) {
      bad++;
      assert.equal(r.ok, false, `mutation ${i} (${applied.join('+')}) on ${src.name} introduced a forbidden construct but validated: ${JSON.stringify(doc).slice(0, 300)}`);
    }
    // text route for the same mutation (NaN/Infinity become null in JSON text, which must still be rejected)
    let text;
    try { text = JSON.stringify(doc); } catch { text = null; }
    if (text !== null) {
      let rt;
      assert.doesNotThrow(() => { rt = validateJsonText(text); }, `text route threw at ${i}`);
      if (isBad) assert.equal(rt.ok, false, `text route accepted forbidden mutation ${i} (${applied.join('+')})`);
    }
  }
  t.diagnostic(`flagged ${bad}, rejected ${rejected}, still valid ${stillValid}, primary codes ${JSON.stringify(byCode)}`);
  assert.ok(bad >= 100, 'enough forbidden mutations were generated');
  assert.ok(stillValid >= 1 || rejected === 200);
});

test('200 seeded text corruptions: never throw; if accepted, the result renders and re-validates', () => {
  let accepted = 0;
  for (let i = 0; i < 200; i++) {
    const text = JSON.stringify(srcs[i % srcs.length].doc);
    const m = mutateText(text, SEED * 3 + i);
    let r;
    assert.doesNotThrow(() => { r = validateJsonText(m); }, `text mutation ${i} threw`);
    assert.ok(r.errors.every(e => ERROR_CODES.includes(e.code)));
    if (r.ok) {
      accepted++;
      const doc = JSON.parse(m);
      assert.doesNotThrow(() => toSvg(doc));
      assert.equal(validateGeneratedObject(validateJsonText(m, { normalize: true }).normalized).ok, true);
    }
  }
  assert.ok(accepted < 200);
});

test('the same seed gives the same mutations (reproducible)', () => {
  const a = mutate(srcs[0].doc, 42), b = mutate(srcs[0].doc, 42);
  assert.equal(JSON.stringify(a.doc), JSON.stringify(b.doc));
  assert.deepEqual(a.applied, b.applied);
});
