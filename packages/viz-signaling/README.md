# Signaling Game Visualizers

This package contains the signaling-game work for the interactive visualizers project.

It currently includes two public apps:

- Classic signaling games: a one-sender Lewis-Skyrms baseline with deterministic seeded simulation, exact reinforcement updates, exact information metrics, and an interactive diagram.
- Compositional signaling games: the fixed `4x(2+2)x4` app with Traditional, Minimalist, Information-Erasing Generalist, and Information-Preserving Generalist receivers, shared playback, and the public forgetting experiment.

## References

- Classic app: based on the models in [Brian Skyrms, *Signals: Evolution, Learning, and Information* (2010)](https://sites.socsci.uci.edu/~bskyrms/bio/books/signals.pdf)
- Compositional Traditional model: based on the models in [Barrett JA, Cochran C, Skyrms B. *On the Evolution of Compositional Language*. Philosophy of Science. 2020;87(5):910-920.](https://www.cambridge.org/core/journals/philosophy-of-science/article/abs/on-the-evolution-of-compositional-language/E65AF2A9D2DB2B8E3C8B4AA0C7273592)
- Compositional Minimalist and Generalist models: based on [David Peter Wallis Freeborn, *Compositional Understanding in Signaling Games*, Synthese (2025)](https://link.springer.com/article/10.1007/s11229-025-05184-3)

## Architecture

The package keeps the same split across both apps:

- `src/model`: pure model logic and metrics
- `src/sim`: deterministic runners
- `src/ui`: React views, diagrams, controls, charts, and debug panels
- `src/apps`: package entry apps used by the showcase

The classic and compositional models share utilities where appropriate, but remain separate model families.

## Running

From the repo root:

```bash
npm run dev
```

Then open the showcase app and choose `Signaling Games`.

## Tests

From the repo root:

```bash
npm test
npm run typecheck
```

The signaling package includes:

- model unit tests
- deterministic runner tests
- jsdom UI tests
- stochastic regression checks

## Calibration

The current package calibration script is still the classic baseline sweep:

```bash
npm run calibrate --workspace=@viz/signaling
```

This writes:

- [`calibration/baseline-2x2-calibration.json`](./calibration/baseline-2x2-calibration.json)

## Package Layout

```text
src/
  apps/
  model/
  sim/
  ui/
scripts/
calibration/
```
