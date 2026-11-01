import { writeFile } from 'node:fs/promises';
import { loadCopies } from './copy-library.mjs';
const { merged } = await loadCopies();
const keys = Object.keys(merged.ko).sort();
for (const [lang, locale] of [['ko', 'ko-KR'], ['en', 'en-US'], ['ja', 'ja-JP']]) {
  await writeFile(`apps/mobile/src/i18n/locales/${locale}.json`, JSON.stringify(Object.fromEntries(keys.map((key) => [key, merged[lang][key]])), null, 2) + '\n');
}
await writeFile('apps/mobile/src/i18n/keys.d.ts', `export type TranslationKey = ${keys.map((key) => JSON.stringify(key)).join(' | ')};\n`);
