import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
it('defines the expected auth, onboarding and three tab routes', () => {
  const app = resolve(__dirname, '..');
  expect(readdirSync(resolve(app, '(auth)'))).toEqual(expect.arrayContaining(['welcome.tsx', 'login.tsx']));
  expect(readdirSync(resolve(app, '(onboarding)'))).toEqual(expect.arrayContaining(['choose-space.tsx', 'create-space.tsx', 'invite.tsx', 'join.tsx']));
  expect(readdirSync(resolve(app, '(tabs)')).filter((name) => !name.startsWith('_')).sort()).toEqual(['home.tsx', 'room.tsx', 'settings']);
});
it('keeps the end-space, report and ended-notice screens outside the tab group so the tab bar is hidden', () => {
  const app = resolve(__dirname, '..');
  expect(readdirSync(resolve(app, 'settings')).sort()).toEqual(['end-space.tsx', 'report.tsx']);
  expect(readdirSync(app)).toContain('ended.tsx');
  expect(readdirSync(resolve(app, '(tabs)/settings'))).toEqual(['index.tsx']);
});
