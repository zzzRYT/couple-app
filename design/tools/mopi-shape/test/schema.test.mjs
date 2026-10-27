import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { validateGeneratedObject, validateJsonText } from '../validate.mjs';
import { SAMPLES, SCHEMA_FILE, jsonFiles, readJson, readText, libraryIndex, LIBRARY } from './paths.mjs';
import { sources, mutate } from './fuzz-lib.mjs';

const schema = readJson(SCHEMA_FILE);

test('schema file is well formed (draft 2020-12, $id, local $refs resolve)', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.$id, 'https://couple-app.invalid/contracts/generated-object-v1.schema.json');
  assert.equal(schema.additionalProperties, false);
  const refs = [];
  (function walk(n) { if (n && typeof n === 'object') { if (typeof n.$ref === 'string') refs.push(n.$ref); Object.values(n).forEach(walk); } })(schema);
  assert.ok(refs.length > 5);
  for (const ref of refs) { assert.match(ref, /^#\/\$defs\//); assert.ok(schema.$defs[ref.slice('#/$defs/'.length)], `${ref} resolves`); }
  assert.match(schema.description, /validator-enforced/);
});

async function loadAjv() {
  const candidates = [process.env.AJV_PATH, 'ajv/dist/2020.js'].filter(Boolean);
  for (const c of candidates) { try { const m = await import(c.startsWith('/') ? `file://${c}` : c); return m.default?.default ?? m.default ?? m.Ajv2020; } catch { /* try the next one */ } }
  return null;
}

// Codes whose rule JSON Schema cannot express (or only partly): a schema-accepted document with one of these is expected.
const VALIDATOR_ONLY = new Set(['RANGE_COORD', 'RANGE_SIZE', 'ZERO_AREA', 'PALETTE_NOT_ALLOWED', 'PALETTE_INDEX', 'COMPLEXITY', 'BUBBLE_TEXTAREA', 'BUBBLE_COVER', 'BUBBLE_CONTRAST', 'PROP_FACE_LIKE', 'SHAPE_INVISIBLE', 'LIMIT_PATH', 'PATH_NUMBER', 'PATH_SYNTAX', 'LIMIT_BYTES', 'JSON_DUPLICATE_KEY', 'LABEL_INVALID']);

test('JSON Schema and validate.mjs agree on structure (needs ajv; skipped when it is not available)', async t => {
  const Ajv2020 = await loadAjv();
  if (!Ajv2020) { t.skip('ajv is not available: set AJV_PATH to an existing ajv/dist/2020.js to run the cross-check (nothing is installed by this repo)'); return; }
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  const validate = ajv.compile(schema);

  // 1) everything the validator accepts is accepted by the schema (the schema must never be stricter)
  let accepted = 0;
  for (const s of sources()) { assert.equal(validate(s.doc), true, `${s.name}: ${ajv.errorsText(validate.errors)}`); accepted++; }

  // 2) invalid samples: rejected by the schema, or carrying a code that only the validator can enforce
  const exp = readJson(join(SAMPLES, 'invalid/_expectations.json'));
  let both = 0, validatorOnly = 0, skipped = 0;
  const onlyList = [];
  for (const f of jsonFiles(join(SAMPLES, 'invalid'))) {
    let doc;
    try { doc = JSON.parse(readText(join(SAMPLES, 'invalid', f))); } catch { skipped++; continue; }
    if (validate(doc)) { assert.ok(VALIDATOR_ONLY.has(exp[f]), `${f} (${exp[f]}) passes the schema but is not a validator-only rule`); validatorOnly++; onlyList.push(`${f}:${exp[f]}`); } else both++;
  }

  // 3) 200 seeded mutations: validator ok => schema ok; validator rejects with a structural primary code => schema rejects
  const srcs = sources();
  let softMismatch = 0, checked = 0;
  for (let i = 0; i < 200; i++) {
    const { doc } = mutate(srcs[i % srcs.length].doc, 20260701 + i);
    const v = validateGeneratedObject(doc);
    let plain; try { plain = JSON.parse(JSON.stringify(doc)); } catch { continue; }
    const s = validate(plain);
    checked++;
    if (v.ok) assert.equal(s, true, `mutation ${i}: validator accepts but schema rejects: ${ajv.errorsText(validate.errors)}`);
    else if (!VALIDATOR_ONLY.has(v.errors[0].code) && s && v.errors[0].code !== 'FORBIDDEN_KEY') softMismatch++;
  }
  t.diagnostic(`ajv ${ajv.opts?.code ? '' : ''}cross-check: ${accepted} valid docs accepted by both; invalid samples: ${both} rejected by both, ${validatorOnly} validator-only (${onlyList.length}), ${skipped} not JSON; mutations compared: ${checked}, structural disagreements: ${softMismatch}`);
  assert.equal(softMismatch, 0, 'schema accepts a document that the validator rejects with a structural code');
});
