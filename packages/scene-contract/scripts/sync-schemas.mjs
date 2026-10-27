import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const source = resolve(root, 'specs/001-couple-prompt-todo/contracts');
const target = resolve(root, 'packages/scene-contract/schemas');
await mkdir(target, { recursive: true });
for (const name of (await readdir(source)).filter((x) => x.endsWith('.schema.json'))) {
  await copyFile(resolve(source, name), resolve(target, name));
}
