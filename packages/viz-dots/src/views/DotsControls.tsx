/**
 * Control panel for the Swarm Dynamics visualizer.
 */

import React from 'react';
import type {
  DotsConfig,
  BehaviorType,
  TopologyType,
  RenderOptions,
  BoidsParams,
  FriendsEnemiesParams,
  ParticleLifeParams,
  SwarmalatorsParams,
} from '../model/types';
import {
  MAX_PARTICLES,
  DEFAULT_BOIDS_PARAMS,
  DEFAULT_FRIENDS_ENEMIES_PARAMS,
  DEFAULT_PARTICLE_LIFE_PARAMS,
  DEFAULT_SWARMALATOR_PARAMS,
} from '../model/types';
import type { Preset } from '../presets';

interface DotsControlsProps {
  config: DotsConfig;
  renderOptions: RenderOptions;
  presets: Preset[];
  isPlaying: boolean;
  simulationSpeed: number;
  zoom: number;
  onSimulationSpeedChange: (speed: number) => void;
  onZoomChange: (zoom: number) => void;
  onConfigChange: (config: Partial<DotsConfig>) => void;
  onRenderOptionsChange: (options: Partial<RenderOptions>) => void;
  onPresetSelect: (preset: Preset) => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onNewSeed: () => void;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '260px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    color: '#666',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    color: '#333',
    minWidth: '90px',
  },
  labelDisabled: {
    fontSize: '13px',
    color: '#aaa',
    minWidth: '90px',
  },
  input: {
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    width: '70px',
  },
  select: {
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    flex: 1,
  },
  slider: {
    flex: 1,
    marginLeft: '8px',
  },
  sliderDisabled: {
    flex: 1,
    marginLeft: '8px',
    opacity: 0.4,
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  primaryButton: {
    backgroundColor: '#333',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#e9ecef',
    color: '#333',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  presetList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  presetButton: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'left' as const,
  },
  presetButtonActive: {
    padding: '6px 10px',
    border: '1px solid #333',
    borderRadius: '4px',
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'left' as const,
    fontWeight: 500,
  },
  checkbox: {
    marginRight: '6px',
  },
  valueDisplay: {
    width: '35px',
    textAlign: 'right' as const,
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#666',
  },
};

export const DotsControls: React.FC<DotsControlsProps> = ({
  config,
  renderOptions,
  presets,
  isPlaying,
  simulationSpeed,
  zoom,
  onSimulationSpeedChange,
  onZoomChange,
  onConfigChange,
  onRenderOptionsChange,
  onPresetSelect,
  onPlay,
  onPause,
  onStep,
  onReset,
  onNewSeed,
}) => {
  const behaviorType = config.behaviorParams.type;

  // Group presets by behavior
  const presetsByBehavior = presets.reduce((acc, preset) => {
    const type = preset.config.behavior;
    if (!acc[type]) acc[type] = [];
    acc[type].push(preset);
    return acc;
  }, {} as Record<string, Preset[]>);

  return (
    <div style={styles.container}>
      {/* Playback Controls */}
      <div style={styles.section}>
        <div style={styles.buttonRow}>
          <button
            style={{ ...styles.button, ...styles.primaryButton, flex: 1 }}
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onStep}
            disabled={isPlaying}
          >
            Step
          </button>
        </div>
        <div style={styles.buttonRow}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
            onClick={onReset}
          >
            Reset
          </button>
          <button
            style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
            onClick={onNewSeed}
          >
            New Seed
          </button>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Seed</span>
          <input
            type="number"
            style={{ ...styles.input, flex: 1 }}
            value={config.seed}
            onChange={(e) => {
              const seed = parseInt(e.target.value, 10);
              if (!isNaN(seed)) {
                onConfigChange({ seed });
              }
            }}
          />
        </div>
      </div>

      {/* Behavior Selection */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Behavior</div>
        <select
          style={styles.select}
          value={behaviorType}
          onChange={(e) => {
            const newType = e.target.value as BehaviorType;
            const defaultParams = getDefaultBehaviorParams(newType);
            onConfigChange({ behavior: newType, behaviorParams: defaultParams });
          }}
        >
          <option value="boids">Boids (Flocking)</option>
          <option value="friends-enemies">Friends & Enemies</option>
          <option value="particle-life">Particle Life</option>
          <option value="swarmalators">Swarmalators</option>
        </select>
      </div>

      {/* Presets - one per line */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Presets</div>
        <div style={styles.presetList}>
          {(presetsByBehavior[config.behavior] || []).map((preset) => (
            <button
              key={preset.name}
              style={styles.presetButton}
              onClick={() => onPresetSelect(preset)}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Speed */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Simulation</div>
        <div style={styles.row}>
          <span style={styles.label}>Speed</span>
          <input
            type="range"
            style={styles.slider}
            min={0.25}
            max={3}
            step={0.25}
            value={simulationSpeed}
            onChange={(e) => onSimulationSpeedChange(parseFloat(e.target.value))}
          />
          <span style={styles.valueDisplay}>{simulationSpeed.toFixed(2)}x</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Zoom</span>
          <input
            type="range"
            style={styles.slider}
            min={0.5}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          />
          <span style={styles.valueDisplay}>{zoom.toFixed(1)}x</span>
        </div>
      </div>

      {/* Basic Parameters */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Particles</div>
        <div style={styles.row}>
          <span style={styles.label}>Count</span>
          <input
            type="number"
            style={styles.input}
            value={config.numParticles}
            min={10}
            max={MAX_PARTICLES[behaviorType] || 1000}
            step={50}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 100;
              const max = MAX_PARTICLES[behaviorType] || 1000;
              onConfigChange({ numParticles: Math.min(value, max) });
            }}
          />
        </div>
      </div>

      {/* Topology */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Topology</div>
        <select
          style={styles.select}
          value={config.topology}
          onChange={(e) => onConfigChange({ topology: e.target.value as TopologyType })}
        >
          <option value="torus">Torus (wrap X and Y)</option>
          <option value="bounded">Bounded (no wrap)</option>
          <option value="plane">Plane (unbounded)</option>
          <option value="cylinder-x">Cylinder (wrap X)</option>
          <option value="cylinder-y">Cylinder (wrap Y)</option>
          <option value="mobius-x">Möbius (twist X)</option>
          <option value="mobius-y">Möbius (twist Y)</option>
        </select>
      </div>

      {/* Behavior-specific parameters */}
      {behaviorType === 'boids' && (
        <BoidsControls
          params={config.behaviorParams as BoidsParams}
          onChange={(params) =>
            onConfigChange({ behaviorParams: { ...config.behaviorParams, ...params } as BoidsParams })
          }
        />
      )}
      {behaviorType === 'friends-enemies' && (
        <FriendsEnemiesControls
          params={config.behaviorParams as FriendsEnemiesParams}
          onChange={(params) =>
            onConfigChange({ behaviorParams: { ...config.behaviorParams, ...params } as FriendsEnemiesParams })
          }
        />
      )}
      {behaviorType === 'particle-life' && (
        <ParticleLifeControls
          params={config.behaviorParams as ParticleLifeParams}
          onChange={(params) =>
            onConfigChange({ behaviorParams: { ...config.behaviorParams, ...params } as ParticleLifeParams })
          }
        />
      )}
      {behaviorType === 'swarmalators' && (
        <SwarmalatorsControls
          params={config.behaviorParams as SwarmalatorsParams}
          onChange={(params) =>
            onConfigChange({ behaviorParams: { ...config.behaviorParams, ...params } as SwarmalatorsParams })
          }
        />
      )}

      {/* Rendering Options - always visible, disabled when not applicable */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Rendering</div>
        <div style={styles.row}>
          <label>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={renderOptions.showArrows}
              onChange={(e) =>
                onRenderOptionsChange({ showArrows: e.target.checked })
              }
            />
            Show as arrows
          </label>
        </div>
        <div style={styles.row}>
          <label>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={renderOptions.showTrails}
              onChange={(e) =>
                onRenderOptionsChange({ showTrails: e.target.checked })
              }
            />
            Show trails
          </label>
        </div>
        <div style={styles.row}>
          <span style={renderOptions.showTrails ? styles.label : styles.labelDisabled}>
            Trail length
          </span>
          <input
            type="range"
            style={renderOptions.showTrails ? styles.slider : styles.sliderDisabled}
            min={5}
            max={100}
            value={renderOptions.trailLength}
            disabled={!renderOptions.showTrails}
            onChange={(e) =>
              onRenderOptionsChange({ trailLength: parseInt(e.target.value) })
            }
          />
          <span style={styles.valueDisplay}>{renderOptions.trailLength}</span>
        </div>
        <div style={styles.row}>
          <span style={renderOptions.showTrails ? styles.label : styles.labelDisabled}>
            Trail opacity
          </span>
          <input
            type="range"
            style={renderOptions.showTrails ? styles.slider : styles.sliderDisabled}
            min={0.1}
            max={1}
            step={0.1}
            value={renderOptions.trailOpacity}
            disabled={!renderOptions.showTrails}
            onChange={(e) =>
              onRenderOptionsChange({ trailOpacity: parseFloat(e.target.value) })
            }
          />
          <span style={styles.valueDisplay}>{renderOptions.trailOpacity.toFixed(1)}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Dot size</span>
          <input
            type="range"
            style={styles.slider}
            min={1}
            max={6}
            step={0.5}
            value={renderOptions.particleRadius}
            onChange={(e) =>
              onRenderOptionsChange({ particleRadius: parseFloat(e.target.value) })
            }
          />
          <span style={styles.valueDisplay}>{renderOptions.particleRadius}</span>
        </div>
      </div>
    </div>
  );
};

// Behavior-specific control components

const BoidsControls: React.FC<{
  params: BoidsParams;
  onChange: (params: Partial<BoidsParams>) => void;
}> = ({ params, onChange }) => (
  <div style={styles.section}>
    <div style={styles.sectionTitle}>Boids</div>
    <div style={styles.row}>
      <span style={styles.label}>Max Speed</span>
      <input
        type="range"
        style={styles.slider}
        min={2}
        max={20}
        step={1}
        value={params.maxSpeed}
        onChange={(e) => onChange({ maxSpeed: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.maxSpeed}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Separation</span>
      <input
        type="range"
        style={styles.slider}
        min={0}
        max={3}
        step={0.1}
        value={params.separationWeight}
        onChange={(e) => onChange({ separationWeight: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.separationWeight.toFixed(1)}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Alignment</span>
      <input
        type="range"
        style={styles.slider}
        min={0}
        max={2}
        step={0.1}
        value={params.alignmentWeight}
        onChange={(e) => onChange({ alignmentWeight: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.alignmentWeight.toFixed(1)}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Cohesion</span>
      <input
        type="range"
        style={styles.slider}
        min={0}
        max={2}
        step={0.1}
        value={params.cohesionWeight}
        onChange={(e) => onChange({ cohesionWeight: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.cohesionWeight.toFixed(1)}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Vision radius</span>
      <input
        type="range"
        style={styles.slider}
        min={20}
        max={150}
        step={5}
        value={params.cohesionRadius}
        onChange={(e) => {
          const r = parseFloat(e.target.value);
          onChange({
            cohesionRadius: r,
            alignmentRadius: r * 0.75,
            separationRadius: r * 0.25,
          });
        }}
      />
      <span style={styles.valueDisplay}>{params.cohesionRadius}</span>
    </div>
  </div>
);

const FriendsEnemiesControls: React.FC<{
  params: FriendsEnemiesParams;
  onChange: (params: Partial<FriendsEnemiesParams>) => void;
}> = ({ params, onChange }) => (
  <div style={styles.section}>
    <div style={styles.sectionTitle}>Friends & Enemies</div>
    <div style={styles.row}>
      <span style={styles.label}>Friend mode</span>
      <select
        style={styles.select}
        value={params.friendMode || 'random'}
        onChange={(e) => onChange({ friendMode: e.target.value as 'random' | 'cycle' })}
      >
        <option value="cycle">Cycle (ribbon)</option>
        <option value="random">Random (cliques)</option>
      </select>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Friend pull</span>
      <input
        type="range"
        style={styles.slider}
        min={0.005}
        max={0.05}
        step={0.005}
        value={params.friendWeight}
        onChange={(e) => onChange({ friendWeight: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.friendWeight.toFixed(3)}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Enemy push</span>
      <input
        type="range"
        style={styles.slider}
        min={0.005}
        max={0.03}
        step={0.005}
        value={params.enemyWeight}
        onChange={(e) => onChange({ enemyWeight: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.enemyWeight.toFixed(3)}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Rewire rate</span>
      <input
        type="range"
        style={styles.slider}
        min={0}
        max={2}
        step={0.1}
        value={params.rewireRate ?? 0.1}
        onChange={(e) => onChange({ rewireRate: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{(params.rewireRate ?? 0.1).toFixed(1)}/f</span>
    </div>
  </div>
);

const ParticleLifeControls: React.FC<{
  params: ParticleLifeParams;
  onChange: (params: Partial<ParticleLifeParams>) => void;
}> = ({ params, onChange }) => (
  <div style={styles.section}>
    <div style={styles.sectionTitle}>Particle Life</div>
    <div style={styles.row}>
      <span style={styles.label}>Types</span>
      <input
        type="number"
        style={styles.input}
        value={params.numTypes}
        min={2}
        max={8}
        onChange={(e) => {
          const newNumTypes = Math.max(2, Math.min(8, parseInt(e.target.value) || 2));
          // Regenerate matrix when number of types changes
          onChange({
            numTypes: newNumTypes,
            attractionMatrix: generateRandomMatrix(newNumTypes),
          });
        }}
      />
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Radius</span>
      <input
        type="range"
        style={styles.slider}
        min={30}
        max={150}
        value={params.interactionRadius}
        onChange={(e) =>
          onChange({ interactionRadius: parseFloat(e.target.value) })
        }
      />
      <span style={styles.valueDisplay}>{params.interactionRadius}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Friction</span>
      <input
        type="range"
        style={styles.slider}
        min={0.01}
        max={0.5}
        step={0.01}
        value={params.friction}
        onChange={(e) => onChange({ friction: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.friction.toFixed(2)}</span>
    </div>
  </div>
);

const SwarmalatorsControls: React.FC<{
  params: SwarmalatorsParams;
  onChange: (params: Partial<SwarmalatorsParams>) => void;
}> = ({ params, onChange }) => (
  <div style={styles.section}>
    <div style={styles.sectionTitle}>Swarmalators</div>
    <div style={styles.row}>
      <span style={styles.label}>Spatial (J)</span>
      <input
        type="range"
        style={styles.slider}
        min={-1}
        max={2}
        step={0.1}
        value={params.J}
        onChange={(e) => onChange({ J: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.J.toFixed(1)}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Phase (K)</span>
      <input
        type="range"
        style={styles.slider}
        min={-2}
        max={2}
        step={0.1}
        value={params.K}
        onChange={(e) => onChange({ K: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.K.toFixed(1)}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Freq variance</span>
      <input
        type="range"
        style={styles.slider}
        min={0}
        max={0.5}
        step={0.05}
        value={params.omegaVariance}
        onChange={(e) => onChange({ omegaVariance: parseFloat(e.target.value) })}
      />
      <span style={styles.valueDisplay}>{params.omegaVariance.toFixed(2)}</span>
    </div>
  </div>
);

function getDefaultBehaviorParams(type: BehaviorType) {
  switch (type) {
    case 'boids':
      return { ...DEFAULT_BOIDS_PARAMS };
    case 'friends-enemies':
      return { ...DEFAULT_FRIENDS_ENEMIES_PARAMS };
    case 'particle-life':
      // Generate fresh random matrix for each new particle-life config
      return {
        ...DEFAULT_PARTICLE_LIFE_PARAMS,
        attractionMatrix: generateRandomMatrix(DEFAULT_PARTICLE_LIFE_PARAMS.numTypes),
      };
    case 'swarmalators':
      return { ...DEFAULT_SWARMALATOR_PARAMS };
  }
}

function generateRandomMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      matrix[i][j] = Math.random() * 2 - 1;
    }
  }
  return matrix;
}

export default DotsControls;
