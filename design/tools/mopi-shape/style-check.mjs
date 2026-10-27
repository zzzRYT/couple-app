// Style-conformance helper for mopi-shape-v1 documents (zero dependencies).
//
// Computes simple geometric/color heuristics and a conformance score 0..1 against the house style described in
// design/reference-library/style-spec.md. It measures STYLE CLOSENESS ONLY (flat pastel fills, outlined silhouette,
// soft rounded forms, few colors, few shapes). It does NOT measure similarity to any existing artwork: a document can
// pass this check and still resemble a copyrighted or trademarked design. Use the approval checklist for that.
//
// usage: node style-check.mjs [libraryDir | files...]   (default: design/reference-library: objects + examples-dont)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGeneratedObject, parsePath, LIMITS } from './validate.mjs';

export const THRESHOLDS = Object.freeze({
  passScore: 0.9,
  maxFillsComfortable: 3, // 4 is the hard format limit
  maxHueFamilies: 3, // warm / green / blue / violet; neutrals (saturation < 0.15) do not count
  shapesComfortable: 16,
  shapesTooMany: 30, // hard fail above
  minRoundedRatio: 0.4, // hard fail below; full marks from 0.7
  minOutlineCoverage: 0.3, // hard fail below (area weighted); full marks from 0.6
  maxSpikes: 2, // vertices with an interior angle below 60 degrees; 3 or more is a hard fail
});

const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
function hueSat(hex) {
  const [r, g, b] = hexRgb(hex);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const s = mx === 0 ? 0 : d / mx;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: ((h * 60) + 360) % 360, s };
}
export function hueFamily(hex) {
  const { h, s } = hueSat(hex);
  if (s < 0.15) return null; // neutral (cream, ice, room wall)
  if (h <= 65 || h >= 335) return 'warm';
  if (h < 170) return 'green';
  if (h < 260) return 'blue';
  return 'violet';
}

const bboxArea = b => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
function shapeInfo(s) {
  if (s.t === 'rect') return { bbox: { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h }, round: s.rx ? 1 : 0, verts: [] };
  if (s.t === 'ellipse') return { bbox: { x0: s.cx - s.rx, y0: s.cy - s.ry, x1: s.cx + s.rx, y1: s.cy + s.ry }, round: 1, verts: [] };
  if (s.t === 'poly') {
    const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]);
    return { bbox: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }, round: 0, verts: [s.pts] };
  }
  const cmds = parsePath(s.d).cmds;
  let cur = [0, 0], curved = 0, straight = 0;
  const xs = [], ys = [];
  const runs = []; let run = [];
  const flush = () => { if (run.length > 2) runs.push(run); run = []; };
  for (const { c, args: a } of cmds) {
    if (c === 'M') { flush(); cur = [a[0], a[1]]; run = [cur]; }
    else if (c === 'L') { cur = [a[0], a[1]]; run.push(cur); straight++; }
    else if (c === 'H') { cur = [a[0], cur[1]]; run.push(cur); straight++; }
    else if (c === 'V') { cur = [cur[0], a[0]]; run.push(cur); straight++; }
    else if (c === 'Q') { flush(); cur = [a[2], a[3]]; run = [cur]; curved++; xs.push(a[0]); ys.push(a[1]); }
    else if (c === 'C') { flush(); cur = [a[4], a[5]]; run = [cur]; curved++; xs.push(a[0], a[2]); ys.push(a[1], a[3]); }
    xs.push(cur[0]); ys.push(cur[1]);
  }
  flush();
  return { bbox: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }, round: curved + straight ? curved / (curved + straight) : 0, verts: runs };
}

function countSpikes(vertRuns, closedPolys) {
  let spikes = 0;
  const test = (p0, p1, p2) => {
    const ax = p0[0] - p1[0], ay = p0[1] - p1[1], bx = p2[0] - p1[0], by = p2[1] - p1[1];
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (!la || !lb) return;
    const ang = Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))) * 180 / Math.PI;
    if (ang < 60) spikes++;
  };
  for (const pts of vertRuns) for (let i = 1; i < pts.length - 1; i++) test(pts[i - 1], pts[i], pts[i + 1]);
  for (const pts of closedPolys) for (let i = 0; i < pts.length; i++) test(pts[(i - 1 + pts.length) % pts.length], pts[i], pts[(i + 1) % pts.length]);
  return spikes;
}

const clamp01 = v => Math.max(0, Math.min(1, v));

/** doc must be a valid mopi-shape-v1 document. Returns { score, pass, hardFails, metrics }. */
export function styleCheck(doc) {
  const v = validateGeneratedObject(doc);
  if (!v.ok) throw new Error(`styleCheck needs a valid document (${v.errors[0].code})`);
  const infos = doc.shapes.map(shapeInfo);
  const usedFills = [...new Set(doc.shapes.filter(s => s.fill !== null).map(s => s.fill))];
  const families = new Set(usedFills.map(i => hueFamily(doc.palette[i])).filter(Boolean));
  const roundedRatio = infos.reduce((a, i) => a + i.round, 0) / infos.length;
  const areas = doc.shapes.map((s, k) => bboxArea(infos[k].bbox));
  const totalArea = areas.reduce((a, b) => a + b, 0) || 1;
  const strokedArea = doc.shapes.reduce((a, s, k) => a + (s.stroke ? areas[k] : 0), 0);
  const largest = areas.indexOf(Math.max(...areas));
  const silhouetteOutlined = doc.shapes[largest].stroke === true;
  const spikes = countSpikes(infos.flatMap(i => (doc.shapes[infos.indexOf(i)].t === 'path' ? i.verts : [])), infos.flatMap((i, k) => (doc.shapes[k].t === 'poly' ? i.verts : [])));
  const metrics = {
    shapes: doc.shapes.length,
    fillsUsed: usedFills.length,
    hueFamilies: families.size,
    roundedRatio: Math.round(roundedRatio * 100) / 100,
    outlineCoverage: Math.round((strokedArea / totalArea) * 100) / 100,
    silhouetteOutlined,
    spikes,
  };
  const T = THRESHOLDS;
  const sub = {
    fills: metrics.fillsUsed <= T.maxFillsComfortable ? 1 : metrics.fillsUsed === LIMITS.paletteMax ? 0.75 : 0,
    hues: metrics.hueFamilies <= 2 ? 1 : metrics.hueFamilies === 3 ? 0.8 : 0,
    shapes: metrics.shapes <= T.shapesComfortable ? 1 : metrics.shapes <= 24 ? 0.85 : metrics.shapes <= T.shapesTooMany ? 0.5 : 0,
    rounded: clamp01((metrics.roundedRatio - 0.3) / 0.4),
    outline: silhouetteOutlined ? clamp01(metrics.outlineCoverage / 0.6) : 0,
    spikes: metrics.spikes === 0 ? 1 : metrics.spikes <= T.maxSpikes ? 0.5 : 0,
  };
  const weights = { fills: 1, hues: 1, shapes: 1, rounded: 2, outline: 2, spikes: 1 };
  const score = Math.round((Object.entries(weights).reduce((a, [k, w]) => a + sub[k] * w, 0) / Object.values(weights).reduce((a, b) => a + b, 0)) * 100) / 100;
  const hardFails = [];
  if (metrics.hueFamilies > T.maxHueFamilies) hardFails.push('HUE_FAMILIES');
  if (metrics.shapes > T.shapesTooMany) hardFails.push('TOO_MANY_SHAPES');
  if (metrics.roundedRatio < T.minRoundedRatio) hardFails.push('NOT_ROUNDED');
  if (!silhouetteOutlined || metrics.outlineCoverage < T.minOutlineCoverage) hardFails.push('NO_OUTLINE');
  if (metrics.spikes > T.maxSpikes) hardFails.push('SPIKES');
  return { score, pass: score >= T.passScore && hardFails.length === 0, hardFails, metrics, sub };
}

const here = dirname(fileURLToPath(import.meta.url));

export function main(args) {
  const libDir = resolve(here, '../../reference-library');
  const targets = [];
  if (args.length && !(args.length === 1 && existsSync(args[0]) && !args[0].endsWith('.json'))) args.forEach(f => targets.push(['file', resolve(f)]));
  else {
    const dir = args[0] ? resolve(args[0]) : libDir;
    for (const [group, sub] of [['reference', 'objects'], ['dont', 'examples-dont']]) {
      if (existsSync(join(dir, sub))) readdirSync(join(dir, sub)).filter(f => f.endsWith('.json')).sort().forEach(f => targets.push([group, join(dir, sub, f)]));
    }
  }
  let unexpected = 0;
  console.log('group      score pass  shapes fills hues round outline silh spikes  file');
  for (const [group, file] of targets) {
    const r = styleCheck(JSON.parse(readFileSync(file, 'utf8')));
    const m = r.metrics;
    const expected = group === 'dont' ? false : group === 'reference' ? true : null;
    if (expected !== null && r.pass !== expected) unexpected++;
    console.log(`${group.padEnd(10)} ${r.score.toFixed(2)}  ${r.pass ? 'PASS' : 'FAIL'}  ${String(m.shapes).padStart(5)} ${String(m.fillsUsed).padStart(5)} ${String(m.hueFamilies).padStart(4)} ${m.roundedRatio.toFixed(2).padStart(5)} ${m.outlineCoverage.toFixed(2).padStart(7)} ${m.silhouetteOutlined ? 'yes ' : 'no  '} ${String(m.spikes).padStart(5)}  ${file.split('/').slice(-2).join('/')}${r.hardFails.length ? '  [' + r.hardFails.join(',') + ']' : ''}`);
  }
  console.log(unexpected ? `${unexpected} unexpected result(s): references should PASS, examples-dont should FAIL` : 'references pass and examples-dont fail, as expected');
  return unexpected ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
