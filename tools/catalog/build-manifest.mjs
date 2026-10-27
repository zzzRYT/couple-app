import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import sharp from 'sharp';
const rows = parse(await readFile('design/assets-manifest.csv', 'utf8'), { columns: true, skip_empty_lines: true, relax_column_count: true });
const mascotIds = new Set(['mascot_wave_main', 'mascot_cheer', 'mascot_lookup', 'mascot_walk', 'mascot_lie', 'mascot_sleep']);
const selected = rows.filter((r) => (r.kind === 'obj' && r.variant !== 'night') || (mascotIds.has(r.asset_id) && r.variant === 'harmonized@2x'));
if (selected.length !== 24) throw new Error(`Expected 24 entries, got ${selected.length}`);
const entries = [];
for (const r of selected) {
  const file = `assets/catalog/images/${r.asset_id}@2x.png`;
  const data = await readFile(file);
  const meta = await sharp(data).metadata();
  const entry = { asset_id: r.asset_id, catalog_version: 1, asset_kind: r.kind === 'obj' ? 'room_object' : 'mascot_pose', uri: file, format: 'png', width_px: meta.width, height_px: meta.height, byte_size: data.length, sha256: createHash('sha256').update(data).digest('hex'), license_kind: r.license || 'placeholder', rights_record_ref: r.kind === 'obj' ? 'placeholder-sketch-not-final' : 'ai-generated-master-used-as-is-risk-accepted', status: 'active' };
  if (r.asset_id === 'obj_decor_lamp') {
    const path = 'assets/catalog/images/obj_decor_lamp__night@2x.png';
    const night = await readFile(path);
    entry.night_variant = { uri: path, sha256: createHash('sha256').update(night).digest('hex') };
  }
  entries.push(entry);
}
await writeFile('assets/catalog/manifest.json', JSON.stringify(entries, null, 2) + '\n');

// Metro resolves density variants itself, so the bundle requires the base name (x.png picks x@2x.png).
const bundlePath = (uri) => '../../../../' + uri.replace('@2x.png', '.png');
const mapLines = entries.flatMap((entry) => [
  `  ${JSON.stringify(entry.asset_id)}: require(${JSON.stringify(bundlePath(entry.uri))}),`,
  ...(entry.night_variant ? [`  ${JSON.stringify(entry.asset_id + '__night')}: require(${JSON.stringify(bundlePath(entry.night_variant.uri))}),`] : []),
]);
await writeFile('apps/mobile/src/scene/catalogImages.ts', `// Static requires allow Metro to bundle the catalog images.\nexport const catalogImages: Record<string, number> = {\n${mapLines.join('\n')}\n};\n`);
