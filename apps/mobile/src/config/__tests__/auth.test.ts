import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveAuthOptions } from '../auth';

it('never enables the email test login outside development builds', () => {
  for (const variant of ['production', 'preview', undefined]) {
    expect(resolveAuthOptions({ platform: 'ios', variant, devEmailFlag: 'true' }).devEmail).toBe(false);
  }
  expect(resolveAuthOptions({ platform: 'ios', variant: 'development', devEmailFlag: undefined }).devEmail).toBe(false);
  expect(resolveAuthOptions({ platform: 'ios', variant: 'development', devEmailFlag: 'true' }).devEmail).toBe(true);
});
it('uses native Apple on iOS only and keeps Kakao off', () => {
  expect(resolveAuthOptions({ platform: 'ios', variant: 'production', devEmailFlag: undefined })).toEqual({ apple: 'native', kakao: false, devEmail: false });
  expect(resolveAuthOptions({ platform: 'android', variant: 'production', devEmailFlag: undefined }).apple).toBeNull();
});
it('turns the email login on only in the development EAS profile', () => {
  const eas = JSON.parse(readFileSync(join(__dirname, '../../../eas.json'), 'utf8'));
  expect(eas.build.development.env.EXPO_PUBLIC_DEV_EMAIL_LOGIN).toBe('true');
  expect(eas.build.preview.env.EXPO_PUBLIC_DEV_EMAIL_LOGIN).toBeUndefined();
  expect(eas.build.production.env.EXPO_PUBLIC_DEV_EMAIL_LOGIN).toBeUndefined();
  expect(eas.build.production.env.APP_VARIANT).toBe('production');
  expect(eas.submit).toBeUndefined();
});
