import { expect, it } from 'vitest';
import { defaultMascotPlacement, ensureSingleMascot, rejectMascotAppearance } from '../src/mascot';

it('uses one fixed mascot and rejects appearance state', () => {
  const mascot = defaultMascotPlacement();
  expect(ensureSingleMascot([mascot])).toBe(true);
  expect(ensureSingleMascot([mascot, mascot])).toBe(false);
  expect(ensureSingleMascot([])).toBe(false);
  expect(rejectMascotAppearance(mascot)).toBe(false);
  expect(rejectMascotAppearance({ ...mascot, pose: 'sleep' })).toBe(true);
});
