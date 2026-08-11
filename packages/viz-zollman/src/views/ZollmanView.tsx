/**
 * Refined Zollman Effect visualizer with intuitive pedagogy.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { usePlayback } from '@viz/core-ui';
import { ZollmanSimulation } from '../sim/ZollmanSimulation';
import type { ZollmanConfig, TopologyType } from '../model/types';
import { DEFAULT_CONFIG } from '../model/ZollmanModel';
import { CONTENT } from '../content';
import { NetworkView } from './NetworkView';
import { BeliefTimeline } from './BeliefTimeline';

export interface ZollmanViewProps {
  initialConfig?: Partial<ZollmanConfig>;
}

export const ZollmanView: React.FC<ZollmanViewProps> = ({
  initialConfig = {},
}) => {
  const [config, setConfig] = useState<ZollmanConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  const simulationRef = useRef<ZollmanSimulation>(
    new ZollmanSimulation(config)
  );

  const [, setRenderCount] = useState(0);
  const forceRender = useCallback(() => setRenderCount((c) => c + 1), []);

  const [showExplainer, setShowExplainer] = useState(true);

  const simulation = simulationRef.current;
  const state = simulation.getState();
  const metrics = simulation.getMetrics();

  // Step function
  const handleStep = useCallback(() => {
    simulation.step();
    forceRender();
  }, [forceRender, simulation]);

  const playback = usePlayback({
    onStep: handleStep,
    initialSpeed: 2,
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
    (partial: Partial<ZollmanConfig>) => {
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
        simulationRef.current = new ZollmanSimulation(newConfig);
        forceRender();
      }
    },
    [config, forceRender, playback]
  );

  const currentTopology = CONTENT.topologies[config.topology];

  // Status display
  const statusDisplay = useMemo(() => {
    if (!metrics.converged) return { text: 'Exploring', color: '#3b82f6' };
    if (metrics.convergedToTruth) return { text: 'Found truth!', color: '#10b981' };
    return { text: 'Lock-in', color: '#dc2626' };
  }, [metrics]);

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
                <h4 style={styles.sectionTitle}>{currentTopology?.name} Network</h4>
                <NetworkView
                  agents={state.agents}
                  neighbors={state.neighbors}
                  width={280}
                  height={280}
                />
                <p style={styles.topologyDesc}>{currentTopology?.tradeoff}</p>
              </div>
              <div style={styles.timelineSection}>
                <h4 style={styles.sectionTitle}>Belief Over Time</h4>
                <BeliefTimeline
                  beliefHistory={state.beliefHistory}
                  width={380}
                  height={280}
                />
              </div>
            </div>
          </div>

          {/* Key concepts */}
          <div style={styles.conceptsRow}>
            {Object.entries(CONTENT.keyConcepts).map(([key, concept]) => (
              <div key={key} style={styles.conceptCard}>
                <h5 style={styles.conceptTerm}>{concept.term}</h5>
                <p style={styles.conceptShort}>{concept.short}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls column */}
        <div style={styles.controlColumn}>
          {/* Status */}
          <div style={styles.statusCard}>
            <div style={styles.roundDisplay}>
              Round <strong>{metrics.round}</strong>
            </div>
            <div
              style={{
                ...styles.statusBadge,
                backgroundColor: statusDisplay.color + '20',
                color: statusDisplay.color,
              }}
            >
              {statusDisplay.text}
            </div>
            <div style={styles.beliefDisplay}>
              Mean belief: <strong>{metrics.meanBelief.toFixed(3)}</strong>
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

            <label style={styles.label}>Topology</label>
            <select
              value={config.topology}
              onChange={(e) =>
                handleConfigChange({ topology: e.target.value as TopologyType })
              }
              style={styles.select}
            >
              <option value="cycle">Cycle (ring)</option>
              <option value="complete">Complete (fully connected)</option>
              <option value="star">Star (hub-and-spoke)</option>
              <option value="er-random">ER Random (Erdős-Rényi)</option>
              <option value="ba-scale-free">BA Scale-Free (Barabási-Albert)</option>
              <option value="ws-small-world">WS Small-World (Watts-Strogatz)</option>
            </select>

            <label style={styles.label}>
              Epsilon (B's advantage): {config.epsilon}
            </label>
            <input
              type="range"
              min={0.01}
              max={0.2}
              step={0.01}
              value={config.epsilon}
              onChange={(e) =>
                handleConfigChange({ epsilon: Number(e.target.value) })
              }
              style={styles.slider}
            />

            <label style={styles.label}>
              Tests per round: {config.testsPerRound}
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={config.testsPerRound}
              onChange={(e) =>
                handleConfigChange({ testsPerRound: Number(e.target.value) })
              }
              style={styles.slider}
            />
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
          Based on "{CONTENT.source.paper}" by {CONTENT.source.author}
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
  },
  networkSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  timelineSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  },
  topologyDesc: {
    margin: '8px 0 0 0',
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center',
    maxWidth: '220px',
  },
  conceptsRow: {
    display: 'flex',
    gap: '12px',
  },
  conceptCard: {
    flex: 1,
    padding: '12px',
    background: '#f1f5f9',
    borderRadius: '6px',
    borderLeft: '3px solid #3b82f6',
  },
  conceptTerm: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e40af',
  },
  conceptShort: {
    margin: 0,
    fontSize: '12px',
    color: '#475569',
  },
  controlColumn: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusCard: {
    background: '#f1f5f9',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  },
  roundDisplay: {
    fontSize: '14px',
    color: '#475569',
  },
  statusBadge: {
    marginTop: '8px',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: 500,
    display: 'inline-block',
  },
  beliefDisplay: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#64748b',
  },
  controlCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
  },
  cardTitle: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
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
