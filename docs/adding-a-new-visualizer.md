# Adding a New Visualizer

This guide explains how to add a new visualizer family to the project.

---

## Prerequisites

Before implementation, ensure:

1. **Source support exists** - Primary sources in `source_materials/`
2. **Paper note exists** - Summary in `docs/paper-notes/`
3. **Specification exists** - Full spec in `docs/visualizer-specs/`
4. **Scientific status determined** - Label assigned (exact/toy/analogy/intuition)
5. **Source gaps documented** - Any gaps noted in `docs/source-gap-report.md`

---

## Step 1: Create Package Structure

Create a new package:

```bash
mkdir -p packages/viz-{name}/src/{model,sim,views,content,presets}
mkdir -p packages/viz-{name}/tests
```

Create `package.json`:

```json
{
  "name": "@interactive-visualizers/viz-{name}",
  "version": "0.0.1",
  "main": "src/index.ts",
  "dependencies": {
    "@interactive-visualizers/core-ui": "workspace:*",
    "@interactive-visualizers/core-math": "workspace:*",
    "@interactive-visualizers/core-sim": "workspace:*",
    "@interactive-visualizers/core-content": "workspace:*"
  }
}
```

---

## Step 2: Define Types

Create `src/types.ts`:

```typescript
/**
 * Parameters for the {Name} visualizer
 */
export interface {Name}Params {
  // List all configurable parameters
  paramA: number;
  paramB: string;
  // ...
}

/**
 * State of the {Name} simulation
 */
export interface {Name}State {
  // All state variables
  step: number;
  // ...
}

/**
 * Metrics computed from state
 */
export interface {Name}Metrics {
  // Observable/displayable metrics
  metricA: number;
  // ...
}
```

---

## Step 3: Implement Model

Create `src/model/index.ts`:

```typescript
import { {Name}Params, {Name}State, {Name}Metrics } from '../types';

/**
 * Pure model logic for {Name}
 */
export const {Name}Model = {
  /**
   * Validate parameters
   */
  validateParams(params: {Name}Params): ValidationResult {
    // Validate all parameters
    // Return { valid: true } or { valid: false, errors: [...] }
  },

  /**
   * Create initial state from parameters
   */
  createInitialState(params: {Name}Params, seed?: number): {Name}State {
    // Initialize state
    // Use seed for any random elements
  },

  /**
   * Compute metrics from current state
   */
  getMetrics(state: {Name}State): {Name}Metrics {
    // Compute observable metrics
  },

  /**
   * Perform one simulation step
   */
  step(state: {Name}State, params: {Name}Params): {Name}State {
    // Return new state (immutable)
  },

  /**
   * Check if simulation is complete
   */
  isComplete(state: {Name}State, params: {Name}Params): boolean {
    // Return true if converged/done
  },
};
```

---

## Step 4: Implement Simulation

Create `src/sim/index.ts`:

```typescript
import { {Name}Model } from '../model';
import { {Name}Params, {Name}State } from '../types';

export class {Name}Simulation {
  private _state: {Name}State;
  private _params: {Name}Params;
  private _seed: number;

  constructor(params: {Name}Params, seed?: number) {
    const validation = {Name}Model.validateParams(params);
    if (!validation.valid) {
      throw new Error(`Invalid params: ${validation.errors.join(', ')}`);
    }

    this._params = params;
    this._seed = seed ?? Date.now();
    this._state = {Name}Model.createInitialState(params, this._seed);
  }

  get state(): {Name}State {
    return this._state;
  }

  get params(): {Name}Params {
    return this._params;
  }

  step(): void {
    this._state = {Name}Model.step(this._state, this._params);
  }

  reset(seed?: number): void {
    this._seed = seed ?? this._seed;
    this._state = {Name}Model.createInitialState(this._params, this._seed);
  }

  isComplete(): boolean {
    return {Name}Model.isComplete(this._state, this._params);
  }
}
```

---

## Step 5: Create Views

Create view components in `src/views/`:

```typescript
// src/views/MainView.tsx
import { {Name}State, {Name}Params } from '../types';

interface Props {
  state: {Name}State;
  params: {Name}Params;
}

export function MainView({ state, params }: Props) {
  // Render main visualization
  return (
    <svg>
      {/* Visualization content */}
    </svg>
  );
}
```

Create view registry:

```typescript
// src/views/index.ts
export const views = {
  main: {
    name: 'Main View',
    description: 'Primary visualization',
    component: MainView,
  },
  metrics: {
    name: 'Metrics',
    description: 'Key metrics over time',
    component: MetricsView,
  },
  // ...
};
```

---

## Step 6: Add Content

Create content in `src/content/`:

```typescript
// src/content/explanations.ts
export const content = {
  title: '{Name} Visualizer',

  whatThisShows: `
    This visualizer shows...
  `,

  whatThisDoesNotShow: `
    This is a toy model that does not...
  `,

  scientificStatus: 'standard-toy-model', // or 'exact', 'conceptual-analogy', etc.

  sections: [
    {
      title: 'Introduction',
      content: '...',
    },
    // ...
  ],

  sources: [
    {
      citation: 'Freeborn (2024)',
      description: 'Primary source',
    },
    // ...
  ],
};
```

---

## Step 7: Define Presets

Create `src/presets/index.ts`:

```typescript
import { {Name}Params } from '../types';

export const presets: Record<string, {Name}Params> = {
  default: {
    paramA: 10,
    paramB: 'value',
    // ...
  },

  example1: {
    // Named configuration
  },

  // ...
};
```

---

## Step 8: Create Main Component

Create `src/{Name}Visualizer.tsx`:

```typescript
import { useState, useCallback } from 'react';
import { {Name}Simulation } from './sim';
import { views } from './views';
import { content } from './content';
import { presets } from './presets';
import { VisualizerShell } from '@interactive-visualizers/core-ui';

interface Props {
  initialParams?: Partial<{Name}Params>;
  preset?: keyof typeof presets;
}

export function {Name}Visualizer({ initialParams, preset = 'default' }: Props) {
  // Implementation using core-ui components
}
```

---

## Step 9: Export Public API

Create `src/index.ts`:

```typescript
// Main component
export { {Name}Visualizer } from './{Name}Visualizer';

// Types
export type { {Name}Params, {Name}State, {Name}Metrics } from './types';

// Model (for advanced use)
export { {Name}Model } from './model';

// Simulation (for advanced use)
export { {Name}Simulation } from './sim';

// Presets
export { presets } from './presets';

// Content
export { content } from './content';
```

---

## Step 10: Write Tests

Create tests in `tests/`:

```typescript
// tests/model.test.ts
import { {Name}Model } from '../src/model';

describe('{Name}Model', () => {
  describe('validateParams', () => {
    it('accepts valid params', () => {
      // ...
    });

    it('rejects invalid params', () => {
      // ...
    });
  });

  describe('step', () => {
    it('produces expected state change', () => {
      // ...
    });
  });

  // More tests...
});
```

---

## Step 11: Add to Showcase

Add the visualizer to `apps/showcase/`:

```typescript
// apps/showcase/src/visualizers.ts
import { {Name}Visualizer } from '@interactive-visualizers/viz-{name}';

export const visualizers = {
  // ...existing...
  '{name}': {
    component: {Name}Visualizer,
    title: '{Name}',
    description: '...',
  },
};
```

---

## Checklist

Before marking complete:

- [ ] Package structure created
- [ ] Types defined
- [ ] Model implemented and tested
- [ ] Simulation wrapper implemented
- [ ] At least one view implemented
- [ ] Content added (what shows/doesn't show)
- [ ] Scientific status label assigned
- [ ] At least one preset defined
- [ ] All tests passing
- [ ] Added to showcase
- [ ] Documentation updated
