import { readFile, writeFile } from 'node:fs/promises';
const source = await readFile('design/i18n-copy.md', 'utf8');
const output = { 'ko-KR': {}, 'en-US': {}, 'ja-JP': {} };
const seen = new Set();
for (const line of source.split('\n')) {
  const match = line.match(/^\| `([^`]+)` \| (.*?) \| (.*?) \| (.*?) \|\s*$/);
  if (!match) continue;
  const [, key, ...values] = match;
  if (seen.has(key)) throw new Error(`Duplicate key: ${key}`);
  seen.add(key);
  Object.keys(output).forEach((locale, index) => { output[locale][key] = values[index]; });
}
if (seen.size !== 640) throw new Error(`Expected 640 keys, found ${seen.size}`);
for (const [locale, values] of Object.entries(output)) await writeFile(`apps/mobile/src/i18n/locales/${locale}.json`, JSON.stringify(values, null, 2) + '\n');
await writeFile('apps/mobile/src/i18n/keys.d.ts', `export type TranslationKey = ${[...seen].map((key) => JSON.stringify(key)).join(' | ')};\n`);
