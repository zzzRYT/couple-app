import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

it('keeps the placeholder bundle identifier in identity.ts only', () => {
  const root = join(__dirname, '../../..');
  const identifier = ['com', 'jinjinstar', 'mopiru'].join('.');
  const matches: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.expo'].includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.[jt]sx?$/.test(entry.name) && readFileSync(path, 'utf8').includes(identifier)) matches.push(relative(root, path));
    }
  }
  walk(root);
  expect(matches).toEqual(['src/config/identity.ts']);
});
