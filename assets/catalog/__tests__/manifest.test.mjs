import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
const entries = JSON.parse(await readFile('assets/catalog/manifest.json', 'utf8'));
test('catalog has 18 placeholder objects and six mascot poses with matching hashes', async () => {
  assert.equal(entries.length, 24);
  assert.equal(entries.filter((e) => e.asset_kind === 'room_object').length, 18);
  assert.equal(entries.filter((e) => e.asset_kind === 'mascot_pose').length, 6);
  assert.equal(new Set(entries.map((e) => e.asset_id)).size, 24);
  for (const entry of entries) {
    for (const variant of [entry, entry.night_variant].filter(Boolean)) {
      const hash = createHash('sha256').update(await readFile(variant.uri)).digest('hex');
      assert.equal(hash, variant.sha256, variant.uri);
    }
  }
});
