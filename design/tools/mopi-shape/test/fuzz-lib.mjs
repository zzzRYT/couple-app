// Seeded mutation helpers shared by fuzz.test.mjs and schema.test.mjs (not a test file).
import { join } from 'node:path';
import { SAMPLES, LIBRARY, jsonFiles, readJson, libraryIndex, rng } from './paths.mjs';

export const sources = () => [
  ...jsonFiles(join(SAMPLES, 'valid')).map(f => ({ name: `valid/${f}`, doc: readJson(join(SAMPLES, 'valid', f)) })),
  ...libraryIndex().objects.map(o => ({ name: o.id, doc: readJson(join(LIBRARY, o.file)) })),
];

const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
const own = (target, key, value) => Object.defineProperty(target, key, { value, enumerable: true, configurable: true, writable: true });
const allNodes = (v, out = []) => { if (v && typeof v === 'object') { out.push(v); for (const k of Object.keys(v)) allNodes(v[k], out); } return out; };

// bad: true means the mutation introduces a construct that must never validate.
export const mutators = [
  { name: 'forbidden key', bad: true, apply: (d, r) => own(pick(allNodes(d).filter(n => !Array.isArray(n)), r), pick(['__proto__', 'constructor', 'prototype'], r), { polluted: true }) },
  { name: 'unknown shape type', bad: true, apply: (d, r) => { pick(d.shapes, r).t = pick(['text', 'image', 'use', 'foreignObject', 'script', 'a', 'g', 'svg', 'circle', 'line', 'polyline', 'style', 'Rect', ''], r); } },
  { name: 'forbidden feature key on a shape', bad: true, apply: (d, r) => { pick(d.shapes, r)[pick(['opacity', 'gradient', 'transform', 'href', 'filter', 'clipPath', 'mask', 'style', 'onclick', 'id', 'animate', 'text', 'src'], r)] = pick([0.5, 'x', { a: 1 }, 'javascript:alert(1)'], r); } },
  { name: 'unknown top-level key', bad: true, apply: (d, r) => { d[pick(['onload', 'script', 'defs', 'transform', 'extra', 'opacity', 'viewbox'], r)] = pick([1, 'x', null], r); } },
  { name: 'hostile path', bad: true, apply: (d, r) => { const s = pick(d.shapes, r); for (const k of Object.keys(s)) if (!['t', 'fill', 'stroke'].includes(k)) delete s[k]; s.t = 'path'; s.d = pick(['M10 10A5 5 0 0 1 20 20Z', 'm10 10l5 5z', 'M10 10S5 5 20 20', 'M10 10T5 5', 'M10 10L1e5 5L9 9Z', 'M10 10LNaN 5L9 9Z', 'M10 10LInfinity 5L9 9Z', 'M10 10L20 20 <script>', 'M10 10L20 20;alert(1)', 'L10 10L20 20L30 10Z', 'M10 10L5.123 5L9 9Z', 'M10 10' + 'L20 20L30 10'.repeat(30) + 'Z', 'M10 10L20 20L30 10Z'.padEnd(700, ' ')], r); } },
  { name: 'palette color', bad: true, apply: (d, r) => { d.palette[Math.floor(r() * d.palette.length)] = pick(['#000000', '#FFFFFF', '#39FF14', '#f4b79b', '#F4B79C', 'red', 'url(#a)', 'data:image/png;base64,AA', 'javascript:alert(1)', '#F4B79B80', ''], r); } },
  { name: 'label injection', bad: true, apply: (d, r) => { d.label = pick(['<script>alert(1)</script>', 'http://evil.example', 'www.x.com', 'a@b.c', '01012345678', 'data:text/html,x', 'javascript:alert(1)', 'x"onload="y', '<img src=x>', 'a&b', '', 'x'.repeat(25), '\u0000', 'a\nb'], r); } },
  { name: 'hostile coordinate', bad: true, apply: (d, r) => {
    const cands = d.shapes.filter(s => ['x', 'y', 'w', 'h', 'cx', 'cy', 'rx', 'ry'].some(k => k in s));
    if (!cands.length) { d.viewBox.w = 100000; return; }
    const s = pick(cands, r); const k = pick(['x', 'y', 'w', 'h', 'cx', 'cy', 'rx', 'ry'].filter(key => key in s), r);
    s[k] = pick([1e9, -1e9, NaN, Infinity, -Infinity, 0.0049, 300.123, '5', null, -9, 9999], r);
  } },
  { name: 'oversize', bad: true, apply: d => { d.shapes.push(...Array.from({ length: 200 }, () => ({ t: 'rect', fill: 0, stroke: false, x: 1, y: 1, w: 5, h: 5 }))); } },
  { name: 'giant string', bad: true, apply: d => { d.note = 'x'.repeat(13000); } },
];

export const scramblers = [
  (d, r) => { const n = pick(allNodes(d), r); const ks = Object.keys(n); if (ks.length) delete n[pick(ks, r)]; },
  (d, r) => { const n = pick(allNodes(d), r); const ks = Object.keys(n); if (ks.length) n[pick(ks, r)] = pick([null, true, false, 0, -1, 1.5, '', 'x', [], {}, [1, 2], { x: 1 }, 1e308, '#FFF4DF'], r); },
  (d, r) => { const n = pick(allNodes(d), r); if (Array.isArray(n) && n.length) n.splice(Math.floor(r() * n.length), 1); },
  (d, r) => { const n = pick(allNodes(d), r); if (Array.isArray(n)) n.push(pick([null, 1, 'x', {}], r)); },
  (d, r) => { const s = pick(d.shapes, r); const ks = Object.keys(s).filter(k => typeof s[k] === 'number'); if (ks.length) s[pick(ks, r)] += pick([-1000, -3, -0.5, 0.005, 0.5, 3, 1000], r); },
];

/** Returns { doc, bad, applied }. */
export function mutate(source, seed) {
  const r = rng(seed);
  const doc = JSON.parse(JSON.stringify(source));
  const applied = [];
  let bad = false;
  // scrambles first (they may delete parts of the document), then the forbidden-construct mutators,
  // so a later step can never silently remove an earlier forbidden construct.
  const scrambles = Math.floor(r() * 3);
  for (let i = 0; i < scrambles; i++) { try { pick(scramblers, r)(doc, r); applied.push('scramble'); } catch { /* target missing */ } }
  const hostile = r() < 0.8 ? 1 + Math.floor(r() * 2) : 0;
  for (let i = 0; i < hostile; i++) {
    const m = pick(mutators, r);
    try { m.apply(doc, r); applied.push(m.name); bad ||= m.bad; } catch { /* target missing: the mutation did not happen */ }
  }
  return { doc, bad, applied };
}

export function mutateText(text, seed) {
  const r = rng(seed);
  const chars = ['{', '}', '[', ']', '"', ',', ':', '\\', '\u0000', ' ', '<', '\n', '1', 'e', '-', '﻿', '\ud800'];
  const op = Math.floor(r() * 4);
  if (op === 0) return text.slice(0, Math.floor(r() * text.length));
  if (op === 1) { const i = Math.floor(r() * text.length); return text.slice(0, i) + pick(chars, r) + text.slice(i + 1); }
  if (op === 2) { const i = Math.floor(r() * text.length); return text.slice(0, i) + pick(chars, r) + text.slice(i); }
  const i = Math.floor(r() * text.length), j = Math.min(text.length, i + 1 + Math.floor(r() * 30));
  return text.slice(0, i) + text.slice(j);
}
