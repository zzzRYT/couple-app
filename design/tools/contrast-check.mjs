// WCAG 2.2 contrast check for design/tokens.json (no dependencies).
// usage: node design/tools/contrast-check.mjs   -> prints failures and exits 1 if any.
// Covers the core text/control pairs for every combination of room (day|night) x app (light|dark) x (normal|highContrast).
// The full per-pair matrix (including system tab bar and asset checks) is recorded in design/contrast-report.md.
import { readFileSync } from 'node:fs';
const tokens = JSON.parse(readFileSync(new URL('../tokens.json', import.meta.url), 'utf8'));
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = h => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
let fails = 0, checked = 0;
const check = (id, fg, bg, min) => { const r = ratio(fg, bg); checked++; if (r < min) { fails++; console.log(`FAIL ${id}: ${fg} on ${bg} = ${r.toFixed(2)} < ${min}`); } };
const ctlOutline = tokens.color.roomOverlayControlOutline;
for (const room of ['day', 'night']) for (const app of ['light', 'dark']) for (const mode of ['normal', 'highContrast']) {
  const A = tokens.color.app[app][mode], R = tokens.color.room[room], tag = `${room}/${app}/${mode}`;
  for (const [n, f, b] of [['text/bg', A.text, A.bg], ['text2/bg', A.text2, A.bg], ['text/surface', A.text, A.surface], ['text2/surface', A.text2, A.surface], ['text/surface2', A.text, A.surface2], ['text2/surface2', A.text2, A.surface2], ['link/bg', A.primary, A.bg], ['onPrimary/primary', A.onPrimary, A.primary], ['onDanger/danger', A.onDanger, A.danger], ['danger/bg', A.danger, A.bg], ['success/successBg', A.success, A.successBg], ['warn/warnBg', A.warn, A.warnBg], ['info/infoBg', A.info, A.infoBg]]) check(`${tag} ${n}`, f, b, 4.5);
  for (const [n, f, b] of [['line/bg', A.line, A.bg], ['line/surface', A.line, A.surface], ['border/bg', A.border, A.bg], ['focus/bg', A.focus, A.bg]]) check(`${tag} ${n}`, f, b, 3);
  // room-overlay control boundary: the room-following outline against the room surfaces
  const o = ctlOutline[room][mode === 'normal' ? 'normal' : 'highContrast'];
  for (const s of [R.wall, R.floor]) check(`${tag} toolbar outline/${s}`, o, s, 3);
  // system tab bar tints on the app-owned surface (iOS material approximated by the app surface)
  check(`${tag} tab selected tint`, A.primary, A.surface, 4.5); check(`${tag} tab unselected tint`, A.text2, A.surface, 4.5);
}
for (const w of tokens.color.widgetPresets) check(`widget ${w.id}`, w.text, w.fill, 4.5);
for (const room of ['day', 'night']) for (const s of [tokens.color.room[room].wall, tokens.color.room[room].floor]) {
  check(`illustration outline-or-rim/${room}`, ratio(tokens.color.illustration.outline, s) >= ratio(tokens.color.illustration.rim, s) ? tokens.color.illustration.outline : tokens.color.illustration.rim, s, 3);
  check(`widget outline-or-rim/${room}`, ratio(tokens.color.widgetOutline.ink, s) >= ratio(tokens.color.widgetOutline.rim, s) ? tokens.color.widgetOutline.ink : tokens.color.widgetOutline.rim, s, 3);
}
console.log(`${checked} pairs checked, ${fails} failures`);
process.exit(fails ? 1 : 0);
