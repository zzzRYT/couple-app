// Tab bar glyphs for the iOS system tab bar (ND04). Shapes are copied from the V0 boards' tab bar
// (design/canvas/project/V0-02-home.dc.html); the selected glyph uses the board's heavier 2.2 stroke.
// Rendered black on transparent and used as template images, so the tab bar tints them.
// Run: node tools/icons/build-tab-icons.mjs
import { mkdir } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { URL, fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = fileURLToPath(new URL('../../apps/mobile/assets/tabs/', import.meta.url));
const glyphs = {
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  anniversaries: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M12 18s-3-1.9-3-3.8a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.9-3 3.8-3 3.8z"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.6 5.6l1.9 1.9M17.5 16.5l1.9 1.9M2.8 12h2.6M18.6 12h2.6M4.6 18.4l1.9-1.9M17.5 7.5l1.9-1.9"/>',
};
const variants = { '': 2, '-selected': 2.2 };
const POINTS = 25;

await mkdir(out, { recursive: true });
for (const [name, shape] of Object.entries(glyphs)) {
  for (const [suffix, stroke] of Object.entries(variants)) {
    for (const scale of [1, 2, 3]) {
      const px = POINTS * scale;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`;
      await sharp(Buffer.from(svg)).png().toFile(`${out}${name}${suffix}${scale === 1 ? '' : `@${scale}x`}.png`);
    }
  }
}
