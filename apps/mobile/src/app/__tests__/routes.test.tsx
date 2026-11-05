import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
it('defines the expected auth, onboarding and three tab routes', () => {
  const app = resolve(__dirname, '..');
  expect(readdirSync(resolve(app, '(auth)'))).toEqual(expect.arrayContaining(['index.tsx', 'login.tsx']));
  expect(readdirSync(resolve(app, '(onboarding)'))).toEqual(expect.arrayContaining(['index.tsx', 'choose-space.tsx', 'create-space.tsx', 'join.tsx']));
  expect(readdirSync(app)).toContain('invite.tsx');
  expect(readdirSync(resolve(app, '(tabs)')).filter((name) => !name.startsWith('_')).sort()).toEqual(['anniversaries', 'home.tsx', 'index.tsx', 'room.tsx', 'settings']);
});
it('keeps the end-space, report and ended-notice screens outside the tab group so the tab bar is hidden', () => {
  const app = resolve(__dirname, '..');
  expect(readdirSync(resolve(app, 'settings')).sort()).toEqual(['appearance.tsx', 'delete-account.tsx', 'disconnect.tsx', 'end-space.tsx', 'language.tsx', 'me.tsx', 'notifications.tsx', 'report.tsx', 'start-date.tsx']);
  expect(readdirSync(app)).toContain('ended.tsx');
  expect(readdirSync(resolve(app, '(tabs)/settings'))).toEqual(['index.tsx']);
});

it('V0-F03-AC-05 registers the three V0 tab triggers in order', () => {
  const layout = readFileSync(resolve(__dirname, '../(tabs)/_layout.tsx'), 'utf8');
  const names = [...layout.matchAll(/<NativeTabs\.Trigger name="([^"]+)"/g)].map((match) => match[1]);
  expect(names).toEqual(['home', 'anniversaries/index', 'settings/index']);
});
