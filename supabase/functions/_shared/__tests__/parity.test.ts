import { assertEquals } from 'jsr:@std/assert@1';
import { validateScene } from '../sceneValidate.ts';
Deno.test('matches shared scene fixtures', async () => {
  const fixtures = JSON.parse(await Deno.readTextFile(new URL('../../../../packages/scene-contract/fixtures/parity/scenes.json', import.meta.url)));
  for (const fixture of fixtures) assertEquals(validateScene(fixture.scene, new Set(['app_mascot'])), fixture.expected);
});
