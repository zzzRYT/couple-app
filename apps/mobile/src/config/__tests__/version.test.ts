jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0' }));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: 'fallback-version' } },
}));

import { appVersionLabel } from '../version';

it('V0-F12-AC-09 displays the marketing version on the bundle the build shipped with', () => {
  expect(appVersionLabel()).toBe('1.0.0');
});

it('shows the OTA release number instead of a bundle id', () => {
  expect(appVersionLabel('1.0.1 (2)')).toBe('1.0.1 (2)');
});
