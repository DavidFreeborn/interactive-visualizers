/**
 * Refined Manifold Learning visualizer with intuitive pedagogy.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ManifoldSimulation } from '../sim/ManifoldSimulation';
import type { ManifoldConfig } from '../model/types';
import { DEFAULT_CONFIG } from '../model/ManifoldModel';
import { CONTENT } from '../content';
import { ScatterPlot3D } from './ScatterPlot3D';
import { ScatterPlot2D } from './ScatterPlot2D';

export interface ManifoldViewProps {
  initialConfig?: Partial<ManifoldConfig>;
}

export const ManifoldView: React.FC<ManifoldViewProps> = ({
  initialConfig = {},
}) => {
  const [config, setConfig] = useState<ManifoldConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  const simulationRef = useRef<ManifoldSimulation>(
    new ManifoldSimulation(config)
  );

  const [, setRenderCount] = useState(0);
  const forceRender = useCallback(() => setRenderCount((c) => c + 1), []);

  const [showExplainer, setShowExplainer] = useState(true);

  const simulation = simulationRef.current;
  const state = simulation.getState();
  const visData = simulation.getVisualizationData();
  const metrics = simulation.getMetrics();

  // Config change
  const handleConfigChange = useCallback(
    (partial: Partial<ManifoldConfig>) => {
      const newConfig = { ...config, ...partial };
      setConfig(newConfig);
      simulationRef.current.resetWithConfig(partial);
      forceRender();
    },
    [config, forceRender]
  );

  // Run embedding
  const handleRunEmbedding = useCallback(() => {
    simulationRef.current.runEmbedding();
    forceRender();
  }, [forceRender]);

  // Reset
  const handleReset = useCallback(() => {
    simulationRef.current.reset();
    forceRender();
  }, [forceRender]);

  // Scenario change
  const handleScenario = useCallback(
    (scenarioId: string) => {
      const scenario = CONTENT.scenarios.find((s) => s.id === scenarioId);
      if (scenario) {
        const newConfig = { ...config, ...scenario.config };
        setConfig(newConfig);
        simulationRef.current = new ManifoldSimulation(newConfig);
        simulationRef.current.runEmbedding();
        forceRender();
      }
    },
    [config, forceRender]
  );

  const currentDataset = CONTENT.datasets[config.dataset];
  const currentAlgorithm = CONTENT.algorithms[config.algorithm];

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
          {/* Plots */}
          <div style={styles.plotsCard}>
            <div style={styles.plotsRow}>
              <ScatterPlot3D
                points={visData.originals}
                params={visData.params}
                neighborGraph={visData.neighborGraph}
                showEdges={state.isEmbedded && config.algorithm !== 'pca'}
                width={320}
                height={320}
                title="Original (3D)"
              />
              <ScatterPlot2D
                points={state.isEmbedded ? visData.embedded : []}
                params={state.isEmbedded ? visData.params : []}
                width={320}
                height={320}
                title="Embedding (2D)"
              />
            </div>
          </div>

          {/* Current selection info */}
          <div style={styles.infoRow}>
            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>{currentDataset?.name}</h4>
              <p style={styles.infoText}>{currentDataset?.description}</p>
              {currentDataset?.analogy && (
                <p style={styles.infoAnalogy}>{currentDataset.analogy}</p>
              )}
            </div>
            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>{currentAlgorithm?.name}</h4>
              <p style={styles.infoText}>{currentAlgorithm?.description}</p>
              <p style={styles.infoStrength}>
                <strong>Strength:</strong> {currentAlgorithm?.strength}
              </p>
            </div>
          </div>
        </div>

        {/* Controls column */}
        <div style={styles.controlColumn}>
          {/* Metrics */}
          <div style={styles.metricsCard}>
            <h4 style={styles.cardTitle}>Embedding Quality</h4>
            {!state.isEmbedded ? (
              <p style={styles.notEmbedded}>Click "Run Embedding" to compute</p>
            ) : (
              <div style={styles.metricsGrid}>
                <MetricDisplay
                  label="Trustworthiness"
                  value={metrics.trustworthiness.toFixed(3)}
                  tooltip={CONTENT.metrics.trustworthiness.short}
                />
                <MetricDisplay
                  label="Continuity"
                  value={metrics.continuity.toFixed(3)}
                  tooltip={CONTENT.metrics.continuity.short}
                />
                {config.algorithm === 'pca' && (
                  <MetricDisplay
                    label="Explained Var"
                    value={`${(metrics.explainedVariance * 100).toFixed(1)}%`}
                    tooltip={CONTENT.metrics.explainedVariance.short}
                  />
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={styles.controlCard}>
            <h4 style={styles.cardTitle}>Configuration</h4>

            <label style={styles.label}>Dataset</label>
            <select
              value={config.dataset}
              onChange={(e) =>
                handleConfigChange({
                  dataset: e.target.value as ManifoldConfig['dataset'],
                })
              }
              style={styles.select}
            >
              <option value="swiss-roll">Swiss Roll</option>
              <option value="s-curve">S-Curve</option>
              <option value="circles">Concentric Circles</option>
            </select>

            <label style={styles.label}>Algorithm</label>
            <select
              value={config.algorithm}
              onChange={(e) =>
                handleConfigChange({
                  algorithm: e.target.value as ManifoldConfig['algorithm'],
                })
              }
              style={styles.select}
            >
              <option value="pca">PCA (linear)</option>
              <option value="isomap">Isomap (geodesic)</option>
              <option value="tsne">t-SNE (probabilistic)</option>
            </select>

            {config.algorithm === 'isomap' && (
              <>
                <label style={styles.label}>
                  Neighbors (k): {config.numNeighbors}
                </label>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={config.numNeighbors}
                  onChange={(e) =>
                    handleConfigChange({ numNeighbors: Number(e.target.value) })
                  }
                  style={styles.slider}
                />
              </>
            )}

            {config.algorithm === 'tsne' && (
              <>
                <label style={styles.label}>
                  Perplexity: {config.perplexity}
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={config.perplexity}
                  onChange={(e) =>
                    handleConfigChange({ perplexity: Number(e.target.value) })
                  }
                  style={styles.slider}
                />
                <p style={styles.hint}>Effective number of neighbors (5-50)</p>
              </>
            )}

            <label style={styles.label}>Samples: {config.numSamples}</label>
            <input
              type="range"
              min={50}
              max={400}
              step={50}
              value={config.numSamples}
              onChange={(e) =>
                handleConfigChange({ numSamples: Number(e.target.value) })
              }
              style={styles.slider}
            />

            <div style={styles.buttonRow}>
              <button onClick={handleRunEmbedding} style={styles.runButton}>
                Run Embedding
              </button>
              <button onClick={handleReset} style={styles.resetButton}>
                Reset
              </button>
            </div>
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

const MetricDisplay: React.FC<{
  label: string;
  value: string;
  tooltip: string;
}> = ({ label, value, tooltip }) => (
  <div style={styles.metric} title={tooltip}>
    <span style={styles.metricLabel}>{label}</span>
    <span style={styles.metricValue}>{value}</span>
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
  plotsCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
  },
  plotsRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  infoRow: {
    display: 'flex',
    gap: '16px',
  },
  infoCard: {
    flex: 1,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
  },
  infoTitle: {
    margin: '0 0 6px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  },
  infoText: {
    margin: '0 0 6px 0',
    fontSize: '12px',
    color: '#64748b',
    lineHeight: 1.4,
  },
  infoAnalogy: {
    margin: 0,
    fontSize: '11px',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  infoStrength: {
    margin: 0,
    fontSize: '11px',
    color: '#10b981',
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
  notEmbedded: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic',
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
  hint: {
    margin: '4px 0 0 0',
    fontSize: '10px',
    color: '#94a3b8',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  runButton: {
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
  resetButton: {
    padding: '10px 16px',
    fontSize: '14px',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
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
