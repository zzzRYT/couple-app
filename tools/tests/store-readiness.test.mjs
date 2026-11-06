import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const LANGUAGES = ['ko', 'en', 'ja'];
const PAGES = ['', 'privacy/', 'support/', 'delete-account/'];
const sitePath = (language, page) => `site/${language === 'ko' ? '' : `${language}/`}${page}index.html`;
const bytes = (text) => Buffer.byteLength(text, 'utf8');
const field = async (language, name) => (await read(`docs/app-store/metadata/${language}/${name}.txt`)).trimEnd();

// Words for hidden V1 features. V0 pages must not promise them, and the privacy page says there is no AI.
const STALE = /방을 꾸|프롬프트|생성 장식|커버 사진|make a room|prompt|generated decoration|cover photo|部屋|プロンプト|生成した飾り|カバー写真/;

for (const language of LANGUAGES) {
  for (const page of PAGES) {
    test(`${language} /${page} describes V0 only`, async () => {
      assert.doesNotMatch((await read(sitePath(language, page))).replace(/<head>.*?<\/head>/s, ''), STALE);
    });
  }

  test(`${language} store metadata fits App Store Connect`, async () => {
    const name = await field(language, 'name');
    const keywords = await field(language, 'keywords');
    assert.ok([...name].length >= 2 && [...name].length <= 30);
    assert.ok([...await field(language, 'subtitle')].length <= 30);
    assert.ok([...await field(language, 'promotional_text')].length <= 170);
    assert.ok([...await field(language, 'description')].length <= 4000);
    assert.ok(bytes(keywords) <= 100);
    assert.ok(!keywords.split(',').includes(name));
    assert.ok(keywords.split(',').every((word) => word.length >= 2));
    const prefix = language === 'ko' ? '' : `/${language}`;
    assert.equal(await field(language, 'support_url'), `https://aroom.jinjinstar.com${prefix}/support/`);
    assert.equal(await field(language, 'privacy_url'), `https://aroom.jinjinstar.com${prefix}/privacy/`);
  });
}

test('every metadata language has the same fields', async () => {
  const [first, ...rest] = await Promise.all(LANGUAGES.map(async (language) => (await readdir(new URL(`docs/app-store/metadata/${language}/`, root))).sort()));
  for (const files of rest) assert.deepEqual(files, first);
});

test('review notes fit and name the invite placeholders', async () => {
  const notes = await read('docs/app-store/review-notes.txt');
  assert.ok(bytes(notes) <= 4000);
  for (const placeholder of ['{{INVITE_CODE}}', '{{INVITE_EXPIRES}}', '{{REVIEW_CONTACT}}']) assert.ok(notes.includes(placeholder), placeholder);
});

test('the site and the app carry the same support email', async () => {
  const site = (await read('site/contact.js')).match(/supportEmail = '([^']*)'/)?.[1];
  const app = (await read('apps/mobile/src/config/identity.ts')).match(/supportEmail: (?:'([^']*)'|null)/);
  assert.notEqual(site, undefined);
  assert.ok(app);
  assert.equal(site, app[1] ?? '');
});
