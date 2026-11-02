import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const root = 'design/pages';
export const languages = ['ko', 'en', 'ja'];
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.filter((e) => e.isDirectory()).map(async (e) => e.name === 'copy' ? [join(dir, e.name)] : walk(join(dir, e.name))))).flat().sort();
}
export async function loadCopies(copyRoot = root) {
  const merged = Object.fromEntries(languages.map((l) => [l, {}]));
  const owners = new Map();
  const all = Object.fromEntries(languages.map((l) => [l, {}]));
  const proposals = [];
  for (const dir of await walk(copyRoot)) {
    const files = {};
    for (const lang of languages) {
      files[lang] = JSON.parse(await readFile(join(dir, `${lang}.json`), 'utf8'));
      if (typeof files[lang].status !== 'string' || !files[lang].status || !files[lang].strings || typeof files[lang].strings !== 'object') throw Error(`Invalid copy file: ${dir}/${lang}.json`);
    }
    const keys = Object.keys(files.ko.strings).sort();
    for (const lang of languages) {
      if (JSON.stringify(Object.keys(files[lang].strings).sort()) !== JSON.stringify(keys)) throw Error(`Locale key mismatch: ${dir}/${lang}.json`);
    }
    for (const key of keys) {
      if (owners.has(key)) throw Error(`Duplicate key ${key}: ${owners.get(key)} and ${dir}`);
      owners.set(key, dir);
      const statuses = languages.map((lang) => files[lang].keyStatus?.[key] ?? 'approved');
      if (new Set(statuses).size !== 1) throw Error(`Key status mismatch ${key}: ${dir}`);
      if (statuses[0] === 'proposal') proposals.push(key);
      const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
      for (const lang of languages) {
        const value = files[lang].strings[key];
        if (typeof value !== 'string' || !value.trim()) throw Error(`Empty translation ${key}: ${dir}/${lang}.json`);
        if (placeholders(value) !== placeholders(files.ko.strings[key])) throw Error(`Placeholder mismatch ${key}: ${dir}/${lang}.json`);
        all[lang][key] = value;
        if (statuses[0] !== 'proposal') merged[lang][key] = value;
      }
    }
  }
  return { merged, all, owners, proposals };
}
