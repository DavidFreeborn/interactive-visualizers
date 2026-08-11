/**
 * Factionalization & Polarization visualizer with convergence/divergence indicator.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { usePlayback } from '@viz/core-ui';
import { PolarizationSimulation } from '../sim/PolarizationSimulation';
import type { PolarizationConfig, NetworkType } from '../model/types';
import { DEFAULT_CONFIG } from '../model/PolarizationModel';
import { CONTENT } from '../content';
import { BeliefSpace } from './BeliefSpace';
import { NetworkDiagram } from './NetworkDiagram';

export interface PolarizationViewProps {
  initialConfig?: Partial<PolarizationConfig>;
}

import type { AgentBeliefs } from '../model/types';

/**
 * Computes the trend from history of agent beliefs.
 */
function computeTrend(
  history: AgentBeliefs[][]
): 'converging' | 'diverging' | 'stable' | 'unknown' {
  if (history.length < 3) return 'unknown';

  // Compute variance at different points
  const computeVariance = (agents: AgentBeliefs[]) => {
    if (agents.length <= 1) return 0;
    const mean = agents.reduce((sum, a) => sum + a.h, 0) / agents.length;
    return agents.reduce((sum, a) => sum + (a.h - mean) ** 2, 0) / agents.length;
  };

  const recentVariances = history.slice(-5).map(computeVariance);
  const firstVar = recentVariances[0];
  const lastVar = recentVariances[recentVariances.length - 1];

  const diff = lastVar - firstVar;
  const threshold = 0.001;

  if (Math.abs(diff) < threshold) return 'stable';
  return diff > 0 ? 'diverging' : 'converging';
}

export const PolarizationView: React.FC<PolarizationViewProps> = ({
  initialConfig = {},
}) => {
  const [config, setConfig] = useState<PolarizationConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  const simulationRef = useRef<PolarizationSimulation>(
    new PolarizationSimulation(config)
  );

  const [, setRenderCount] = useState(0);
  const forceRender = useCallback(() => setRenderCount((c) => c + 1), []);

  const [showExplainer, setShowExplainer] = useState(true);

  const simulation = simulationRef.current;
  const state = simulation.getState();
  const network = simulation.getNetwork();
  const metrics = simulation.getMetrics();

  // Step function
  const handleStep = useCallback(() => {
    if (!simulation.isComplete()) {
      simulation.step();
      forceRender();
    } else {
      playback.pause();
    }
  }, [forceRender]);

  const playback = usePlayback({
    onStep: handleStep,
    initialSpeed: 1,
    initialStepsPerFrame: 1,
  });

  // Reset
  const handleReset = useCallback(() => {
    playback.pause();
    simulationRef.current.reset();
    forceRender();
  }, [forceRender, playback]);

  // Config change
  const handleConfigChange = useCallback(
    (partial: Partial<PolarizationConfig>) => {
      const newConfig = { ...config, ...partial };
      setConfig(newConfig);
      playback.pause();
      simulationRef.current.resetWithConfig(partial);
      forceRender();
    },
    [config, forceRender, playback]
  );

  // Scenario change
  const handleScenario = useCallback(
    (scenarioId: string) => {
      const scenario = CONTENT.scenarios.find((s) => s.id === scenarioId);
      if (scenario) {
        const newConfig = { ...config, ...scenario.config };
        setConfig(newConfig);
        playback.pause();
        simulationRef.current = new PolarizationSimulation(newConfig);
        forceRender();
      }
    },
    [config, forceRender, playback]
  );

  const currentNetwork = CONTENT.networks[config.networkType];
  const trend = computeTrend(state.history);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>{CONTENT.title}</h1>
        <p style={styles.subtitle}>{CONTENT.subtitle}</p>
      </header>

      {/* Explainer toggle */}
      <button
        onClick={() => setShowExplainer(!showExplainer)}
        style={styles.explainerToggle}
      >
        {showExplainer ? 'Hide explanation' : 'Show explanation'}
      </button>

      {/* Explainer */}
      {showExplainer && (
        <div style={styles.explainer}>
          <div style={styles.explainerGrid}>
            <ExplainerSection
              heading={CONTENT.explainer.whatIsThis.heading}
              text={CONTENT.explainer.whatIsThis.text}
            />
            <ExplainerSection
              heading={CONTENT.explainer.coreIdea.heading}
              text={CONTENT.explainer.coreIdea.text}
            />
          </div>
          <div style={styles.explainerGrid}>
            <ExplainerSection
              heading={CONTENT.explainer.whyMatters.heading}
              text={CONTENT.explainer.whyMatters.text}
            />
            <ExplainerSection
              heading={CONTENT.explainer.howToRead.heading}
              text={CONTENT.explainer.howToRead.text}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={styles.main}>
        {/* Visualization column */}
        <div style={styles.vizColumn}>
          {/* Visualizations */}
          <div style={styles.vizCard}>
            <div style={styles.vizRow}>
              <div style={styles.networkSection}>
                <h4 style={styles.sectionTitle}>{currentNetwork?.name} Network</h4>
                <NetworkDiagram network={network} width={200} height={180} />
                <p style={styles.networkDesc}>{currentNetwork?.structure}</p>
                <p style={styles.networkExpect}>{currentNetwork?.expectation}</p>
              </div>
              <BeliefSpace
                currentBeliefs={state.agents}
                history={state.history}
                showTrajectories
                width={400}
                height={350}
              />
            </div>
          </div>

          {/* Convergence/Divergence Indicator */}
          <TrendIndicator trend={trend} variance={metrics.variance} />
        </div>

        {/* Controls column */}
        <div style={styles.controlColumn}>
          {/* Metrics */}
          <div style={styles.metricsCard}>
            <h4 style={styles.cardTitle}>Current State</h4>
            <div style={styles.metricsGrid}>
              <MetricDisplay
                label="Timestep"
                value={`${metrics.timestep}/${config.numTimesteps}`}
              />
              <MetricDisplay
                label="Variance"
                value={metrics.variance.toFixed(4)}
                highlight={metrics.variance > 0.05}
              />
              <MetricDisplay
                label="Mean P(H)"
                value={metrics.meanBelief.toFixed(3)}
              />
              <MetricDisplay label="Case" value={metrics.updatingCase} />
            </div>
          </div>

          {/* Playback */}
          <div style={styles.controlCard}>
            <div style={styles.playbackRow}>
              <button
                onClick={playback.isPlaying ? playback.pause : playback.play}
                style={styles.playButton}
              >
                {playback.isPlaying ? 'Pause' : 'Play'}
              </button>
              <button onClick={handleStep} style={styles.stepButton}>
                Step
              </button>
              <button onClick={handleReset} style={styles.resetButton}>
                Reset
              </button>
            </div>

            <div style={styles.speedRow}>
              <label style={styles.speedLabel}>Speed:</label>
              <input
                type="range"
                min={1}
                max={5}
                value={playback.speed}
                onChange={(e) => playback.setSpeed(Number(e.target.value))}
                style={styles.speedSlider}
              />
            </div>
          </div>

          {/* Configuration */}
          <div style={styles.controlCard}>
            <h4 style={styles.cardTitle}>Configuration</h4>

            <label style={styles.label}>Network</label>
            <select
              value={config.networkType}
              onChange={(e) =>
                handleConfigChange({ networkType: e.target.value as NetworkType })
              }
              style={styles.select}
            >
              <option value="chain">Chain (H → S → D)</option>
              <option value="collider">Collider (H → D ← S)</option>
            </select>

            <label style={styles.label}>Likelihood Ratio</label>
            <input
              type="range"
              min={0.6}
              max={0.95}
              step={0.05}
              value={config.likelihoodRatio}
              onChange={(e) =>
                handleConfigChange({ likelihoodRatio: Number(e.target.value) })
              }
              style={styles.slider}
            />
            <span style={styles.sliderValue}>{config.likelihoodRatio}</span>
          </div>

          {/* Scenarios */}
          <div style={styles.controlCard}>
            <h4 style={styles.cardTitle}>Try a scenario</h4>
            {CONTENT.scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenario(scenario.id)}
                style={styles.scenarioButton}
              >
                <strong>{scenario.name}</strong>
                <span style={styles.scenarioDesc}>{scenario.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.caution}>{CONTENT.caution}</p>
        <p style={styles.source}>
          Based on work by {CONTENT.source.author}
        </p>
      </footer>
    </div>
  );
};

const ExplainerSection: React.FC<{ heading: string; text: string }> = ({
  heading,
  text,
}) => (
  <div style={styles.explainerSection}>
    <h4 style={styles.explainerHeading}>{heading}</h4>
    <p style={styles.explainerText}>{text}</p>
  </div>
);

const MetricDisplay: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <div style={styles.metric}>
    <span style={styles.metricLabel}>{label}</span>
    <span
      style={{
        ...styles.metricValue,
        color: highlight ? '#dc2626' : '#1e293b',
      }}
    >
      {value}
    </span>
  </div>
);

const TrendIndicator: React.FC<{
  trend: 'converging' | 'diverging' | 'stable' | 'unknown';
  variance: number;
}> = ({ trend, variance }) => {
  const trendConfig = {
    converging: {
      label: 'Converging',
      icon: '↘',
      color: '#10b981',
      bg: '#d1fae5',
      description: 'Beliefs are moving closer together',
    },
    diverging: {
      label: 'Diverging',
      icon: '↗',
      color: '#ef4444',
      bg: '#fee2e2',
      description: 'Beliefs are moving apart (polarization)',
    },
    stable: {
      label: 'Stable',
      icon: '→',
      color: '#6b7280',
      bg: '#f3f4f6',
      description: 'Beliefs are not changing significantly',
    },
    unknown: {
      label: 'Starting',
      icon: '○',
      color: '#9ca3af',
      bg: '#f9fafb',
      description: 'Run simulation to see trend',
    },
  };

  const config = trendConfig[trend];

  return (
    <div
      style={{
        ...styles.trendIndicator,
        backgroundColor: config.bg,
        borderColor: config.color,
      }}
    >
      <div style={styles.trendMain}>
        <span style={{ ...styles.trendIcon, color: config.color }}>
          {config.icon}
        </span>
        <span style={{ ...styles.trendLabel, color: config.color }}>
          {config.label}
        </span>
        <span style={styles.trendVariance}>
          Variance: {variance.toFixed(4)}
        </span>
      </div>
      <p style={styles.trendDesc}>{config.description}</p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#111',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '16px',
    color: '#666',
  },
  explainerToggle: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '8px',
  },
  explainer: {
    marginBottom: '24px',
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  explainerGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '16px',
  },
  explainerSection: {},
  explainerHeading: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  },
  explainerText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.6,
    color: '#475569',
  },
  main: {
    display: 'flex',
    gap: '24px',
  },
  vizColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  vizCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
  },
  vizRow: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  networkSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  },
  networkDesc: {
    margin: '8px 0 4px 0',
    fontSize: '13px',
    fontWeight: 500,
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  networkExpect: {
    margin: 0,
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center',
    maxWidth: '180px',
  },
  trendIndicator: {
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid',
  },
  trendMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  trendIcon: {
    fontSize: '24px',
    fontWeight: 700,
  },
  trendLabel: {
    fontSize: '18px',
    fontWeight: 600,
  },
  trendVariance: {
    marginLeft: 'auto',
    fontSize: '14px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  trendDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#475569',
  },
  controlColumn: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  metricsCard: {
    background: '#f1f5f9',
    borderRadius: '8px',
    padding: '16px',
  },
  cardTitle: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
  metricsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e293b',
  },
  controlCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
  },
  playbackRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  playButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: 500,
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  stepButton: {
    padding: '10px 16px',
    fontSize: '14px',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  resetButton: {
    padding: '10px 16px',
    fontSize: '14px',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  speedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  speedLabel: {
    fontSize: '13px',
    color: '#64748b',
  },
  speedSlider: {
    flex: 1,
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '4px',
    marginTop: '10px',
  },
  select: {
    width: '100%',
    padding: '8px',
    fontSize: '13px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    background: '#fff',
  },
  slider: {
    width: '100%',
  },
  sliderValue: {
    fontSize: '12px',
    color: '#64748b',
  },
  scenarioButton: {
    width: '100%',
    padding: '10px',
    marginBottom: '8px',
    fontSize: '13px',
    textAlign: 'left',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  scenarioDesc: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 400,
  },
  footer: {
    marginTop: '32px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  caution: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  source: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
  },
};
