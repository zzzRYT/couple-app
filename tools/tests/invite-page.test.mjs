import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const script = readFileSync(new URL('../../site/i/invite.js', import.meta.url), 'utf8');
function page(pathname) {
  const elements = Object.fromEntries(['title', 'instructions', 'code', 'copy', 'soon', 'status', 'open', 'ios', 'android', 'ios-soon', 'android-soon'].map((id) => [id, { hidden: true, addEventListener() {} }]));
  runInNewContext(script, { navigator: { language: 'en' }, location: { pathname }, document: { documentElement: {}, getElementById: (id) => elements[id] } });
  return elements;
}
test('valid invite offers its payload to the installed app and the verified store', () => {
  const el = page('/i/ab12-cd34');
  assert.equal(el.open.href, 'aroom://invite/AB12-CD34');
  assert.equal(el.open.hidden, false);
  assert.equal(el.ios.href, 'https://apps.apple.com/app/id6831581664');
  assert.equal(el.android.hidden, true);
});
test('invalid invite offers neither a code nor an app link', () => {
  const el = page('/i/invalid');
  assert.equal(el.copy.disabled, true);
  assert.equal(el.open.hidden, true);
});
