import { readFile, mkdir, writeFile } from 'node:fs/promises';
const valid = JSON.parse(await readFile(new URL('../fixtures/scene/valid.json', import.meta.url), 'utf8'));
const fixtures = [
  { name: 'valid', scene: valid, expected: { ok: true, errors: [] } },
  { name: 'unknown-field', scene: { ...valid, extra: true }, expected: { ok: false, errors: [{ path: '', code: 'additionalProperties' }] } },
];
await mkdir(new URL('../fixtures/parity/', import.meta.url), { recursive: true });
await writeFile(new URL('../fixtures/parity/scenes.json', import.meta.url), JSON.stringify(fixtures, null, 2) + '\n');
