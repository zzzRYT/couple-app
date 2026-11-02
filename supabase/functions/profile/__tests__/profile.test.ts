import { assertEquals } from 'jsr:@std/assert@1';
import { call, localDeps, makeUser } from '../../_shared/__tests__/local.ts';
import { profileHandler } from '../index.ts';

Deno.test('reads defaults, saves allowed values and rejects others', async () => {
  const h = profileHandler(await localDeps());
  const a = await makeUser('pf');
  assertEquals((await call(h, a, 'GET', '/profile/profile/preferences')).body, { locale: null, uiTheme: 'system' });
  assertEquals((await call(h, a, 'PATCH', '/profile/profile/preferences', { locale: 'ja-JP', uiTheme: 'dark' })).body, { locale: 'ja-JP', uiTheme: 'dark' });
  assertEquals((await call(h, a, 'PATCH', '/profile/profile/preferences', { locale: null, uiTheme: 'system' })).body, { locale: null, uiTheme: 'system' });
  assertEquals((await call(h, a, 'PATCH', '/profile/profile/preferences', { locale: 'fr-FR', uiTheme: 'system' })).status, 400);
  assertEquals((await call(h, a, 'PATCH', '/profile/profile/preferences', { locale: 'ko-KR', uiTheme: 'sepia' })).status, 400);
});

Deno.test('V0-F02-AC-03 validates member profile', async () => {
  const h = profileHandler(await localDeps());
  const a = await makeUser('v0pf');
  assertEquals((await call(h, a, 'PUT', '/profile/profile/member', { displayName: ' 하루 ', birthday: { month: 2, day: 29, year: null } })).body, { displayName: '하루', birthday: { month: 2, day: 29, year: null } });
  assertEquals((await call(h, a, 'PUT', '/profile/profile/member', { displayName: '', birthday: null })).status, 400);
  assertEquals((await call(h, a, 'PUT', '/profile/profile/member', { displayName: '하루', birthday: { month: 2, day: 30 } })).status, 400);
});
