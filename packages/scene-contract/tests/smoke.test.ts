import { describe, expect, it } from 'vitest';
import { SCENE_CONTRACT_VERSION } from '../src/index';

describe('scene contract', () => {
  it('exports its contract version', () => {
    expect(SCENE_CONTRACT_VERSION).toBe(1);
  });
});
