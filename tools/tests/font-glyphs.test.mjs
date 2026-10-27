import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { openSync } from 'fontkit';
for (const [font, sample] of [
  ['Inter_400Regular.ttf', 'Together 123'],
  ['NotoSansKR_400Regular.ttf', '함께한 지 123일'],
  ['NotoSansKR_700Bold.ttf', '함께한 지 123일'],
  ['NotoSansJP_400Regular.ttf', '一緒に過ごして 123日'],
  ['NotoSansJP_700Bold.ttf', '一緒に過ごして 123日'],
]) {
  test(`${font} contains the locale fixture glyphs`, () => {
    const face = openSync(`apps/mobile/assets/fonts/${font}`);
    for (const character of sample) assert.ok(face.hasGlyphForCodePoint(character.codePointAt(0)), `${font}: ${character}`);
  });
}
