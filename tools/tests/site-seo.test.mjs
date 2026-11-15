import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../site');
const read = (name) => readFile(path.join(root, name), 'utf8');
const publicPages = ['', 'support', 'privacy', 'delete-account'];
const locales = ['', 'en', 'ja'];
const pagePath = (locale, page) => [locale, page, 'index.html'].filter(Boolean).join('/');

test('public pages have unique descriptions, canonical URLs, language alternates and share cards', async () => {
  for (const page of publicPages) {
    const descriptions = new Set();
    for (const locale of locales) {
      const html = await read(pagePath(locale, page));
      assert.match(html, /<title>[^<]+<\/title>/);
      const description = html.match(/<meta name="description" content="([^"]+)"/);
      assert.ok(description, `${locale}/${page} description`);
      descriptions.add(description[1]);
      assert.match(html, /<link rel="canonical" href="https:\/\/aroom\.jinjinstar\.com/);
      for (const code of ['ko', 'en', 'ja', 'x-default']) assert.match(html, new RegExp(`hreflang="${code}"`));
      for (const key of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale']) assert.match(html, new RegExp(`property="${key}"`));
      assert.match(html, /property="og:image" content="https:\/\/aroom\.jinjinstar\.com\/og-aroom\.png"/);
      assert.match(html, /name="twitter:card" content="summary_large_image"/);
      assert.match(html, /name="robots" content="(?:index|noindex),follow"/);
    }
    assert.equal(descriptions.size, locales.length, `${page} descriptions must differ by language`);
  }
  assert.deepEqual(await stat(path.join(root, 'og-aroom.png')).then(async () => {
    const sharp = (await import('sharp')).default;
    const { width, height } = await sharp(path.join(root, 'og-aroom.png')).metadata();
    return [width, height];
  }), [1200, 630]);
});

test('home page FAQ has five visible answers matching FAQPage JSON-LD in all languages', async () => {
  for (const locale of locales) {
    const html = await read(pagePath(locale, ''));
    const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    assert.ok(match, `${locale} FAQ schema`);
    const schema = JSON.parse(match[1].replaceAll('\\u005B', '[').replaceAll('\\u005D', ']'));
    assert.equal(schema['@type'], 'FAQPage');
    assert.equal(schema.mainEntity.length, 5);
    for (const { name, acceptedAnswer } of schema.mainEntity) {
      assert.ok(html.includes(name));
      assert.ok(html.includes(acceptedAnswer.text));
    }
  }
});

test('robots and sitemap expose the intended public pages and locale alternates', async () => {
  const robots = await read('robots.txt');
  assert.match(robots, /^User-agent: \*/m);
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Disallow: \/i\//);
  assert.match(robots, /Disallow: \/delete-account\//);
  assert.match(robots, /Sitemap: https:\/\/aroom\.jinjinstar\.com\/sitemap\.xml/);
  const sitemap = await read('sitemap.xml');
  for (const url of ['/', '/support/', '/privacy/', '/en/', '/ja/']) assert.ok(sitemap.includes(`https://aroom.jinjinstar.com${url}`));
  assert.doesNotMatch(sitemap, /delete-account|\/i\//);
  for (const locale of ['ko', 'en', 'ja', 'x-default']) assert.ok(sitemap.includes(`hreflang="${locale}"`));
});

test('association file covers production invite links and Pages serves it as JSON', async () => {
  const association = JSON.parse(await read('.well-known/apple-app-site-association'));
  assert.ok(association.applinks.details.some((entry) => entry.appID === '43ZASDF2J7.com.jinjinstar.aroom' && entry.paths.includes('/i/*')));
  assert.match(await read('_headers'), /\/\.well-known\/apple-app-site-association\n  Content-Type: application\/json/);
  assert.match(await read('_redirects'), /\/i\/\* \/i\/index\.html 200/);
  const invite = await read('i/invite.js');
  assert.match(invite, /aroom:\/\/invite\/\$\{code\}/);
  assert.match(invite, /apps\.apple\.com\/app\/id6831581664/);
});
