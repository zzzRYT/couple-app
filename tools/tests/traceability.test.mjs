import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

// Scenario ids as written in spec.md (V0-DR-02 and V0-DR-02-AC-01 are separate ids).
const ID = /V0-(?:F\d\d-AC-\d\d|DR-\d\d(?:-AC-\d\d)?|EC-\d\d|NF-\d\d)/g;
const TEST_FILE = /\.(?:tsx?|mjs|js|sql)$/;
const SELF = 'tools/tests/traceability.test.mjs';
const TEST_ROOTS = [
  { dir: 'apps/mobile/src', only: '__tests__' },
  { dir: 'supabase/functions', only: '__tests__' },
  { dir: 'supabase/tests' },
  { dir: 'tools/tests' },
];

async function walk(dir, only, inside = !only) {
  const out = [];
  for (const entry of await readdir(new URL(`${dir}/`, root), { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await walk(path, only, inside || entry.name === only)));
    else if (inside && TEST_FILE.test(entry.name) && path !== SELF) out.push(path);
  }
  return out;
}

// plan.md §10 writes ids as `V0-F07-AC-01~07, -10, -11` or `V0-F14-AC-03, -04`.
function expandIds(cell) {
  const ids = [];
  let prefix = '';
  for (const raw of cell.replace(/`/g, '').split(',')) {
    const token = raw.trim();
    const full = token.match(/^(V0-(?:F\d\d-AC-|EC-|NF-|DR-))(\d\d)(?:~(\d\d))?$/);
    const short = token.match(/^-(\d\d)(?:~(\d\d))?$/);
    const match = full ?? short;
    if (!match) continue;
    if (full) prefix = full[1];
    const from = Number(full ? full[2] : short[1]);
    const to = Number((full ? full[3] : short[2]) ?? from);
    for (let n = from; n <= to; n += 1) ids.push(`${prefix}${String(n).padStart(2, '0')}`);
  }
  return ids;
}

async function specIds() {
  return [...new Set((await read('specs/002-couple-dday-v0/spec.md')).match(ID))].sort();
}

// A scenario whose plan §10 layer is exactly "기기" can only be checked on a phone.
async function deviceIds() {
  const plan = await read('specs/002-couple-dday-v0/plan.md');
  const section = plan.split('### 10. 추적표')[1]?.split('### 11.')[0];
  assert.ok(section, 'plan.md §10 traceability table not found');
  const ids = new Set();
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((cell) => cell.trim());
    if (cells.length < 5 || cells[2] !== '기기') continue;
    for (const id of expandIds(cells[1])) ids.add(id);
  }
  return [...ids].sort();
}

const hasId = (text, id) => new RegExp(`${id}(?![0-9A-Za-z]|-AC-)`).test(text);

test('the plan device scenarios all exist in the spec', async () => {
  const spec = new Set(await specIds());
  const device = await deviceIds();
  assert.ok(device.length > 0, 'no device-layer scenarios parsed from plan.md §10');
  assert.deepEqual(
    device.filter((id) => !spec.has(id)),
    [],
  );
});

test('SC-004 every spec scenario has a test, or a device-checks.md row when it needs a phone', async () => {
  const ids = await specIds();
  assert.ok(ids.length > 100, `only ${ids.length} scenario ids parsed from spec.md`);
  const device = new Set(await deviceIds());
  const checks = await read('specs/002-couple-dday-v0/device-checks.md');

  let text = '';
  for (const { dir, only } of TEST_ROOTS) {
    for (const path of await walk(dir, only)) text += `\n${await read(path)}`;
  }

  const missingTests = ids.filter((id) => !device.has(id) && !hasId(text, id));
  const missingDevice = ids.filter((id) => device.has(id) && !hasId(checks, id));
  assert.deepEqual(
    { missingTests, missingDevice },
    { missingTests: [], missingDevice: [] },
    `scenario ids without a test (put the id in the test name) or a device-checks.md row`,
  );
});
