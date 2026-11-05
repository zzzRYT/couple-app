const fs = require('fs');
const path = require('path');
const plist = require(require.resolve('@expo/plist', { paths: [require.resolve('expo-widgets/package.json')] })).default;
const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const TARGET = 'ExpoWidgetsTarget';
const ROOT = path.join(__dirname, '..');
/** Font files are shared with the app; an extension cannot read the app bundle, so it gets its own copy. */
const FONTS = ['Gaegu_700Bold', 'GowunDodum_400Regular', 'NotoSansJP_400Regular', 'NotoSansKR_400Regular', 'NotoSansKR_700Bold', 'Yomogi_400Regular', 'ZenMaruGothic_700Bold'].map((name) => `${name}.ttf`);
const LANGUAGES = { en: 'en-US', ja: 'ja-JP', ko: 'ko-KR' };
const GALLERY_KEYS = ['widget.gallery.dday.name', 'widget.gallery.dday.desc', 'widget.gallery.list.name', 'widget.gallery.list.desc'];
const TEMPLATE_ICON = (file) => ({ images: [{ filename: file, idiom: 'universal' }], info: { author: 'xcode', version: 1 }, properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'template' } });
const ORIGINAL_ICON = (file) => ({ images: [{ filename: file, idiom: 'universal' }], info: { author: 'xcode', version: 1 }, properties: { 'preserves-vector-representation': true } });
const MASCOT = { images: [{ idiom: 'universal', scale: '2x', filename: 'mascot_wave@2x.png' }, { idiom: 'universal', scale: '3x', filename: 'mascot_wave@3x.png' }], info: { author: 'xcode', version: 1 } };

/** The gallery strings of one language, read from the overlay so the copy has one source. */
function galleryStrings(locale) {
  const overlay = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/v0', `${locale}.json`), 'utf8'));
  return Object.fromEntries(GALLERY_KEYS.map((key) => [key, overlay[key]]));
}
function writeImageSet(catalog, name, contents, files) {
  const dir = path.join(catalog, `${name}.imageset`);
  fs.mkdirSync(dir, { recursive: true });
  for (const file of files) fs.copyFileSync(file, path.join(dir, path.basename(file)));
  fs.writeFileSync(path.join(dir, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);
}
function writeResources(platformRoot) {
  const target = path.join(platformRoot, TARGET);
  for (const font of FONTS) fs.copyFileSync(path.join(ROOT, 'assets/fonts', font), path.join(target, font));
  const catalog = path.join(target, 'Assets.xcassets');
  const widgets = path.join(ROOT, 'assets/widgets');
  fs.rmSync(catalog, { recursive: true, force: true });
  fs.mkdirSync(catalog, { recursive: true });
  fs.writeFileSync(path.join(catalog, 'Contents.json'), `${JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2)}\n`);
  for (const file of fs.readdirSync(path.join(widgets, 'icons'))) writeImageSet(catalog, path.basename(file, '.svg'), TEMPLATE_ICON(file), [path.join(widgets, 'icons', file)]);
  writeImageSet(catalog, 'sparkle_art', ORIGINAL_ICON('sparkle_art.svg'), [path.join(widgets, 'sparkle_art.svg')]);
  writeImageSet(catalog, 'mascot_wave', MASCOT, ['mascot_wave@2x.png', 'mascot_wave@3x.png'].map((file) => path.join(widgets, file)));
  const infoPath = path.join(target, 'Info.plist');
  const info = plist.parse(fs.readFileSync(infoPath, 'utf8'));
  fs.writeFileSync(infoPath, plist.build({ ...info, UIAppFonts: FONTS }));
}
function addToTarget(project) {
  const targetUuid = project.findTargetKey(TARGET);
  const group = project.findPBXGroupKey({ name: TARGET });
  for (const file of [...FONTS, 'Assets.xcassets']) project.addResourceFile(file, { target: targetUuid }, group);
}
/** Puts everything the layouts refer to by name into the extension: fonts, images and localized gallery strings. */
function withWidgetResources(config) {
  config.locales = Object.fromEntries(Object.entries(LANGUAGES).map(([language, locale]) => [language, { ios: { 'Localizable.strings': galleryStrings(locale) } }]));
  const withFiles = withDangerousMod(config, ['ios', (next) => { writeResources(next.modRequest.platformProjectRoot); return next; }]);
  return withXcodeProject(withFiles, (next) => { addToTarget(next.modResults); return next; });
}

module.exports = withWidgetResources;
module.exports.galleryStrings = galleryStrings;
module.exports.GALLERY_KEYS = GALLERY_KEYS;
module.exports.LANGUAGES = LANGUAGES;
