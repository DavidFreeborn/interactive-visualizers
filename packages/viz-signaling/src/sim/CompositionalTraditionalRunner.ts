import { CompositionalRunner } from './CompositionalRunner';
import type {
  CompositionalTraditionalConfig,
  CompositionalTraditionalConfigInput,
  CompositionalTraditionalSnapshot,
} from '../model/compositionalTraditional';

/**
 * Backward-compatible deterministic runner for the traditional compositional game.
 */
export class CompositionalTraditionalRunner {
  private runner: CompositionalRunner;

  constructor(input: CompositionalTraditionalConfigInput = {}) {
    this.runner = new CompositionalRunner({
      ...input,
      modelType: 'traditional',
    });
  }

  getConfig(): CompositionalTraditionalConfig {
    return this.runner.getConfig();
  }

  getSnapshot(): CompositionalTraditionalSnapshot {
    const { modelType: _modelType, ...snapshot } = this.runner.getSnapshot();
    return snapshot as CompositionalTraditionalSnapshot;
  }

  step(): CompositionalTraditionalSnapshot {
    const { modelType: _modelType, ...snapshot } = this.runner.step();
    return snapshot as CompositionalTraditionalSnapshot;
  }

  stepMany(rounds: number): CompositionalTraditionalSnapshot {
    const { modelType: _modelType, ...snapshot } = this.runner.stepMany(rounds);
    return snapshot as CompositionalTraditionalSnapshot;
  }

  applyForgettingNow(): CompositionalTraditionalSnapshot {
    const { modelType: _modelType, ...snapshot } =
      this.runner.applyForgettingNow();
    return snapshot as CompositionalTraditionalSnapshot;
  }

  reset(): CompositionalTraditionalSnapshot {
    const { modelType: _modelType, ...snapshot } = this.runner.reset();
    return snapshot as CompositionalTraditionalSnapshot;
  }

  updateConfig(input: CompositionalTraditionalConfigInput): CompositionalTraditionalSnapshot {
    const { modelType: _modelType, ...snapshot } = this.runner.updateConfig({
      ...input,
      modelType: 'traditional',
    });
    return snapshot as CompositionalTraditionalSnapshot;
  }
}
