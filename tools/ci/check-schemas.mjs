import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('specs/001-couple-prompt-todo/contracts');
const destination = resolve('packages/scene-contract/schemas');
for (const name of (await readdir(source)).filter((name) => name.endsWith('.schema.json'))) {
  const [expected, actual] = await Promise.all([readFile(resolve(source, name)), readFile(resolve(destination, name))]);
  if (!expected.equals(actual)) throw new Error(`Schema differs: ${name}`);
}
