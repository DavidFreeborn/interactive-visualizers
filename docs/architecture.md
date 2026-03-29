# Architecture

This document describes the system architecture for the interactive-visualizers project.

---

## Design Principles

### Separation of Concerns

Each visualizer separates:

1. **Model Logic** - Pure mathematical/theoretical model
2. **Simulation Logic** - State evolution, stepping, randomization
3. **Rendering Logic** - Visual representation
4. **Content Logic** - Explanations, annotations, pedagogical text

### Reusability

- Core packages provide shared functionality
- Visualizer packages are self-contained
- Consistent interfaces across families

### Framework First

Build reusable infrastructure before specific visualizers.

---

## Package Structure

### Core Packages

```
packages/
├── core-ui/         # Shared UI components
├── core-math/       # Mathematical utilities
├── core-sim/        # Simulation framework
└── core-content/    # Content structures
```

#### core-ui

Shared UI primitives:
- Control panels (sliders, toggles, dropdowns)
- Play/pause/step controls
- Speed controls
- Reset buttons
- View selectors
- Information panels
- Scientific status labels

#### core-math

Mathematical utilities:
- Vector/matrix operations
- Probability distributions
- Random number generation (seeded)
- Graph/network structures
- Statistical measures

#### core-sim

Simulation framework:
- Simulation state management
- Stepping/iteration control
- Parameter validation
- Reset/initialization
- Seed management for reproducibility

#### core-content

Content structures:
- Explanation text formatting
- Section/subsection organization
- "What this shows" / "What this doesn't show" panels
- Source attribution
- Scientific status display

### Visualizer Packages

```
packages/
├── viz-signaling/       # Signaling games
├── viz-polarization/    # Factionalization/polarization
├── viz-zollman/         # Zollman effect
├── viz-manifold/        # Manifold learning
├── viz-dl/              # Deep learning
├── viz-llm/             # LLM visualizers
├── viz-qft/             # QFT particles (spec only)
├── viz-norton/          # Norton's dome (spec only)
└── viz-maxwell/         # Maxwell's demon (spec only)
```

Each visualizer package structure:

```
viz-*/
├── src/
│   ├── model/       # Pure model logic
│   ├── sim/         # Simulation logic
│   ├── views/       # React view components
│   ├── content/     # Explanatory content
│   ├── presets/     # Preset configurations
│   └── index.ts     # Public exports
├── tests/           # Unit and integration tests
└── package.json
```

---

## Key Interfaces

### Model Interface

```typescript
interface Model<State, Params> {
  // Create initial state
  createInitialState(params: Params, seed?: number): State;

  // Validate parameters
  validateParams(params: Params): ValidationResult;

  // Get observable metrics from state
  getMetrics(state: State): Metrics;
}
```

### Simulation Interface

```typescript
interface Simulation<State, Params> {
  // Current state
  state: State;

  // Configuration
  params: Params;

  // Step the simulation
  step(): void;

  // Reset to initial state
  reset(seed?: number): void;

  // Check if converged/complete
  isComplete(): boolean;
}
```

### View Interface

```typescript
interface VisualizerView<State, Params> {
  // Render the visualization
  render(state: State, params: Params): React.ReactNode;

  // View name for selection
  name: string;

  // Description
  description: string;
}
```

### Visualizer Component

```typescript
interface VisualizerProps<Params> {
  // Initial parameters
  initialParams?: Partial<Params>;

  // Preset name
  preset?: string;

  // View override
  initialView?: string;

  // Callbacks
  onStateChange?: (state: State) => void;
}
```

---

## Data Flow

```
User Input → Controls → Params → Simulation → State → Views
                                     ↑
                                  Model
```

1. User adjusts controls
2. Controls update parameters
3. Parameters configure simulation
4. Simulation steps using model logic
5. State updates trigger view re-renders
6. Views display state visually

---

## Technology Choices

### React + TypeScript

- Type safety for complex model logic
- Component-based UI composition
- Ecosystem support

### Tailwind CSS

- Rapid styling iteration
- Consistent design system
- Dark mode support

### D3.js

- Bespoke explanatory visualizations
- Fine control over visual encoding
- Animation support

### SVG vs Canvas

**Default to SVG:**
- Accessibility
- CSS styling
- Interactivity
- Smaller datasets

**Use Canvas when:**
- >10,000 elements
- Real-time particle systems
- Performance-critical animation

### three.js

Only use when:
- True 3D structure adds explanatory value
- Cannot be adequately shown in 2D

---

## State Management

### Local State

Each visualizer manages its own state:
- Simulation state
- UI state (selected view, panel open/closed)
- Animation state (playing, speed)

### No Global State

No Redux or similar. Visualizers are self-contained.

### URL Parameters (Optional)

Support deep-linking via URL params for:
- Preset selection
- Initial parameter values
- View selection

---

## Testing Strategy

See `docs/testing-strategy.md` for details.

Summary:
- Unit tests for model logic
- Property-based tests for mathematical invariants
- Visual regression tests for views
- Integration tests for full visualizer flow

---

## Extension Points

### Adding a New Visualizer

See `docs/adding-a-new-visualizer.md`.

### Adding a New View

Add to `src/views/` with standard interface.

### Adding Presets

Add to `src/presets/` as named configurations.

---

## Performance Considerations

### Memoization

- Memoize expensive model computations
- Use React.memo for pure view components
- Cache derived metrics

### Animation Frame Budget

- Target 60fps for smooth animation
- Degrade gracefully if computation exceeds frame budget
- Provide "fast forward" for slow simulations

### Lazy Loading

- Split visualizer packages for code splitting
- Load on demand in showcase app
