// mopi-shape-v1 validator (zero dependencies).
//
// A document is DATA: a restricted flat shape list. Nothing in it is ever executed or interpreted as markup.
// Entry points:
//   validateJsonText(text, options)        raw text from the model -> strict parse (size, BOM, duplicate keys) -> validate
//   validateGeneratedObject(doc, options)  an already parsed object (must come from JSON.parse or validateJsonText)
// Both return { ok, errors: [{ code, path, message }], stats: { shapes, bytes, complexityScore } }.
// errors[0] is the "primary" error: checks run in a fixed order (guards, structure, kind fields, label, viewBox,
// anchor, palette, shapes, complexity, bubble rules), so one defect gives one stable primary code.
//
// Normative structural limits are mirrored by specs/001-couple-prompt-todo/contracts/generated-object.schema.json.
// Cross-field rules (palette allowlist, coordinate range vs viewBox, containment, contrast, complexity) live only here.

export const FORMAT = 'mopi-shape-v1';

export const LIMITS = Object.freeze({
  maxBytes: 12 * 1024,
  maxShapes: 40,
  maxPathChars: 600,
  maxPathCommands: 48,
  polyMinPoints: 3,
  polyMaxPoints: 24,
  labelMaxChars: 24,
  paletteMax: 4,
  viewMin: 32,
  viewMax: 512,
  longSideMin: 128,
  longSideMax: 512,
  bleed: 8,
  decimals: 2,
  maxComplexity: 60,
  // props (small room objects) are smaller than backgrounds
  propMaxShapes: 30,
  propMaxComplexity: 45,
  propLongSideMin: 64,
  propLongSideMax: 256,
  textAreaMinW: 0.4,
  textAreaMinH: 0.25,
  minContrast: 4.5,
  maxDepth: 8,
  maxNodes: 2000,
  maxArray: 2000,
  maxErrors: 50,
});

// The 15 color.illustration.palette.* tokens (design/tokens.json) + the day room wall and floor.
export const PALETTE_ALLOWLIST = Object.freeze({
  peach: '#F4B79B',
  butter: '#F7D98B',
  sage: '#A8C6A0',
  sage2: '#8FB68A',
  sky: '#AACBE2',
  sky2: '#8DB6D2',
  pink: '#F2A7B4',
  rose: '#E88A9B',
  cream: '#FFF4DF',
  terra: '#D98B63',
  wood: '#C99A6B',
  ice: '#E6F0F7',
  lav: '#C9B8E8',
  aqua: '#9ED8CB',
  dark: '#7A5C48',
  roomDayWall: '#FBF1E3',
  roomDayFloor: '#F3E0C4',
});
const ALLOWED_HEX = new Set(Object.values(PALETTE_ALLOWLIST));

export const TEXT_COLOR = '#3A261C';

// House outline/rim/offset ratios measured from design/assets-sketch/*.svg (64 x 64 boxes):
// outline stroke 2.4, rim stroke 5.8 (= outline + 2 x 1.7), fill offset translate(1.3 1).
export const STYLE = Object.freeze({
  outline: '#4A3426',
  rim: '#FFF4DF',
  outlineRatio: 2.4 / 64, // 3.75 % of max(w,h)
  rimStrokeRatio: 5.8 / 64, // 9.0625 % of max(w,h)
  offsetXRatio: 1.3 / 64, // 2.03 %
  offsetYRatio: 1.0 / 64, // 1.56 %
  roomColors: Object.freeze({
    day: Object.freeze({ wall: '#FBF1E3', floor: '#F3E0C4' }),
    night: Object.freeze({ wall: '#2B2320', floor: '#352A25' }),
  }),
});

export const KINDS = Object.freeze(['background_piece', 'bubble_frame', 'prop']);
// placement hints per kind (bubble_frame has none)
export const LAYER_HINTS_BY_KIND = Object.freeze({
  background_piece: Object.freeze(['wall', 'floor', 'backdrop', 'window_view']),
  prop: Object.freeze(['floor', 'wall', 'shelf']),
});
export const LAYER_HINTS = Object.freeze([...new Set(Object.values(LAYER_HINTS_BY_KIND).flat())]);

/** Per-kind size limits: { maxShapes, maxComplexity, longMin, longMax }. */
export function kindLimits(kind) {
  if (kind === 'prop') return { maxShapes: LIMITS.propMaxShapes, maxComplexity: LIMITS.propMaxComplexity, longMin: LIMITS.propLongSideMin, longMax: LIMITS.propLongSideMax };
  return { maxShapes: LIMITS.maxShapes, maxComplexity: LIMITS.maxComplexity, longMin: LIMITS.longSideMin, longMax: LIMITS.longSideMax };
}
export const SHAPE_TYPES = Object.freeze(['rect', 'ellipse', 'poly', 'path']);

export const ERROR_CODES = Object.freeze([
  'JSON_SYNTAX', 'JSON_DUPLICATE_KEY',
  'SCHEMA_TYPE', 'SCHEMA_UNKNOWN_KEY', 'SCHEMA_MISSING_KEY', 'FORBIDDEN_KEY',
  'KIND_FIELDS', 'LABEL_INVALID',
  'LIMIT_BYTES', 'LIMIT_SHAPES', 'LIMIT_PATH', 'LIMIT_POINTS', 'COMPLEXITY',
  'SHAPE_TYPE', 'SHAPE_INVISIBLE',
  'PATH_COMMAND', 'PATH_NUMBER', 'PATH_SYNTAX',
  'RANGE_COORD', 'RANGE_SIZE', 'ZERO_AREA',
  'PALETTE_NOT_ALLOWED', 'PALETTE_COUNT', 'PALETTE_INDEX',
  'BUBBLE_TEXTAREA', 'BUBBLE_COVER', 'BUBBLE_CONTRAST',
  'PROP_FACE_LIKE',
]);

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const TOP_KEYS = ['schemaVersion', 'format', 'kind', 'layerHint', 'label', 'viewBox', 'anchor', 'palette', 'shapes', 'textArea', 'textFill', 'tail'];
const TOP_REQUIRED = ['schemaVersion', 'format', 'kind', 'label', 'viewBox', 'anchor', 'palette', 'shapes'];
const SHAPE_KEYS = {
  rect: { all: ['t', 'fill', 'stroke', 'x', 'y', 'w', 'h', 'rx'], req: ['t', 'fill', 'stroke', 'x', 'y', 'w', 'h'] },
  ellipse: { all: ['t', 'fill', 'stroke', 'cx', 'cy', 'rx', 'ry'], req: ['t', 'fill', 'stroke', 'cx', 'cy', 'rx', 'ry'] },
  poly: { all: ['t', 'fill', 'stroke', 'pts'], req: ['t', 'fill', 'stroke', 'pts'] },
  path: { all: ['t', 'fill', 'stroke', 'd'], req: ['t', 'fill', 'stroke', 'd'] },
};

// ---------------------------------------------------------------- color helpers
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = h => { const [r, g, b] = hexRgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
/** WCAG 2.x contrast ratio between two #RRGGBB colors. */
export function contrastRatio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// ---------------------------------------------------------------- number helpers
export const r2 = n => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? 0 : v; };
const isNum = v => typeof v === 'number' && Number.isFinite(v);
const isDec2 = v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
const isPlain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** Outline width, rim stroke width and fill offset (document units) for a viewBox. */
export function strokeMetrics(viewBox) {
  const m = Math.max(viewBox.w, viewBox.h);
  return {
    outline: r2(STYLE.outlineRatio * m),
    rim: r2(STYLE.rimStrokeRatio * m),
    offsetX: r2(STYLE.offsetXRatio * m),
    offsetY: r2(STYLE.offsetYRatio * m),
  };
}

// ---------------------------------------------------------------- strict JSON text parser
class JsonError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function parseStrictJson(text) {
  let i = 0;
  const n = text.length;
  const fail = (msg, code = 'JSON_SYNTAX') => { throw new JsonError(code, `${msg} (at offset ${i})`); };
  const ws = () => { while (i < n) { const c = text.charCodeAt(i); if (c === 32 || c === 9 || c === 10 || c === 13) i++; else break; } };
  function value(depth) {
    if (depth > LIMITS.maxDepth) fail('nesting too deep');
    ws();
    if (i >= n) fail('unexpected end');
    const c = text[i];
    if (c === '{') return object(depth);
    if (c === '[') return array(depth);
    if (c === '"') return string();
    if (c === '-' || (c >= '0' && c <= '9')) return number();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    return fail(`unexpected character ${JSON.stringify(c)}`);
  }
  function object(depth) {
    i++;
    const o = Object.create(null);
    ws();
    if (text[i] === '}') { i++; return o; }
    for (;;) {
      ws();
      if (text[i] !== '"') fail('object key must be a string');
      const k = string();
      if (Object.prototype.hasOwnProperty.call(o, k)) fail(`duplicate key ${JSON.stringify(k)}`, 'JSON_DUPLICATE_KEY');
      ws();
      if (text[i] !== ':') fail('expected ":"');
      i++;
      o[k] = value(depth + 1);
      ws();
      if (text[i] === ',') { i++; continue; }
      if (text[i] === '}') { i++; return o; }
      fail('expected "," or "}"');
    }
  }
  function array(depth) {
    i++;
    const a = [];
    ws();
    if (text[i] === ']') { i++; return a; }
    for (;;) {
      a.push(value(depth + 1));
      if (a.length > LIMITS.maxArray) fail('array too long');
      ws();
      if (text[i] === ',') { i++; continue; }
      if (text[i] === ']') { i++; return a; }
      fail('expected "," or "]"');
    }
  }
  function string() {
    i++;
    let out = '';
    for (;;) {
      if (i >= n) fail('unterminated string');
      const c = text[i];
      const code = text.charCodeAt(i);
      if (c === '"') { i++; break; }
      if (code < 0x20) fail('control character in string');
      if (c === '\\') {
        const e = text[i + 1];
        const map = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
        if (e in map) { out += map[e]; i += 2; continue; }
        if (e === 'u') {
          const hex = text.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('bad \\u escape');
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
          continue;
        }
        fail('bad escape');
      }
      out += c;
      i++;
    }
    // lone surrogates are not valid Unicode text
    for (let k = 0; k < out.length; k++) {
      const cc = out.charCodeAt(k);
      if (cc >= 0xd800 && cc <= 0xdbff) { const d = out.charCodeAt(k + 1); if (d >= 0xdc00 && d <= 0xdfff) { k++; continue; } fail('lone surrogate'); }
      if (cc >= 0xdc00 && cc <= 0xdfff) fail('lone surrogate');
    }
    return out;
  }
  function number() {
    const m = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(i, i + 64));
    if (!m) fail('bad number');
    i += m[0].length;
    const v = Number(m[0]);
    if (!Number.isFinite(v)) fail('number out of range');
    return v;
  }
  const v = value(0);
  ws();
  if (i < n) fail('trailing content after the JSON value');
  return v;
}

// ---------------------------------------------------------------- path parser (absolute M L H V C Q Z only)
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, Z: 0 };

/**
 * Strict parser. Returns { cmds: [{c, args}] } or { error: {code, message} }.
 * Grammar: command letter, then exactly its arguments (no implicit repetition); separators are " " or ",".
 * Numbers: -?digits(.1-2 digits)? only (no exponent, no leading "+" or ".", no NaN/Infinity).
 */
export function parsePath(d) {
  const err = (code, message) => ({ error: { code, message } });
  if (typeof d !== 'string') return err('SCHEMA_TYPE', 'path d must be a string');
  if (d.length === 0 || d.length > LIMITS.maxPathChars) return err('LIMIT_PATH', `path d must be 1..${LIMITS.maxPathChars} characters (got ${d.length})`);
  const n = d.length;
  let i = 0;
  const cmds = [];
  const skipSep = () => { while (i < n && (d[i] === ' ' || d[i] === ',')) i++; };
  const readNumber = () => {
    skipSep();
    const rest = d.slice(i, i + 12);
    if (/^[-+]?(nan|inf)/i.test(rest)) return err('PATH_NUMBER', 'NaN/Infinity are not numbers');
    const m = /^-?\d+(?:\.\d+)?/.exec(d.slice(i));
    if (!m) {
      if (i >= n) return err('PATH_SYNTAX', 'missing arguments at end of path');
      if (/[A-Za-z]/.test(d[i])) return err('PATH_SYNTAX', 'too few arguments before the next command');
      if (d[i] === '+' || d[i] === '.') return err('PATH_NUMBER', `bad number start ${JSON.stringify(d[i])} (use plain decimals like 12.5)`);
      return err('PATH_SYNTAX', `unexpected character ${JSON.stringify(d[i])}`);
    }
    const tok = m[0];
    const dot = tok.indexOf('.');
    if (dot >= 0 && tok.length - dot - 1 > LIMITS.decimals) return err('PATH_NUMBER', `more than ${LIMITS.decimals} decimals in ${tok}`);
    const after = d[i + tok.length];
    if (after === 'e' || after === 'E') return err('PATH_NUMBER', 'exponent notation is not allowed');
    if (after === '.') return err('PATH_NUMBER', `malformed number near ${tok}.`);
    if (after === '-') return err('PATH_SYNTAX', 'numbers must be separated by a space or comma');
    const v = Number(tok);
    if (!Number.isFinite(v)) return err('PATH_NUMBER', 'number is not finite');
    i += tok.length;
    return { v };
  };
  skipSep();
  while (i < n) {
    const ch = d[i];
    if (/[A-Za-z]/.test(ch)) {
      if (!hasOwn(ARITY, ch)) {
        let why = 'unknown command';
        if (ch >= 'a' && ch <= 'z') why = 'relative (lowercase) commands are not allowed';
        else if (ch === 'A') why = 'arc commands are not allowed';
        else if (ch === 'S' || ch === 'T') why = 'smooth curve commands (S, T) are not allowed';
        return err('PATH_COMMAND', `${JSON.stringify(ch)}: ${why}; use only absolute M L H V C Q Z`);
      }
      i++;
      const args = [];
      for (let a = 0; a < ARITY[ch]; a++) {
        const r = readNumber();
        if (r.error) return r;
        args.push(r.v);
      }
      cmds.push({ c: ch, args });
      if (cmds.length > LIMITS.maxPathCommands) return err('LIMIT_PATH', `more than ${LIMITS.maxPathCommands} path commands`);
      skipSep();
    } else if (/[-0-9.+]/.test(ch)) {
      return err('PATH_SYNTAX', 'extra numbers after a complete command (implicit repetition is not allowed)');
    } else {
      return err('PATH_SYNTAX', `unexpected character ${JSON.stringify(ch)}`);
    }
  }
  if (cmds.length < 2) return err('PATH_SYNTAX', 'a path needs M plus at least one drawing command');
  if (cmds[0].c !== 'M') return err('PATH_SYNTAX', 'a path must start with M');
  return { cmds };
}

/** Canonical path string (deterministic: letter + args joined by single spaces). */
export function serializePath(cmds) {
  return cmds.map(({ c, args }) => c + args.map(a => String(r2(a))).join(' ')).join('');
}

/** All points a path visits (end points and control points, with H/V resolved against the current point). */
export function pathPoints(cmds) {
  const pts = [];
  let cx = 0, cy = 0;
  for (const { c, args: a } of cmds) {
    if (c === 'M' || c === 'L') { cx = a[0]; cy = a[1]; pts.push([cx, cy]); }
    else if (c === 'H') { cx = a[0]; pts.push([cx, cy]); }
    else if (c === 'V') { cy = a[0]; pts.push([cx, cy]); }
    else if (c === 'Q') { pts.push([a[0], a[1]], [a[2], a[3]]); cx = a[2]; cy = a[3]; }
    else if (c === 'C') { pts.push([a[0], a[1]], [a[2], a[3]], [a[4], a[5]]); cx = a[4]; cy = a[5]; }
  }
  return pts;
}

// ---------------------------------------------------------------- geometry for the bubble cover test
const bboxOfPoints = pts => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1 };
};
const rectsOverlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1; // open interiors

function pointInRoundedRect(px, py, s) {
  if (px < s.x || px > s.x + s.w || py < s.y || py > s.y + s.h) return false;
  const rx = s.rx || 0;
  if (!rx) return true;
  const cx = px < s.x + rx ? s.x + rx : px > s.x + s.w - rx ? s.x + s.w - rx : px;
  const cy = py < s.y + rx ? s.y + rx : py > s.y + s.h - rx ? s.y + s.h - rx : py;
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= rx * rx + 1e-9;
}
function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const ccw = (ax, ay, bx, by, cx, cy) => (cy - ay) * (bx - ax) - (by - ay) * (cx - ax);
function segmentsCross(p, q, r, s) {
  const d1 = ccw(p[0], p[1], q[0], q[1], r[0], r[1]);
  const d2 = ccw(p[0], p[1], q[0], q[1], s[0], s[1]);
  const d3 = ccw(r[0], r[1], s[0], s[1], p[0], p[1]);
  const d4 = ccw(r[0], r[1], s[0], s[1], q[0], q[1]);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
/** Does the closed shape (rect/ellipse/poly geometry) contain the axis-aligned rectangle r completely? */
function shapeContainsRect(s, r) {
  const corners = [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]];
  if (s.t === 'rect') return corners.every(([x, y]) => pointInRoundedRect(x, y, s));
  if (s.t === 'ellipse') return corners.every(([x, y]) => ((x - s.cx) / s.rx) ** 2 + ((y - s.cy) / s.ry) ** 2 <= 1 + 1e-9);
  if (s.t === 'poly') {
    if (!corners.every(([x, y]) => pointInPoly(x, y, s.pts))) return false;
    if (s.pts.some(([x, y]) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1)) return false;
    for (let i = 0; i < s.pts.length; i++) {
      const a = s.pts[i], b = s.pts[(i + 1) % s.pts.length];
      for (let k = 0; k < 4; k++) if (segmentsCross(a, b, corners[k], corners[(k + 1) % 4])) return false;
    }
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- label
const LABEL_CHARSET = /^[A-Za-z0-9 .,'\-ㄱ-ㆎ가-힣ぁ-ゖァ-ヺー]+$/u;
export function labelProblem(label) {
  if (typeof label !== 'string') return 'label must be a string';
  const len = [...label].length;
  if (len < 1 || len > LIMITS.labelMaxChars) return `label must be 1..${LIMITS.labelMaxChars} characters (got ${len})`;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(label)) return 'control characters are not allowed in label';
  if (/:\/\/|www\.|\bhttps?:|\bdata:|\bjavascript:/i.test(label)) return 'URL-like text is not allowed in label';
  if (/\.(com|net|org|io|kr|co|me|app|dev|xyz|info|biz|link|ly|gg|tv|jp|cn|ru|to|ai|shop|site|online)\b/i.test(label) || /[A-Za-z0-9-]\.[A-Za-z]{2,}/.test(label)) return 'URL-like text is not allowed in label';
  if (/[@<>]/.test(label)) return 'label must not contain "@", "<" or ">"';
  if (/\d{5,}/.test(label) || (label.match(/\d/g) || []).length >= 7) return 'phone-like digit runs are not allowed in label';
  if (label !== label.trim() || /\s{2,}/.test(label)) return 'label must not have leading, trailing or repeated spaces';
  if (!LABEL_CHARSET.test(label)) {
    const bad = [...label].find(ch => !LABEL_CHARSET.test(ch));
    return `character ${JSON.stringify(bad)} is not allowed in label (Hangul, Latin, Kana, digits, space and . , ' - only)`;
  }
  return null;
}

// ---------------------------------------------------------------- validator
function scan(root, add) {
  // Guard pass: forbidden keys, plain data only, depth/size caps. Safe on cyclic input.
  const stack = [[root, 0, '']];
  let nodes = 0;
  let forbidden = false;
  while (stack.length) {
    const [v, depth, path] = stack.pop();
    const t = typeof v;
    if (t === 'string') { if (v.length > LIMITS.maxBytes) { add('LIMIT_BYTES', path || '/', 'string value is longer than the whole document limit'); return false; } continue; }
    if (v === null || t === 'boolean') continue;
    if (t === 'number') { if (!Number.isFinite(v)) { add('SCHEMA_TYPE', path || '/', 'non-finite number'); return false; } continue; }
    if (t !== 'object') { add('SCHEMA_TYPE', path || '/', `non-JSON value (${t})`); return false; }
    if (++nodes > LIMITS.maxNodes || depth > LIMITS.maxDepth) { add('SCHEMA_TYPE', path || '/', 'structure too deep or too large'); return false; }
    if (Array.isArray(v)) {
      if (v.length > LIMITS.maxArray || Object.keys(v).length !== v.length) { add('SCHEMA_TYPE', path || '/', 'array too long or sparse'); return false; }
      for (let k = 0; k < v.length; k++) {
        const dsc = Object.getOwnPropertyDescriptor(v, k);
        if (!dsc || dsc.get || dsc.set) { add('SCHEMA_TYPE', `${path}/${k}`, 'accessor in data'); return false; }
        stack.push([dsc.value, depth + 1, `${path}/${k}`]);
      }
      continue;
    }
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) { add('SCHEMA_TYPE', path || '/', 'not a plain object'); return false; }
    if (Object.getOwnPropertySymbols(v).length) { add('SCHEMA_TYPE', path || '/', 'symbol keys are not allowed'); return false; }
    for (const k of Object.getOwnPropertyNames(v)) {
      if (k.length > 256) { add('LIMIT_BYTES', path || '/', 'key is unreasonably long'); return false; }
      if (FORBIDDEN_KEYS.has(k)) { add('FORBIDDEN_KEY', `${path}/${k}`, `key ${JSON.stringify(k)} is forbidden`); forbidden = true; continue; }
      const dsc = Object.getOwnPropertyDescriptor(v, k);
      if (dsc.get || dsc.set) { add('SCHEMA_TYPE', `${path}/${k}`, 'accessor in data'); return false; }
      stack.push([dsc.value, depth + 1, `${path}/${k}`]);
    }
  }
  return !forbidden;
}

function checkKeys(obj, path, allowed, required, add) {
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) add('SCHEMA_UNKNOWN_KEY', `${path}/${k}`, `unknown key ${JSON.stringify(k)}`);
  for (const k of required) if (!hasOwn(obj, k)) add('SCHEMA_MISSING_KEY', `${path}/${k}`, `missing required key ${JSON.stringify(k)}`);
}

export function validateGeneratedObject(doc, options = {}) {
  const maxErrors = options.maxErrors ?? LIMITS.maxErrors;
  const errors = [];
  const stats = { shapes: 0, bytes: options._bytes ?? 0, complexityScore: 0 };
  const add = (code, path, message) => { if (errors.length < maxErrors) errors.push({ code, path: path || '/', message }); };
  const finish = () => {
    const res = { ok: errors.length === 0, errors, stats };
    if (res.ok && options.normalize) res.normalized = normalizeGeneratedObject(doc);
    return res;
  };

  if (!scan(doc, add)) return finish();
  if (!isPlain(doc)) { add('SCHEMA_TYPE', '/', 'document must be a JSON object'); return finish(); }

  try { stats.bytes = options._bytes ?? Buffer.byteLength(JSON.stringify(doc), 'utf8'); } catch { add('SCHEMA_TYPE', '/', 'document is not serializable'); return finish(); }
  if (stats.bytes > LIMITS.maxBytes) { add('LIMIT_BYTES', '/', `document is ${stats.bytes} bytes; limit is ${LIMITS.maxBytes}`); return finish(); }

  // ---- top level keys
  const kindVal = doc.kind;
  checkKeys(doc, '', TOP_KEYS, TOP_REQUIRED, add);
  if (hasOwn(doc, 'schemaVersion') && doc.schemaVersion !== 1) add('SCHEMA_TYPE', '/schemaVersion', 'schemaVersion must be 1');
  if (hasOwn(doc, 'format') && doc.format !== FORMAT) add('SCHEMA_TYPE', '/format', `format must be "${FORMAT}"`);

  // ---- kind and kind-dependent fields
  let kind = null;
  if (hasOwn(doc, 'kind')) {
    if (KINDS.includes(kindVal)) kind = kindVal;
    else add('SCHEMA_TYPE', '/kind', `kind must be one of ${KINDS.join(', ')}`);
  }
  if (kind === 'background_piece' || kind === 'prop') {
    if (!hasOwn(doc, 'layerHint')) add('KIND_FIELDS', '/layerHint', `layerHint is required for ${kind}`);
    for (const k of ['textArea', 'textFill', 'tail']) if (hasOwn(doc, k)) add('KIND_FIELDS', `/${k}`, `${k} is only allowed for bubble_frame`);
    if (hasOwn(doc, 'layerHint')) {
      if (!LAYER_HINTS.includes(doc.layerHint)) add('SCHEMA_TYPE', '/layerHint', `layerHint must be one of ${LAYER_HINTS.join(', ')}`);
      else if (!LAYER_HINTS_BY_KIND[kind].includes(doc.layerHint)) add('KIND_FIELDS', '/layerHint', `layerHint ${JSON.stringify(doc.layerHint)} is not allowed for ${kind} (allowed: ${LAYER_HINTS_BY_KIND[kind].join(', ')})`);
    }
  } else if (kind === 'bubble_frame') {
    if (hasOwn(doc, 'layerHint')) add('KIND_FIELDS', '/layerHint', 'layerHint is only allowed for background_piece and prop');
    for (const k of ['textArea', 'textFill']) if (!hasOwn(doc, k)) add('KIND_FIELDS', `/${k}`, `${k} is required for bubble_frame`);
  } else if (hasOwn(doc, 'layerHint') && !LAYER_HINTS.includes(doc.layerHint)) add('SCHEMA_TYPE', '/layerHint', `layerHint must be one of ${LAYER_HINTS.join(', ')}`);
  const KL = kindLimits(kind);

  // ---- label
  if (hasOwn(doc, 'label')) {
    if (typeof doc.label !== 'string') add('SCHEMA_TYPE', '/label', 'label must be a string');
    else { const p = labelProblem(doc.label); if (p) add('LABEL_INVALID', '/label', p); }
  }

  // ---- viewBox
  let vb = null;
  if (hasOwn(doc, 'viewBox')) {
    const v = doc.viewBox;
    if (!isPlain(v)) add('SCHEMA_TYPE', '/viewBox', 'viewBox must be an object {w,h}');
    else {
      checkKeys(v, '/viewBox', ['w', 'h'], ['w', 'h'], add);
      if (hasOwn(v, 'w') && hasOwn(v, 'h')) {
        if (!Number.isInteger(v.w) || !Number.isInteger(v.h)) add('SCHEMA_TYPE', '/viewBox', 'viewBox w and h must be integers');
        else if (v.w < LIMITS.viewMin || v.w > LIMITS.viewMax || v.h < LIMITS.viewMin || v.h > LIMITS.viewMax) add('RANGE_SIZE', '/viewBox', `viewBox sides must be ${LIMITS.viewMin}..${LIMITS.viewMax}`);
        else if (Math.max(v.w, v.h) < KL.longMin || Math.max(v.w, v.h) > KL.longMax) add('RANGE_SIZE', '/viewBox', `the longer viewBox side must be ${KL.longMin}..${KL.longMax}${kind ? ` for ${kind}` : ''}`);
        else vb = { w: v.w, h: v.h };
      }
    }
  }

  // ---- anchor
  if (hasOwn(doc, 'anchor')) {
    const a = doc.anchor;
    if (!isPlain(a)) add('SCHEMA_TYPE', '/anchor', 'anchor must be an object {x,y}');
    else {
      checkKeys(a, '/anchor', ['x', 'y'], ['x', 'y'], add);
      for (const k of ['x', 'y']) {
        if (!hasOwn(a, k)) continue;
        if (!isNum(a[k])) add('SCHEMA_TYPE', `/anchor/${k}`, 'anchor values must be numbers');
        else if (a[k] < 0 || a[k] > 1 || !isDec2(a[k])) add('RANGE_COORD', `/anchor/${k}`, 'anchor values must be 0..1 with at most 2 decimals');
      }
    }
  }

  // ---- palette
  let palette = null;
  if (hasOwn(doc, 'palette')) {
    const p = doc.palette;
    if (!Array.isArray(p)) add('SCHEMA_TYPE', '/palette', 'palette must be an array');
    else if (p.length < 1 || p.length > LIMITS.paletteMax) add('PALETTE_COUNT', '/palette', `palette must have 1..${LIMITS.paletteMax} colors (got ${p.length})`);
    else {
      let good = true;
      p.forEach((c, i) => {
        if (typeof c !== 'string') { add('SCHEMA_TYPE', `/palette/${i}`, 'palette entries must be strings'); good = false; }
        else if (!/^#[0-9A-F]{6}$/.test(c)) { add('PALETTE_NOT_ALLOWED', `/palette/${i}`, `${JSON.stringify(c.slice(0, 40))} is not an uppercase #RRGGBB color`); good = false; }
        else if (!ALLOWED_HEX.has(c)) { add('PALETTE_NOT_ALLOWED', `/palette/${i}`, `${c} is not in the app palette allowlist`); good = false; }
      });
      if (good && new Set(p).size !== p.length) { add('PALETTE_COUNT', '/palette', 'palette colors must be unique'); good = false; }
      if (good) palette = p;
    }
  }

  // ---- shapes
  const okShapes = []; // { i, t, fill, stroke, bbox, ...geometry } for shapes that passed their own checks
  let pathCmdTotal = 0, polyPtTotal = 0;
  if (hasOwn(doc, 'shapes')) {
    const sh = doc.shapes;
    if (!Array.isArray(sh)) add('SCHEMA_TYPE', '/shapes', 'shapes must be an array');
    else if (sh.length < 1 || sh.length > KL.maxShapes) { stats.shapes = sh.length; add('LIMIT_SHAPES', '/shapes', `shapes must have 1..${KL.maxShapes} entries${kind ? ` for ${kind}` : ''} (got ${sh.length})`); }
    else {
      stats.shapes = sh.length;
      sh.forEach((s, i) => {
        const r = validateShape(s, i, vb, palette ? palette.length : null, add);
        if (r) { okShapes.push(r); pathCmdTotal += r.cmdCount || 0; polyPtTotal += r.ptCount || 0; }
      });
      stats.complexityScore = r2(sh.length + pathCmdTotal / 4 + polyPtTotal / 6);
      if (stats.complexityScore > KL.maxComplexity) add('COMPLEXITY', '/shapes', `complexity ${stats.complexityScore} exceeds ${KL.maxComplexity} (shapes + pathCommands/4 + polyPoints/6)`);
      if (kind === 'prop' && palette && !errors.length) { const fp = faceLikeProblem({ palette, okShapes, vb }); if (fp) add('PROP_FACE_LIKE', '/shapes', fp); }
    }
  }

  // ---- tail (bubble) and bubble rules
  if (kind === 'bubble_frame' && vb) {
    if (hasOwn(doc, 'tail')) {
      const t = doc.tail;
      if (!isPlain(t)) add('SCHEMA_TYPE', '/tail', 'tail must be an object {x,y}');
      else {
        checkKeys(t, '/tail', ['x', 'y'], ['x', 'y'], add);
        for (const [k, max] of [['x', vb.w], ['y', vb.h]]) {
          if (!hasOwn(t, k)) continue;
          if (!isNum(t[k])) add('SCHEMA_TYPE', `/tail/${k}`, 'tail values must be numbers');
          else if (t[k] < -LIMITS.bleed || t[k] > max + LIMITS.bleed || !isDec2(t[k])) add('RANGE_COORD', `/tail/${k}`, `tail must be within the ${LIMITS.bleed}-unit bleed`);
        }
      }
    }
    validateBubble(doc, vb, palette, okShapes, stats, add);
  }

  return finish();
}

function validateShape(s, i, vb, paletteLen, add) {
  const P = `/shapes/${i}`;
  if (!isPlain(s)) { add('SCHEMA_TYPE', P, 'shape must be an object'); return null; }
  if (!hasOwn(s, 't')) { add('SCHEMA_MISSING_KEY', `${P}/t`, 'missing shape type "t"'); return null; }
  if (typeof s.t !== 'string' || !SHAPE_TYPES.includes(s.t)) { add('SHAPE_TYPE', `${P}/t`, `shape type must be one of ${SHAPE_TYPES.join(', ')}`); return null; }
  const t = s.t;
  let nErr = 0;
  const sub = (code, path, msg) => { add(code, path, msg); nErr++; };
  checkKeys(s, P, SHAPE_KEYS[t].all, SHAPE_KEYS[t].req, sub);
  let bad = nErr > 0;

  // fill / stroke
  let fill = null, stroke = false;
  if (hasOwn(s, 'fill')) {
    if (s.fill === null) fill = null;
    else if (typeof s.fill !== 'number') { sub('SCHEMA_TYPE', `${P}/fill`, 'fill must be a palette index (integer) or null'); bad = true; }
    else if (!Number.isInteger(s.fill) || s.fill < 0 || (paletteLen !== null && s.fill >= paletteLen)) { sub('PALETTE_INDEX', `${P}/fill`, `fill index ${s.fill} is not a valid palette index`); bad = true; }
    else fill = s.fill;
  }
  if (hasOwn(s, 'stroke')) {
    if (typeof s.stroke !== 'boolean') { sub('SCHEMA_TYPE', `${P}/stroke`, 'stroke must be a boolean'); bad = true; }
    else stroke = s.stroke;
  }
  if (!bad && fill === null && stroke === false) { sub('SHAPE_INVISIBLE', P, 'a shape with fill null and stroke false draws nothing'); bad = true; }

  const lo = -LIMITS.bleed, hiX = vb ? vb.w + LIMITS.bleed : null, hiY = vb ? vb.h + LIMITS.bleed : null;
  const coord = (v, path, hi) => {
    if (!isNum(v)) { sub('SCHEMA_TYPE', path, 'coordinate must be a number'); return false; }
    if (!isDec2(v)) { sub('RANGE_COORD', path, 'coordinates may have at most 2 decimals'); return false; }
    const top = hi ?? LIMITS.viewMax + LIMITS.bleed;
    if (v < lo || v > top) { sub('RANGE_COORD', path, `coordinate ${v} is outside ${lo}..${top}`); return false; }
    return true;
  };
  const size = (v, path) => {
    if (!isNum(v)) { sub('SCHEMA_TYPE', path, 'size must be a number'); return false; }
    if (!(v > 0)) { sub('ZERO_AREA', path, 'sizes must be greater than 0'); return false; }
    if (!isDec2(v)) { sub('RANGE_COORD', path, 'sizes may have at most 2 decimals'); return false; }
    if (v > LIMITS.viewMax + 2 * LIMITS.bleed) { sub('RANGE_COORD', path, 'size is larger than the whole canvas'); return false; }
    return true;
  };
  if (bad) return null;

  if (t === 'rect') {
    const ok = [coord(s.x, `${P}/x`, hiX), coord(s.y, `${P}/y`, hiY), size(s.w, `${P}/w`), size(s.h, `${P}/h`)].every(Boolean);
    if (!ok) return null;
    if (s.x + s.w > hiX + 1e-9 || s.y + s.h > hiY + 1e-9) { sub('RANGE_COORD', P, 'rect extends beyond the bleed'); return null; }
    let rx = 0;
    if (hasOwn(s, 'rx')) {
      if (!isNum(s.rx)) { sub('SCHEMA_TYPE', `${P}/rx`, 'rx must be a number'); return null; }
      if (s.rx < 0 || s.rx > Math.min(s.w, s.h) / 2 + 1e-9 || !isDec2(s.rx)) { sub('RANGE_SIZE', `${P}/rx`, 'rx must be 0..min(w,h)/2 with at most 2 decimals'); return null; }
      rx = s.rx;
    }
    return { i, t, fill, stroke, x: s.x, y: s.y, w: s.w, h: s.h, rx, bbox: { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h } };
  }
  if (t === 'ellipse') {
    const ok = [coord(s.cx, `${P}/cx`, hiX), coord(s.cy, `${P}/cy`, hiY), size(s.rx, `${P}/rx`), size(s.ry, `${P}/ry`)].every(Boolean);
    if (!ok) return null;
    if (s.cx - s.rx < lo - 1e-9 || s.cx + s.rx > hiX + 1e-9 || s.cy - s.ry < lo - 1e-9 || s.cy + s.ry > hiY + 1e-9) { sub('RANGE_COORD', P, 'ellipse extends beyond the bleed'); return null; }
    return { i, t, fill, stroke, cx: s.cx, cy: s.cy, rx: s.rx, ry: s.ry, bbox: { x0: s.cx - s.rx, y0: s.cy - s.ry, x1: s.cx + s.rx, y1: s.cy + s.ry } };
  }
  if (t === 'poly') {
    if (!Array.isArray(s.pts)) { sub('SCHEMA_TYPE', `${P}/pts`, 'pts must be an array of [x,y]'); return null; }
    if (s.pts.length < LIMITS.polyMinPoints || s.pts.length > LIMITS.polyMaxPoints) { sub('LIMIT_POINTS', `${P}/pts`, `poly needs ${LIMITS.polyMinPoints}..${LIMITS.polyMaxPoints} points (got ${s.pts.length})`); return null; }
    let ok = true;
    s.pts.forEach((p, k) => {
      if (!Array.isArray(p) || p.length !== 2) { sub('SCHEMA_TYPE', `${P}/pts/${k}`, 'each point must be [x,y]'); ok = false; return; }
      if (!coord(p[0], `${P}/pts/${k}/0`, hiX)) ok = false;
      if (!coord(p[1], `${P}/pts/${k}/1`, hiY)) ok = false;
    });
    if (!ok) return null;
    let a = 0;
    for (let k = 0; k < s.pts.length; k++) { const [x1, y1] = s.pts[k], [x2, y2] = s.pts[(k + 1) % s.pts.length]; a += x1 * y2 - x2 * y1; }
    if (Math.abs(a) / 2 < 0.01) { sub('ZERO_AREA', P, 'polygon has zero area'); return null; }
    return { i, t, fill, stroke, pts: s.pts, ptCount: s.pts.length, bbox: bboxOfPoints(s.pts) };
  }
  // path
  const parsed = parsePath(s.d);
  if (parsed.error) { sub(parsed.error.code, `${P}/d`, parsed.error.message); return null; }
  const pts = pathPoints(parsed.cmds);
  let ok = true;
  pts.forEach(([x, y], k) => {
    if (!ok) return;
    if (x < lo || x > (hiX ?? LIMITS.viewMax + LIMITS.bleed) || y < lo || y > (hiY ?? LIMITS.viewMax + LIMITS.bleed)) { sub('RANGE_COORD', `${P}/d`, `path point ${k} (${x}, ${y}) is outside the bleed range`); ok = false; }
  });
  if (!ok) return null;
  const bb = bboxOfPoints(pts);
  const bw = bb.x1 - bb.x0, bh = bb.y1 - bb.y0;
  if ((fill !== null && (bw < 0.01 || bh < 0.01)) || (bw < 0.01 && bh < 0.01)) { sub('ZERO_AREA', `${P}/d`, 'path encloses no area'); return null; }
  return { i, t, fill, stroke, cmdCount: parsed.cmds.length, curved: parsed.cmds.some(c => c.c === 'Q' || c.c === 'C'), bbox: bb };
}

function validateBubble(doc, vb, palette, okShapes, stats, add) {
  let ta = null;
  if (hasOwn(doc, 'textArea')) {
    const a = doc.textArea;
    if (!isPlain(a)) { add('SCHEMA_TYPE', '/textArea', 'textArea must be an object {x,y,w,h}'); }
    else {
      const before = [];
      checkKeys(a, '/textArea', ['x', 'y', 'w', 'h'], ['x', 'y', 'w', 'h'], (c, p, m) => { before.push(c); add(c, p, m); });
      if (!before.length) {
        if (!['x', 'y', 'w', 'h'].every(k => isNum(a[k]))) add('SCHEMA_TYPE', '/textArea', 'textArea values must be numbers');
        else if (!['x', 'y', 'w', 'h'].every(k => isDec2(a[k]))) add('BUBBLE_TEXTAREA', '/textArea', 'textArea values may have at most 2 decimals');
        else if (a.w <= 0 || a.h <= 0 || a.x < 0 || a.y < 0 || a.x + a.w > vb.w + 1e-9 || a.y + a.h > vb.h + 1e-9) add('BUBBLE_TEXTAREA', '/textArea', 'textArea must lie fully inside the viewBox');
        else if (a.w < LIMITS.textAreaMinW * vb.w - 1e-9 || a.h < LIMITS.textAreaMinH * vb.h - 1e-9) add('BUBBLE_TEXTAREA', '/textArea', `textArea must be at least ${LIMITS.textAreaMinW * 100}% of the width and ${LIMITS.textAreaMinH * 100}% of the height`);
        else ta = { x0: a.x, y0: a.y, x1: a.x + a.w, y1: a.y + a.h };
      }
    }
  }
  let tf = null;
  if (hasOwn(doc, 'textFill')) {
    if (typeof doc.textFill !== 'number') add('SCHEMA_TYPE', '/textFill', 'textFill must be a palette index');
    else if (!Number.isInteger(doc.textFill) || doc.textFill < 0 || (palette && doc.textFill >= palette.length) || doc.textFill > LIMITS.paletteMax - 1) add('PALETTE_INDEX', '/textFill', `textFill ${doc.textFill} is not a valid palette index`);
    else tf = doc.textFill;
  }
  if (tf !== null && palette) {
    const ratio = contrastRatio(palette[tf], TEXT_COLOR);
    stats.contrast = Math.round(ratio * 100) / 100;
    if (ratio < LIMITS.minContrast) add('BUBBLE_CONTRAST', '/textFill', `contrast of ${palette[tf]} against text color ${TEXT_COLOR} is ${ratio.toFixed(2)}; need at least ${LIMITS.minContrast}`);
  }
  if (ta && tf !== null) {
    const { outline, offsetX, offsetY } = strokeMetrics(vb);
    const hw = outline / 2;
    const infl = { x0: ta.x0 - hw, y0: ta.y0 - hw, x1: ta.x1 + hw, y1: ta.y1 + hw };
    const shifted = { x0: infl.x0 - offsetX, y0: infl.y0 - offsetY, x1: infl.x1 - offsetX, y1: infl.y1 - offsetY };
    const coverIdx = okShapes.findIndex(s => s.t !== 'path' && s.fill === tf && shapeContainsRect(s, infl) && shapeContainsRect(s, shifted));
    if (coverIdx < 0) {
      add('BUBBLE_COVER', '/shapes', 'no rect/ellipse/poly shape with fill == textFill fully contains the textArea (plus half an outline width and the fill offset)');
    } else {
      for (let j = coverIdx + 1; j < okShapes.length; j++) {
        const s = okShapes[j];
        if (s.fill === tf && !s.stroke) continue;
        if (rectsOverlap(s.bbox, ta)) { add('BUBBLE_COVER', `/shapes/${s.i}`, 'a later shape overlaps the textArea and would be drawn over the text background'); break; }
      }
    }
  }
}

// ---------------------------------------------------------------- PROP_FACE_LIKE (crude look-alike guard)
// Heuristic, NOT a guarantee. A prop is rejected when it contains the classic "eyes + mouth" pattern:
//   - two or more small eye-like ellipses (rx and ry each <= 6% of the longer viewBox side) that are dark
//     (fill luminance <= 0.2, or at least 0.25 darker than the body fill, or fill null with an outline),
//   - lying side by side (similar cy) with centers inside one larger body shape's bounding box
//     (body side >= 3 eye diameters),
//   - plus a short curved path below them (width <= 40% of the body, height <= 20% of it, centered under the eyes).
const lumOf = h => { const [r, g, b] = hexRgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export function faceLikeProblem({ palette, okShapes, vb }) {
  const M = Math.max(vb.w, vb.h);
  const small = M * 0.06;
  const L = f => (f === null ? null : lumOf(palette[f]));
  const inside = (x, y, b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1;
  const eyes = okShapes.filter(s => s.t === 'ellipse' && s.rx <= small && s.ry <= small);
  const bodies = okShapes.filter(s => (s.t !== 'path' || s.fill !== null) && Math.max(s.bbox.x1 - s.bbox.x0, s.bbox.y1 - s.bbox.y0) > M * 0.2);
  const mouths = okShapes.filter(s => s.t === 'path' && s.curved && Math.max(s.bbox.x1 - s.bbox.x0, s.bbox.y1 - s.bbox.y0) <= M * 0.4);
  for (const body of bodies) {
    const bw = body.bbox.x1 - body.bbox.x0, bh = body.bbox.y1 - body.bbox.y0;
    const bodyLum = L(body.fill);
    const darkEyes = eyes.filter(e => e !== body && inside(e.cx, e.cy, body.bbox) && Math.max(bw, bh) >= 3 * 2 * Math.max(e.rx, e.ry)
      && (e.fill === null ? e.stroke : (L(e.fill) <= 0.2 || (bodyLum !== null && L(e.fill) <= bodyLum - 0.25))));
    for (let a = 0; a < darkEyes.length; a++) for (let b = a + 1; b < darkEyes.length; b++) {
      const e1 = darkEyes[a], e2 = darkEyes[b];
      if (Math.abs(e1.cy - e2.cy) > M * 0.06 || Math.abs(e1.cx - e2.cx) < Math.max(e1.rx, e2.rx) * 2 || Math.abs(e1.cx - e2.cx) > bw * 0.7) continue;
      const x0 = Math.min(e1.cx, e2.cx), x1 = Math.max(e1.cx, e2.cx), span = x1 - x0, eyeY = (e1.cy + e2.cy) / 2;
      for (const m of mouths) {
        if (m === body) continue;
        const mw = m.bbox.x1 - m.bbox.x0, mh = m.bbox.y1 - m.bbox.y0, mx = (m.bbox.x0 + m.bbox.x1) / 2;
        if (mw <= bw * 0.4 && mh <= bh * 0.2 && m.bbox.y0 >= eyeY && m.bbox.y1 <= body.bbox.y1 + 1e-9 && mx >= x0 - span * 0.5 && mx <= x1 + span * 0.5 && m.bbox.x0 >= body.bbox.x0 && m.bbox.x1 <= body.bbox.x1) {
          return `shapes ${e1.i}, ${e2.i} (small dark eyes) and ${m.i} (short curve below) inside shape ${body.i} look like a face; props must not look like characters or the mascot`;
        }
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------- text entry point
export function validateJsonText(text, options = {}) {
  const stats = { shapes: 0, bytes: 0, complexityScore: 0 };
  const fail = (code, message) => ({ ok: false, errors: [{ code, path: '/', message }], stats });
  if (typeof text !== 'string') return fail('SCHEMA_TYPE', 'input must be a string');
  stats.bytes = Buffer.byteLength(text, 'utf8');
  if (stats.bytes > LIMITS.maxBytes) return fail('LIMIT_BYTES', `input is ${stats.bytes} bytes; limit is ${LIMITS.maxBytes}`);
  if (text.charCodeAt(0) === 0xfeff) return fail('JSON_SYNTAX', 'a byte order mark (BOM) is not allowed');
  let doc;
  try { doc = parseStrictJson(text); } catch (e) {
    if (e instanceof JsonError) return fail(e.code, e.message);
    return fail('JSON_SYNTAX', 'could not parse JSON');
  }
  return validateGeneratedObject(doc, { ...options, _bytes: stats.bytes });
}

// ---------------------------------------------------------------- normalization (call only on valid documents)
export function normalizeGeneratedObject(doc) {
  const num = n => r2(n);
  const out = { schemaVersion: 1, format: FORMAT, kind: doc.kind };
  if (doc.kind !== 'bubble_frame') out.layerHint = doc.layerHint;
  out.label = doc.label;
  out.viewBox = { w: doc.viewBox.w, h: doc.viewBox.h };
  out.anchor = { x: num(doc.anchor.x), y: num(doc.anchor.y) };
  out.palette = [...doc.palette];
  out.shapes = doc.shapes.map(s => {
    const base = { t: s.t, fill: s.fill, stroke: s.stroke };
    if (s.t === 'rect') return { ...base, x: num(s.x), y: num(s.y), w: num(s.w), h: num(s.h), ...(hasOwn(s, 'rx') ? { rx: num(s.rx) } : {}) };
    if (s.t === 'ellipse') return { ...base, cx: num(s.cx), cy: num(s.cy), rx: num(s.rx), ry: num(s.ry) };
    if (s.t === 'poly') return { ...base, pts: s.pts.map(([x, y]) => [num(x), num(y)]) };
    return { ...base, d: serializePath(parsePath(s.d).cmds) };
  });
  if (doc.kind === 'bubble_frame') {
    out.textArea = { x: num(doc.textArea.x), y: num(doc.textArea.y), w: num(doc.textArea.w), h: num(doc.textArea.h) };
    out.textFill = doc.textFill;
    if (hasOwn(doc, 'tail')) out.tail = { x: num(doc.tail.x), y: num(doc.tail.y) };
  }
  return out;
}
