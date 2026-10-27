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
