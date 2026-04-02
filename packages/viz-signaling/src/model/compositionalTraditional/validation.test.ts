import { describe, expect, it } from 'vitest';
import { resolveCompositionalTraditionalConfig } from './validation';

describe('resolveCompositionalTraditionalConfig', () => {
  it('rejects seeds above the unsigned 32-bit range', () => {
    expect(() =>
      resolveCompositionalTraditionalConfig({ seed: 4294967296 })
    ).toThrow(/4294967295/);
  });
});
