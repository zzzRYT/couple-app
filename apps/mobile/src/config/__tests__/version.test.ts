jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '12',
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: 'fallback-version' } },
}));

import { appVersionLabel } from '../version';

it('V0-F12-AC-09 displays the marketing version and native build number', () => {
  expect(appVersionLabel()).toBe('1.0.0 (12)');
});
