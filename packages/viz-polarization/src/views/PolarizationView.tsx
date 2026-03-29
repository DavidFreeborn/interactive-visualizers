/**
 * Main view component for the Factionalization & Polarization visualizer.
 *
 * Scientific Status: Standard toy model
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  PlaybackControls,
  MetricsPanel,
  ScientificStatus,
  InfoPanel,
  usePlayback,
  type MetricDisplay,
} from '@viz/core-ui';
import { PolarizationSimulation } from '../sim/PolarizationSimulation';
import type { PolarizationConfig, NetworkType } from '../model/types';
import { DEFAULT_CONFIG } from '../model/PolarizationModel';
import { CONTENT } from '../content';
import { PRESETS } from '../presets';
import { BeliefSpace } from './BeliefSpace';
import { NetworkDiagram } from './NetworkDiagram';

export interface PolarizationViewProps {
  initialConfig?: Partial<PolarizationConfig>;
  width?: number;
}

export const PolarizationView: React.FC<PolarizationViewProps> = ({
  initialConfig = {},
  width = 900,
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

  // Metrics display
  const metricsDisplay: MetricDisplay[] = useMemo(
    () => [
      { label: 'Timestep', value: `${metrics.timestep}/${config.numTimesteps}` },
      { label: 'Variance', value: metrics.variance.toFixed(4) },
      { label: 'Mean P(H)', value: metrics.meanBelief.toFixed(3) },
      { label: 'Case', value: metrics.updatingCase },
    ],
    [metrics, config.numTimesteps]
  );

  return (
    <div className="polarization-view" style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>{CONTENT.title}</h1>
          <ScientificStatus status="standard-toy-model" />
        </div>
        <p style={styles.description}>{CONTENT.description}</p>
      </header>

      {/* Main */}
      <div style={styles.main}>
        {/* Visualizations */}
        <div style={styles.visualizations}>
          <div style={styles.vizRow}>
            <NetworkDiagram network={network} width={200} height={180} />
            <BeliefSpace
              currentBeliefs={state.agents}
              history={state.history}
              showTrajectories
              width={350}
              height={350}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <MetricsPanel title="Current State" metrics={metricsDisplay} />

          <PlaybackControls
            isPlaying={playback.isPlaying}
            speed={playback.speed}
            stepsPerFrame={playback.stepsPerFrame}
            onPlay={playback.play}
            onPause={playback.pause}
            onStep={handleStep}
            onSpeedChange={playback.setSpeed}
            onStepsPerFrameChange={playback.setStepsPerFrame}
            onReset={handleReset}
          />

          {/* Controls */}
          <div style={styles.controls}>
            <h4 style={styles.controlsTitle}>Parameters</h4>

            <label style={styles.label}>
              Preset:
              <select
                style={styles.select}
                onChange={(e) => {
                  const preset = PRESETS.find((p) => p.name === e.target.value);
                  if (preset) handleConfigChange(preset.config);
                }}
              >
                <option value="">-- Select --</option>
                {PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Network:
              <select
                value={config.networkType}
                onChange={(e) =>
                  handleConfigChange({ networkType: e.target.value as NetworkType })
                }
                style={styles.select}
              >
                <option value="chain">Chain</option>
                <option value="collider">Collider</option>
              </select>
            </label>

            <label style={styles.label}>
              Likelihood:
              <input
                type="number"
                value={config.likelihoodRatio}
                onChange={(e) =>
                  handleConfigChange({ likelihoodRatio: Number(e.target.value) })
                }
                min={0.5}
                max={0.99}
                step={0.05}
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Seed:
              <input
                type="number"
                value={config.seed}
                onChange={(e) => handleConfigChange({ seed: Number(e.target.value) })}
                style={styles.input}
              />
            </label>
          </div>
        </aside>
      </div>

      {/* Info panels */}
      <div style={styles.infoPanels}>
        <InfoPanel title="Key Concepts" collapsible defaultExpanded={true}>
          <div style={styles.conceptsGrid}>
            {Object.entries(CONTENT.keyConcepts).map(([key, concept]) => (
              <div key={key} style={styles.conceptCard}>
                <h5 style={styles.conceptTerm}>{concept.term}</h5>
                <p style={styles.conceptDef}>{concept.definition}</p>
                {'example' in concept && (
                  <p style={styles.conceptExample}>
                    <em>Example: {concept.example}</em>
                  </p>
                )}
              </div>
            ))}
          </div>
        </InfoPanel>

        <InfoPanel title="What This Shows" collapsible defaultExpanded={false}>
          <ul style={styles.list}>
            {CONTENT.whatThisShows.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </InfoPanel>

        <InfoPanel
          title="What This Does NOT Show"
          variant="warning"
          collapsible
          defaultExpanded={false}
        >
          {Object.entries(CONTENT.whatThisDoesNotShow).map(([key, section]) => (
            <div key={key} style={styles.section}>
              <h5 style={styles.sectionTitle}>{section.title}</h5>
              <ul style={styles.list}>
                {section.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </InfoPanel>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.source}>
          <strong>Source:</strong> {CONTENT.source.paper}. {CONTENT.source.note}
        </p>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    marginBottom: '24px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
  },
  description: {
    margin: 0,
    color: '#595959',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  main: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
  },
  visualizations: {
    flex: 1,
  },
  vizRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  sidebar: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  controls: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  controlsTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
  },
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    marginBottom: '8px',
  },
  select: {
    padding: '4px 8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  input: {
    width: '80px',
    padding: '4px 8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  infoPanels: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  list: {
    margin: 0,
    paddingLeft: '20px',
  },
  section: {
    marginBottom: '12px',
  },
  sectionTitle: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#d84315',
  },
  footer: {
    borderTop: '1px solid #e0e0e0',
    paddingTop: '16px',
  },
  source: {
    margin: 0,
    fontSize: '12px',
    color: '#888',
  },
  conceptsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  },
  conceptCard: {
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    borderLeft: '3px solid #1976d2',
  },
  conceptTerm: {
    margin: '0 0 6px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1976d2',
  },
  conceptDef: {
    margin: '0 0 6px 0',
    fontSize: '12px',
    lineHeight: 1.4,
    color: '#333',
  },
  conceptExample: {
    margin: 0,
    fontSize: '11px',
    color: '#666',
  },
};
