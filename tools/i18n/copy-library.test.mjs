import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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

test('proposal keys remain reviewable but are excluded from runtime translations', async () => {
  const root = await mkdtemp(join(tmpdir(), 'design-proposal-'));
  const dir = join(root, 'page', 'copy');
  try {
    await mkdir(dir, { recursive: true });
    for (const lang of ['ko', 'en', 'ja']) await writeFile(join(dir, `${lang}.json`), JSON.stringify({ status: 'draft', keyStatus: { 'login.pw.label': 'proposal' }, strings: { 'login.pw.label': 'Password' } }));
    const { merged, all, proposals } = await loadCopies(root);
    assert.equal(merged.en['login.pw.label'], undefined);
    assert.equal(all.en['login.pw.label'], 'Password');
    assert.deepEqual(proposals, ['login.pw.label']);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('V0 overlay check accepts generated copy and rejects a stale locale', async () => {
  const repo = fileURLToPath(new URL('../../', import.meta.url));
  const root = await mkdtemp(join(tmpdir(), 'v0-copy-check-'));
  const paths = [
    'tools/i18n/build-v0-overlay.mjs', 'apps/mobile/src/i18n/v0Keys.d.ts',
    'specs/002-couple-dday-v0/handoffs/design/copy-v0.md',
    ...['copy-v0.md', 'ko-KR.json', 'en-US.json', 'ja-JP.json'].map((name) => `apps/mobile/src/i18n/locales/v0/${name}`),
  ];
  try {
    for (const path of paths) {
      await mkdir(join(root, path, '..'), { recursive: true });
      await copyFile(join(repo, path), join(root, path));
    }
    const script = join(root, paths[0]);
    execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' });
    const locale = join(root, 'apps/mobile/src/i18n/locales/v0/en-US.json');
    const changed = JSON.parse(await readFile(locale, 'utf8'));
    changed['tab.anniv'] = 'stale';
    await writeFile(locale, JSON.stringify(changed));
    assert.throws(() => execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }), /Command failed/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
