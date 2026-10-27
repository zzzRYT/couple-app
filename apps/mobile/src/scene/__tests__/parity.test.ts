import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateScene } from '../../../../../packages/scene-contract/src/validate';
it('matches shared scene fixtures', () => {
  const fixtures = JSON.parse(readFileSync(resolve(__dirname, '../../../../../packages/scene-contract/fixtures/parity/scenes.json'), 'utf8'));
  for (const fixture of fixtures) expect(validateScene(fixture.scene, new Set(['app_mascot']))).toEqual(fixture.expected);
});
