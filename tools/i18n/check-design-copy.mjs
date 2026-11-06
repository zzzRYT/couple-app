import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { loadRuntimeCopies } from './copy-library.mjs';
const { merged } = await loadRuntimeCopies();
// H02's generated V0 overlay is a second canonical copy source layered over the
// mirrored base copy. Validate its generation before accepting its keys.
execFileSync(process.execPath, ['tools/i18n/build-v0-overlay.mjs', '--check'], { stdio: 'inherit' });
const overlay = JSON.parse(await readFile('apps/mobile/src/i18n/locales/v0/ko-KR.json', 'utf8'));
const keys = new Set([...Object.keys(merged.ko), ...Object.keys(overlay)]);
for (const [lang, locale] of [['ko', 'ko-KR'], ['en', 'en-US'], ['ja', 'ja-JP']]) {
  const generated = JSON.parse(await readFile(`apps/mobile/src/i18n/locales/${locale}.json`, 'utf8'));
  const sourceKeys = Object.keys(merged[lang]).sort();
  if (JSON.stringify(Object.keys(generated).sort()) !== JSON.stringify(sourceKeys) || sourceKeys.some((key) => generated[key] !== merged[lang][key])) throw Error(`Generated locale ${locale} is stale; run node tools/i18n/import-design-copy.mjs`);
}
const used = new Set();
const namespaces = new Set([...keys].map((key) => key.split('.')[0]));
const missing = [];
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'test' || entry.name === 'locales') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { await scan(path); continue; }
    if (!/\.[jt]sx?$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue;
    const source = ts.createSourceFile(path, await readFile(path, 'utf8'), ts.ScriptTarget.Latest, true, path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node) {
      if (ts.isStringLiteralLike(node)) {
        if (keys.has(node.text)) used.add(node.text);
        else if (/^[\w]+(?:\.[\w]+)+$/.test(node.text) && namespaces.has(node.text.split('.')[0]) && ![...keys].some((key) => key.startsWith(`${node.text}.`))) missing.push(`${path}: ${node.text}`);
      }
      if (ts.isCallExpression(node) && (node.expression.getText(source) === 't' || node.expression.getText(source) === 'i18n.t') && node.arguments[0]) {
        const arg = node.arguments[0];
        function check(n) {
          if (ts.isStringLiteralLike(n) && !keys.has(n.text)) missing.push(`${path}: ${n.text}`);
          else if (ts.isConditionalExpression(n)) { check(n.whenTrue); check(n.whenFalse); }
        }
        check(arg);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
await scan('apps/mobile/src');
if (missing.length) throw Error(`Keys used by app but absent from copy:\n${missing.join('\n')}`);
const unused = [...keys].filter((key) => !used.has(key));
console.warn(`Warning: ${unused.length} copy keys have no literal app reference (dynamic usage may exist): ${unused.join(', ')}`);
console.log(`Copy check passed: ${keys.size} keys, three matching locales.`);
