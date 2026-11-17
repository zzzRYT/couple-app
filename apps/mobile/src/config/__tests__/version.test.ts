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
  expect(appVersionLabel()).toBe('1.0.0 (12) · Embedded');
});

it('shows the compact OTA bundle id and channel', () => {
  expect(appVersionLabel('01a1e894-3352-74e1-b1c8-2ad7f5b0ac08', 'production', '00000000-0000-0000-0000-000000000000'))
    .toBe('1.0.0 (12) · OTA 01a1e894 · production');
});

it('labels the built-in bundle without a fabricated bundle id', () => {
  expect(appVersionLabel('builtin-id', 'preview', 'builtin-id')).toBe('1.0.0 (12) · Embedded');
});
