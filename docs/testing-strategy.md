# Testing Strategy

This document defines the testing approach for all visualizers.

---

## Testing Principles

1. **Test models thoroughly** - Mathematical correctness is critical
2. **Reproducibility via seeds** - Same seed = same results
3. **Sanity checks over exact values** - Stochastic systems need appropriate tests
4. **Test behaviors, not implementations** - Focus on what matters to users
5. **Visual review for views** - Some things need human eyes

---

## Test Categories

### 1. Unit Tests (Model Logic)

Test pure mathematical functions in isolation.

**Coverage:**
- Parameter validation
- Initial state generation
- Single-step transitions
- Metric calculations
- Edge cases and boundary conditions

**Example:**
```typescript
describe('BayesianNetwork', () => {
  it('should correctly propagate beliefs downward', () => {
    const network = createNetwork(testConfig);
    const result = network.propagate();
    expect(result.childProbability).toBeCloseTo(0.558, 3);
  });

  it('should throw on invalid probability', () => {
    expect(() => createNetwork({ prior: 1.5 })).toThrow();
  });
});
```

### 2. Property-Based Tests

Test invariants that should hold across many inputs.

**Properties to test:**
- Probabilities sum to 1
- Entropy is non-negative
- Conservation laws hold
- Symmetries are preserved

**Example:**
```typescript
import { fc } from 'fast-check';

describe('Probability properties', () => {
  it('probabilities always sum to 1', () => {
    fc.assert(
      fc.property(fc.array(fc.float({ min: 0.01, max: 0.99 }), { minLength: 2, maxLength: 10 }), (weights) => {
        const probs = normalize(weights);
        expect(sum(probs)).toBeCloseTo(1, 10);
      })
    );
  });
});
```

### 3. Determinism Tests

Verify that seeded simulations are reproducible.

**Test pattern:**
```typescript
describe('Reproducibility', () => {
  it('same seed produces same trajectory', () => {
    const sim1 = createSimulation({ seed: 12345 });
    const sim2 = createSimulation({ seed: 12345 });

    for (let i = 0; i < 100; i++) {
      sim1.step();
      sim2.step();
      expect(sim1.state).toEqual(sim2.state);
    }
  });
});
```

### 4. Integration Tests

Test full visualizer flow from parameters to outputs.

**Coverage:**
- Parameter → simulation initialization
- Step sequences produce expected state changes
- Reset returns to initial state
- Presets load correctly

### 5. Behavioral Tests (Stochastic)

For stochastic simulations, test statistical properties over many runs.

**Pattern:**
```typescript
describe('Zollman convergence', () => {
  it('converges to correct belief in >90% of runs', () => {
    const results = Array(1000).fill(0).map((_, i) => {
      const sim = createSimulation({ seed: i });
      sim.runToCompletion();
      return sim.convergedToTruth();
    });

    const successRate = results.filter(Boolean).length / results.length;
    expect(successRate).toBeGreaterThan(0.9);
  });
});
```

### 6. Snapshot Tests (Views)

Capture component renders for regression detection.

**Use for:**
- Control panel layouts
- Static view states
- Metric displays

**Not for:**
- Animated content
- Stochastic visualizations

### 7. Visual Regression Tests

Compare screenshots across versions.

**Workflow:**
1. Capture baseline screenshots
2. Compare new renders to baseline
3. Human review of differences
4. Update baseline if change is intentional

**Tools:** Playwright, Percy, or similar

---

## Test Organization

```
tests/
├── unit/
│   ├── model.test.ts
│   ├── metrics.test.ts
│   └── validation.test.ts
├── integration/
│   ├── simulation.test.ts
│   └── presets.test.ts
├── visual/
│   ├── snapshots/
│   └── screenshot.test.ts
└── properties/
    └── invariants.test.ts
```

---

## Per-Visualizer Test Requirements

### Minimum Test Coverage

Every visualizer MUST have:

1. **Parameter validation tests** - Invalid params rejected
2. **Initial state tests** - Correct initialization
3. **Step tests** - Single steps produce expected changes
4. **Reset tests** - Reset returns to initial state
5. **Seed tests** - Reproducibility verified
6. **Preset tests** - All presets load without error

### Recommended Additional Tests

- Property-based invariant tests
- Statistical behavior tests (for stochastic models)
- Performance benchmarks
- Visual regression baselines

---

## Specific Testing Concerns

### Bayesian Networks

- Probabilities always in [0, 1]
- Joint distributions sum to 1
- Conditional independence respected
- d-separation correctly computed

### Signaling Games

- Urn counts non-negative
- Probabilities normalize correctly
- Information content calculations correct
- Convergence detection works

### Manifold Learning

- Embedding dimensions match specification
- Neighborhood preservation metrics computed correctly
- Algorithm convergence for known datasets

### Agent-Based Models

- Agent counts stable
- Network connectivity preserved
- Message passing correct

---

## Continuous Integration

### On Pull Request

- All unit tests
- All integration tests
- Property-based tests (limited iterations)
- Linting and type checking

### On Merge to Main

- Full test suite
- Visual regression comparison
- Performance benchmarks

### Scheduled (Weekly)

- Extended property-based tests
- Cross-browser visual tests
- Accessibility audits

---

## Test Data

### Fixtures

Store test fixtures in `tests/fixtures/`:
- Known-good states
- Edge case configurations
- Regression test cases

### Generated Data

For property-based testing:
- Use consistent RNG seeding
- Document generation parameters
- Keep generation separate from assertions

---

## Documentation

Each test file should include:
- Brief description of what's being tested
- Why these tests matter
- Any non-obvious test patterns used
