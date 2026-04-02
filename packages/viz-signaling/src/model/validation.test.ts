import { describe, expect, it } from 'vitest';
import { resolveSignalingGameConfig } from './validation';

describe('resolveSignalingGameConfig', () => {
  it('rejects seeds above the unsigned 32-bit range', () => {
    expect(() =>
      resolveSignalingGameConfig({
        seed: 4294967296,
      })
    ).toThrow('seed must be less than or equal to 4294967295.');
  });
});
