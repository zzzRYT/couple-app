import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCopies } from './copy-library.mjs';

test('copy validation rejects missing translations, duplicate keys and placeholder mismatch', async () => {
  const root = await mkdtemp(join(tmpdir(), 'design-copy-'));
  const dir = join(root, 'page', 'copy');
  const write = async (folder, lang, strings) => writeFile(join(folder, `${lang}.json`), JSON.stringify({ status: 'draft', strings }));
  try {
    await mkdir(dir, { recursive: true });
    for (const lang of ['ko', 'en', 'ja']) await write(dir, lang, { greeting: 'Hello {name}' });
    assert.equal((await loadCopies(root)).merged.ko.greeting, 'Hello {name}');
    await write(dir, 'en', {});
    await assert.rejects(loadCopies(root), /Locale key mismatch/);
    await write(dir, 'en', { greeting: 'Hello {other}' });
    await assert.rejects(loadCopies(root), /Placeholder mismatch/);
    await write(dir, 'en', { greeting: 'Hello {name}' });
    const other = join(root, 'other', 'copy'); await mkdir(other, { recursive: true });
    for (const lang of ['ko', 'en', 'ja']) await write(other, lang, { greeting: 'Hello {name}' });
    await assert.rejects(loadCopies(root), /Duplicate key/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
