/**
 * Main view component for the Manifold Learning visualizer.
 *
 * Scientific Status: Standard toy model
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { MetricsPanel, ScientificStatus, InfoPanel, type MetricDisplay } from '@viz/core-ui';
import { ManifoldSimulation } from '../sim/ManifoldSimulation';
import type { ManifoldConfig } from '../model/types';
import { DEFAULT_CONFIG } from '../model/ManifoldModel';
import { CONTENT } from '../content';
import { ScatterPlot3D } from './ScatterPlot3D';
import { ScatterPlot2D } from './ScatterPlot2D';
import { ManifoldControls } from './ManifoldControls';

export interface ManifoldViewProps {
  initialConfig?: Partial<ManifoldConfig>;
  width?: number;
}

export const ManifoldView: React.FC<ManifoldViewProps> = ({
  initialConfig = {},
  width = 900,
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

  // Metrics display
  const metricsDisplay: MetricDisplay[] = useMemo(() => {
    if (!state.isEmbedded) {
      return [{ label: 'Status', value: 'Not embedded yet' }];
    }
    return [
      {
        label: 'Trustworthiness',
        value: metrics.trustworthiness.toFixed(3),
        tooltip: CONTENT.metrics.trustworthiness.description,
      },
      {
        label: 'Continuity',
        value: metrics.continuity.toFixed(3),
        tooltip: CONTENT.metrics.continuity.description,
      },
      {
        label: 'Explained Var',
        value: (metrics.explainedVariance * 100).toFixed(1),
        unit: '%',
        tooltip: CONTENT.metrics.explainedVariance.description,
      },
      {
        label: 'Local Distortion',
        value: metrics.meanLocalDistortion.toFixed(3),
        tooltip: CONTENT.metrics.meanLocalDistortion.description,
      },
    ];
  }, [state.isEmbedded, metrics]);

  const plotWidth = Math.min((width - 380) / 2, 350);

  return (
    <div className="manifold-view" style={styles.container}>
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
          <div style={styles.plotRow}>
            <ScatterPlot3D
              points={visData.originals}
              params={visData.params}
              neighborGraph={visData.neighborGraph}
              showEdges={state.isEmbedded}
              width={plotWidth}
              height={plotWidth}
              title="Original (3D)"
            />
            <ScatterPlot2D
              points={state.isEmbedded ? visData.embedded : []}
              params={state.isEmbedded ? visData.params : []}
              width={plotWidth}
              height={plotWidth}
              title="Embedding (2D)"
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <MetricsPanel title="Embedding Quality" metrics={metricsDisplay} />

          <ManifoldControls
            config={config}
            onConfigChange={handleConfigChange}
            onRunEmbedding={handleRunEmbedding}
            onReset={handleReset}
            isEmbedded={state.isEmbedded}
          />
        </aside>
      </div>

      {/* Info panels */}
      <div style={styles.infoPanels}>
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
          <strong>Source:</strong> {CONTENT.source.paper} by {CONTENT.source.author}.{' '}
          {CONTENT.source.note}
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
  plotRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  sidebar: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
};
