#!/usr/bin/env node
// aroomi-shape CLI (zero dependencies).
//   node cli.mjs validate <files...>
//   node cli.mjs render <file> <out.svg> [--bg day|night|none] [--surface wall|floor] [--scale n] [--pad n]
//   node cli.mjs check-samples
//   node cli.mjs previews [libraryDir]            (writes previews/*.day.svg and *.night.svg)
//   node cli.mjs contact-sheet [libraryDir] [out.png]   (needs headless Chrome; temp HTML goes to the OS temp dir)
//   node cli.mjs style-check [libraryDir]         (same as node style-check.mjs)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { validateJsonText } from './validate.mjs';
import { toSvg } from './render-svg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
export const SAMPLES_DIR = join(repoRoot, 'specs/001-couple-prompt-todo/contracts/samples/generated-object');
export const LIBRARY_DIR = join(repoRoot, 'design/reference-library');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const jsonFiles = dir => (existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort() : []);

function flag(args, name, fallback) {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

export function libraryIndex(dir = LIBRARY_DIR) {
  return JSON.parse(readFileSync(join(dir, 'reference-library.json'), 'utf8'));
}

export function checkSamples() {
  let fails = 0, n = 0;
  const say = (ok, msg) => { n++; if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); };
  for (const f of jsonFiles(join(SAMPLES_DIR, 'valid'))) {
    const r = validateJsonText(readFileSync(join(SAMPLES_DIR, 'valid', f), 'utf8'));
    say(r.ok, `valid/${f}${r.ok ? '' : ' -> ' + r.errors.map(e => e.code + ' ' + e.path).join(', ')}`);
  }
  const expPath = join(SAMPLES_DIR, 'invalid/_expectations.json');
  const exp = JSON.parse(readFileSync(expPath, 'utf8'));
  const files = jsonFiles(join(SAMPLES_DIR, 'invalid'));
  for (const f of files) {
    if (!exp[f]) { say(false, `invalid/${f} has no expectation`); continue; }
    const r = validateJsonText(readFileSync(join(SAMPLES_DIR, 'invalid', f), 'utf8'));
    const got = r.errors[0]?.code ?? 'OK';
    say(got === exp[f], `invalid/${f} expected ${exp[f]} got ${got}`);
  }
  for (const f of Object.keys(exp)) if (!files.includes(f)) say(false, `expectation for missing file invalid/${f}`);
  if (existsSync(join(LIBRARY_DIR, 'reference-library.json'))) {
    const idx = libraryIndex();
    for (const o of idx.objects) {
      const r = validateJsonText(readFileSync(join(LIBRARY_DIR, o.file), 'utf8'));
      say(r.ok, `reference-library/${o.file}${r.ok ? '' : ' -> ' + r.errors.map(e => e.code).join(', ')}`);
    }
    for (const f of jsonFiles(join(LIBRARY_DIR, 'examples-dont'))) {
      const r = validateJsonText(readFileSync(join(LIBRARY_DIR, 'examples-dont', f), 'utf8'));
      say(r.ok, `examples-dont/${f} (format-valid by design)`);
    }
  }
  console.log(`${n} checks, ${fails} failures`);
  return fails;
}

export function renderPreviews(dir = LIBRARY_DIR) {
  const idx = libraryIndex(dir);
  mkdirSync(join(dir, 'previews'), { recursive: true });
  const written = [];
  for (const o of idx.objects) {
    const doc = JSON.parse(readFileSync(join(dir, o.file), 'utf8'));
    const surface = o.layerHint === 'floor' ? 'floor' : 'wall';
    for (const bg of ['day', 'night']) {
      const out = join(dir, 'previews', `${o.id}.${bg}.svg`);
      writeFileSync(out, toSvg(doc, { background: bg, surface, scale: 2, pad: 12 }) + '\n');
      written.push(out);
    }
  }
  return written;
}

const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildContactSheetHtml(dir = LIBRARY_DIR, which = 'objects') {
  const idx = libraryIndex(dir);
  let items = idx.objects.map(o => ({ ...o, doc: JSON.parse(readFileSync(join(dir, o.file), 'utf8')) }));
  if (which === 'dont') {
    items = jsonFiles(join(dir, 'examples-dont')).map(f => {
      const doc = JSON.parse(readFileSync(join(dir, 'examples-dont', f), 'utf8'));
      return { id: f.replace(/\.json$/, ''), kind: doc.kind, layerHint: doc.layerHint, doc };
    });
  }
  const scale = 2, pad = 12;
  const cols = 2;
  const cards = items.map(it => {
    const surface = it.layerHint === 'floor' ? 'floor' : 'wall';
    const day = toSvg(it.doc, { background: 'day', surface, scale, pad });
    const night = toSvg(it.doc, { background: 'night', surface, scale, pad });
    const th = (it.doc.viewBox.h + 2 * pad) * scale;
    const tw = (it.doc.viewBox.w + 2 * pad) * scale;
    return { th, tw: tw * 2 + 8, html: `<div class="card"><div class="tiles">${day}${night}</div><div class="cap"><b>${escHtml(it.id)}</b> &middot; ${escHtml(it.kind)}${it.layerHint ? ' / ' + escHtml(it.layerHint) : ''} &middot; ${escHtml(it.doc.label)}</div></div>` };
  });
  let H = 24;
  for (let i = 0; i < cards.length; i += cols) H += Math.max(...cards.slice(i, i + cols).map(c => c.th)) + 56;
  const cardW = Math.max(...cards.map(c => c.tw));
  const W = 2 * cardW + 24 + 32 + 16;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#E9E2D8;font:14px -apple-system,system-ui,sans-serif;color:#3F2D22}
.grid{display:grid;grid-template-columns:repeat(${cols},${cardW}px);gap:20px 24px;padding:12px 16px;}
.card{display:block}.tiles{display:flex;gap:8px;align-items:flex-start}.tiles svg{display:block;border-radius:6px}
.cap{margin-top:6px;font-size:13px}</style></head><body><div class="grid">${cards.map(c => c.html).join('')}</div></body></html>`;
  return { html, W, H: H + 8 };
}

export function renderContactSheet(dir = LIBRARY_DIR, outPng = join(dir, 'contact-sheet.png'), which = 'objects') {
  const { html, W, H } = buildContactSheetHtml(dir, which);
  const tmp = mkdtempSync(join(tmpdir(), 'aroomi-sheet-'));
  try {
    const page = join(tmp, 'sheet.html');
    writeFileSync(page, html);
    const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${W},${H}`, `--screenshot=${outPng}`, `file://${page}`], { encoding: 'utf8', timeout: 60000 });
    if (r.status !== 0 || !existsSync(outPng)) throw new Error(`Chrome failed: ${r.stderr || r.error}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  return outPng;
}

async function main(argv) {
  const [cmd, ...args] = argv;
  if (cmd === 'validate') {
    if (!args.length) { console.error('usage: validate <files...>'); return 2; }
    let bad = 0;
    for (const f of args) {
      const r = validateJsonText(readFileSync(f, 'utf8'));
      if (r.ok) console.log(`ok   ${f} (${r.stats.shapes} shapes, ${r.stats.bytes} bytes, complexity ${r.stats.complexityScore})`);
      else { bad++; console.log(`FAIL ${f}`); for (const e of r.errors) console.log(`     ${e.code} ${e.path} ${e.message}`); }
    }
    return bad ? 1 : 0;
  }
  if (cmd === 'render') {
    const bg = flag(args, '--bg', 'none'), surface = flag(args, '--surface', 'wall');
    const scale = Number(flag(args, '--scale', '1')), pad = Number(flag(args, '--pad', '0'));
    const [file, out] = args;
    if (!file || !out) { console.error('usage: render <file> <out.svg> [--bg day|night|none] [--surface wall|floor] [--scale n] [--pad n]'); return 2; }
    const text = readFileSync(file, 'utf8');
    const r = validateJsonText(text);
    if (!r.ok) { console.error(`invalid document: ${r.errors.map(e => e.code).join(', ')}`); return 1; }
    writeFileSync(out, toSvg(JSON.parse(text), { background: bg, surface, scale, pad }) + '\n');
    console.log(`wrote ${out}`);
    return 0;
  }
  if (cmd === 'check-samples') return checkSamples() ? 1 : 0;
  if (cmd === 'previews') { const w = renderPreviews(args[0] ? resolve(args[0]) : LIBRARY_DIR); console.log(`wrote ${w.length} previews`); return 0; }
  if (cmd === 'contact-sheet') {
    const which = flag(args, '--set', 'objects');
    const dir = args[0] ? resolve(args[0]) : LIBRARY_DIR;
    console.log(`wrote ${renderContactSheet(dir, args[1] ? resolve(args[1]) : join(dir, which === 'dont' ? 'contact-sheet-dont.png' : 'contact-sheet.png'), which)}`);
    return 0;
  }
  if (cmd === 'style-check') {
    const { main: styleMain } = await import('./style-check.mjs');
    return styleMain(args);
  }
  console.error(`usage: node ${basename(fileURLToPath(import.meta.url))} validate|render|check-samples|previews|contact-sheet|style-check ...`);
  return 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }, e => { console.error(e.message); process.exitCode = 1; });
}
