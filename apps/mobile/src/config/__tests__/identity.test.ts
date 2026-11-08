import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import eas from '../../../eas.json';

const easConfig = eas as unknown as {
  build: Record<string, { distribution?: string; env?: { APP_VARIANT?: string } }>;
  submit?: Record<string, unknown>;
};

it('keeps the bundle identifier in identity.ts only', () => {
  const root = join(__dirname, '../../..');
  const identifier = ['com', 'jinjinstar', 'aroom'].join('.');
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

it('V0-F14-AC-06 keeps the production variant on the production profile only', () => {
  const profiles = Object.entries(easConfig.build);
  expect(profiles.filter(([, profile]) => profile.env?.APP_VARIANT === 'production').map(([name]) => name)).toEqual(['production']);
  for (const [name] of profiles.filter(([, profile]) => profile.distribution === 'store')) expect(easConfig.submit?.[name]).toBeDefined();
  expect(Object.keys(easConfig.submit ?? {}).sort()).toEqual(['production', 'testflight']);
});
