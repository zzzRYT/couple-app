import { readdir, mkdir, copyFile } from 'node:fs/promises';
import sharp from 'sharp';
await mkdir('assets/catalog/images', { recursive: true });
for (const name of (await readdir('design/assets-sketch')).filter((name) => /^obj_.*\.svg$/.test(name))) {
  await sharp(`design/assets-sketch/${name}`).resize(256, 256).png({ palette: true, colours: 256 }).toFile(`assets/catalog/images/${name.replace('.svg', '@2x.png')}`);
}
for (const name of ['wave_main', 'cheer', 'lookup', 'walk', 'lie', 'sleep']) {
  await copyFile(`design/mascot/harmonized/mascot_${name}@2x.png`, `assets/catalog/images/mascot_${name}@2x.png`);
}
