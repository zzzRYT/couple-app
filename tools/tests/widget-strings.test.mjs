import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { GALLERY_KEYS, LANGUAGES, galleryStrings } = require('../../apps/mobile/plugins/withWidgetResources.js');
const overlay = async (locale) => JSON.parse(await readFile(new URL(`../../apps/mobile/src/i18n/locales/v0/${locale}.json`, import.meta.url), 'utf8'));

for (const [language, locale] of Object.entries(LANGUAGES)) {
  test(`V0-F11-AC-02 ${language} gallery strings are the overlay's`, async () => {
    const copy = await overlay(locale);
    assert.deepEqual(Object.keys(galleryStrings(locale)), GALLERY_KEYS);
    for (const key of GALLERY_KEYS) {
      assert.ok(copy[key], key);
      assert.equal(galleryStrings(locale)[key], copy[key]);
    }
  });
}

test('V0-F11-AC-02 Korean gallery strings match the board', () => {
  assert.deepEqual(galleryStrings('ko-KR'), {
    'widget.gallery.dday.name': 'D+Day',
    'widget.gallery.dday.desc': '함께한 날과 다음 기념일을 보여 줘요.',
    'widget.gallery.list.name': '다가오는 기념일',
    'widget.gallery.list.desc': '다가오는 기념일을 날짜순으로 보여 줘요.',
  });
});

test('V0-F11-AC-02 the app config names only keys that have strings', async () => {
  const prior = process.env.IOS_WIDGETS;
  process.env.IOS_WIDGETS = 'true';
  try {
    const { default: config } = await import('../../apps/mobile/app.config.ts?v=gallery');
    const [, options] = config.expo.plugins.find((plugin) => plugin[0] === 'expo-widgets');
    assert.deepEqual(options.widgets.flatMap((widget) => [widget.displayName, widget.description]), GALLERY_KEYS);
    assert.deepEqual(options.widgets[1].ios.supportedFamilies, ['systemMedium', 'systemLarge']);
  } finally {
    if (prior === undefined) delete process.env.IOS_WIDGETS;
    else process.env.IOS_WIDGETS = prior;
  }
});
