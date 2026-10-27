// Deterministic reference renderer for mopi-shape-v1 (zero dependencies).
//
// toSvg(doc, { background?: 'day' | 'night' | 'none', surface?: 'wall' | 'floor', scale?: number, pad?: number }) -> string
//
// This is the reference for the app's Skia renderer: same draw order, same widths, same fill offset.
// Safety: the input is validated first (throws if invalid); the output is built ONLY from validated numbers,
// canonical path strings and allowlisted colors, so no document text can reach the SVG as markup.
// Same input => byte-identical output (numbers are rounded to 2 decimals, no timestamps, no ids).
//
// Draw order (copied from design/assets-sketch/*.svg and design/assets-spec.md section 4.3):
//   1. rim pass    : every shape with stroke=true, cream (#FFF4DF) fill + cream stroke of the rim width, round joins
//   2. per shape   : its fill, shifted right/down by the fill offset (no outline), then its outline (#4A3426) if stroke=true
import { validateGeneratedObject, normalizeGeneratedObject, parsePath, serializePath, strokeMetrics, STYLE, r2 } from './validate.mjs';

const num = n => String(r2(n));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function geometryAttrs(s) {
  if (s.t === 'rect') return { tag: 'rect', attrs: `x="${num(s.x)}" y="${num(s.y)}" width="${num(s.w)}" height="${num(s.h)}"${s.rx ? ` rx="${num(s.rx)}"` : ''}` };
  if (s.t === 'ellipse') return { tag: 'ellipse', attrs: `cx="${num(s.cx)}" cy="${num(s.cy)}" rx="${num(s.rx)}" ry="${num(s.ry)}"` };
  if (s.t === 'poly') return { tag: 'polygon', attrs: `points="${s.pts.map(([x, y]) => `${num(x)},${num(y)}`).join(' ')}"` };
  return { tag: 'path', attrs: `d="${serializePath(parsePath(s.d).cmds)}"` };
}

export function toSvg(doc, options = {}) {
  const res = validateGeneratedObject(doc);
  if (!res.ok) {
    const e = new Error(`toSvg: invalid document (${res.errors.map(x => x.code).join(', ')})`);
    e.errors = res.errors;
    throw e;
  }
  const d = normalizeGeneratedObject(doc);
  const { background = 'none', surface = 'wall' } = options;
  const scale = options.scale ?? 1;
  const pad = options.pad ?? 0;
  if (!['day', 'night', 'none'].includes(background)) throw new Error('toSvg: background must be day, night or none');
  if (!['wall', 'floor'].includes(surface)) throw new Error('toSvg: surface must be wall or floor');
  if (!(typeof scale === 'number' && scale > 0 && scale <= 16) || !(typeof pad === 'number' && pad >= 0 && pad <= 64)) throw new Error('toSvg: scale must be 0..16 and pad 0..64');

  const { w, h } = d.viewBox;
  const m = strokeMetrics(d.viewBox);
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${num(-pad)} ${num(-pad)} ${num(w + 2 * pad)} ${num(h + 2 * pad)}" width="${num((w + 2 * pad) * scale)}" height="${num((h + 2 * pad) * scale)}">`);
  out.push(`<title>${esc(d.label)}</title>`);
  if (background !== 'none') out.push(`<rect x="${num(-pad)}" y="${num(-pad)}" width="${num(w + 2 * pad)}" height="${num(h + 2 * pad)}" fill="${STYLE.roomColors[background][surface]}"/>`);

  const joins = 'stroke-linejoin="round" stroke-linecap="round"';
  // 1. rim pass
  for (const s of d.shapes) {
    if (!s.stroke) continue;
    const g = geometryAttrs(s);
    out.push(`<${g.tag} ${g.attrs} fill="${s.fill === null ? 'none' : STYLE.rim}" stroke="${STYLE.rim}" stroke-width="${num(m.rim)}" ${joins}/>`);
  }
  // 2. fill (offset) then outline, shape by shape
  for (const s of d.shapes) {
    const g = geometryAttrs(s);
    if (s.fill !== null) out.push(`<${g.tag} ${g.attrs} fill="${d.palette[s.fill]}" transform="translate(${num(m.offsetX)} ${num(m.offsetY)})"/>`);
    if (s.stroke) out.push(`<${g.tag} ${g.attrs} fill="none" stroke="${STYLE.outline}" stroke-width="${num(m.outline)}" ${joins}/>`);
  }
  out.push('</svg>');
  return out.join('\n');
}
