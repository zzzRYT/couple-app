import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import eas from '../../../eas.json';

const easConfig = eas as unknown as {
  build: Record<string, { distribution?: string; env?: { APP_VARIANT?: string } }>;
  submit?: Record<string, unknown>;
};

it('keeps the placeholder bundle identifier in identity.ts only', () => {
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

it('V0-F14-AC-06 never stores a production variant in a store-signed profile', () => {
  const storeProfiles = Object.entries(easConfig.build).filter(([, profile]) => profile.distribution === 'store');
  for (const [name, profile] of storeProfiles) {
    expect(profile.env?.APP_VARIANT).not.toBe('production');
    expect(easConfig.submit?.[name]).toBeDefined();
  }
});
