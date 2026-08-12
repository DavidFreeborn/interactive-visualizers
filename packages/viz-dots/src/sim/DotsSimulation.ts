import { SeededRandom } from '@viz/core-math';
import type {
  DotsConfig,
  DotsState,
  DotsMetrics,
  Interaction,
  RenderOptions,
  SwarmalatorsParams,
  ParticleLifeParams,
} from '../model/types';
import { DEFAULT_CONFIG, DEFAULT_RENDER_OPTIONS } from '../model/types';
import { DotsModel } from '../model/DotsModel';

export class DotsSimulation {
  private config: DotsConfig;
  private renderOptions: RenderOptions;
  private model: DotsModel;
  private rng: SeededRandom;
  private state: DotsState;
  private interaction: Interaction | null = null;

  constructor(
    config: Partial<DotsConfig> = {},
    renderOptions: Partial<RenderOptions> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.renderOptions = { ...DEFAULT_RENDER_OPTIONS, ...renderOptions };
    this.model = new DotsModel(this.config);
    this.rng = new SeededRandom(this.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  getState(): DotsState { return this.state; }
  getMetrics(): DotsMetrics { return this.model.computeMetrics(this.state); }
  getConfig(): DotsConfig { return this.config; }
  getRenderOptions(): RenderOptions { return this.renderOptions; }

  step(): void {
    this.state = this.model.step(
      this.state,
      this.rng,
      this.interaction,
      this.renderOptions
    );
  }

  reset(): void {
    this.rng = new SeededRandom(this.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  resetWithSeed(seed: number): void {
    this.config = { ...this.config, seed };
    this.model.updateConfig({ seed });
    this.rng = new SeededRandom(seed);
    this.state = this.model.createInitialState(this.rng);
  }

  resetWithConfig(config: Partial<DotsConfig>): void {
    this.config = { ...this.config, ...config };
    this.model = new DotsModel(this.config);
    this.rng = new SeededRandom(this.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  updateConfig(config: Partial<DotsConfig>): void {
    if (this.requiresReset(config)) {
      this.resetWithConfig(config);
      return;
    }
    this.config = { ...this.config, ...config };
    this.model.updateConfig(config);
  }

  private requiresReset(config: Partial<DotsConfig>): boolean {
    if (config.numParticles !== undefined || config.behavior !== undefined) return true;

    const next = config.behaviorParams;
    const current = this.config.behaviorParams;
    if (!next) return false;
    if (next.type !== current.type) return true;

    if (next.type === 'particle-life' && current.type === 'particle-life') {
      return (next as ParticleLifeParams).numTypes !== current.numTypes;
    }

    if (next.type === 'swarmalators' && current.type === 'swarmalators') {
      const a = next as SwarmalatorsParams;
      const b = current as SwarmalatorsParams;
      return a.model !== b.model ||
        a.frequencyMode !== b.frequencyMode ||
        a.omegaMax !== b.omegaMax ||
        a.initMode !== b.initMode ||
        a.initialBoxSize !== b.initialBoxSize;
    }

    return false;
  }

  updateRenderOptions(options: Partial<RenderOptions>): void {
    this.renderOptions = { ...this.renderOptions, ...options };
  }

  setInteraction(interaction: Interaction | null): void {
    this.interaction = interaction;
  }

  getModel(): DotsModel { return this.model; }
}
