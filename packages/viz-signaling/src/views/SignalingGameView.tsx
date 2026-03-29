/**
 * Main view component for the Signaling Games visualizer.
 *
 * Scientific Status: Standard toy model
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  PlaybackControls,
  MetricsPanel,
  ScientificStatus,
  usePlayback,
  type MetricDisplay,
} from '@viz/core-ui';
import { SignalingSimulation } from '../sim/SignalingSimulation';
import type { SignalingGameConfig } from '../model/types';
import { DEFAULT_CONFIG } from '../model/SignalingGameModel';
import { CONTENT } from '../content';
import { SignalingDiagram } from './SignalingDiagram';
import { Timeline, type TimelineData } from './Timeline';
import { ParameterControls } from './ParameterControls';
import { WhatThisShowsPanel, WhatThisDoesNotShowPanel } from './WhatThisShowsPanel';

export interface SignalingGameViewProps {
  initialConfig?: Partial<SignalingGameConfig>;
  width?: number;
  height?: number;
}

export const SignalingGameView: React.FC<SignalingGameViewProps> = ({
  initialConfig = {},
  width = 900,
  height = 700,
}) => {
  const [config, setConfig] = useState<SignalingGameConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  const simulationRef = useRef<SignalingSimulation>(
    new SignalingSimulation(config)
  );

  // Force re-render counter
  const [, setRenderCount] = useState(0);
  const forceRender = useCallback(() => setRenderCount((c) => c + 1), []);

  // Get current simulation state
  const simulation = simulationRef.current;
  const state = simulation.getState();
  const metrics = simulation.getMetrics();
  const senderProbs = simulation.getSenderProbabilities();
  const receiverProbs = simulation.getReceiverProbabilities();
  const history = simulation.getHistory();

  // Step function
  const handleStep = useCallback(() => {
    simulationRef.current.stepN(playback.stepsPerFrame);
    forceRender();
  }, [forceRender]);

  // Playback hook
  const playback = usePlayback({
    onStep: handleStep,
    initialSpeed: 1,
    initialStepsPerFrame: 100,
  });

  // Reset handler
  const handleReset = useCallback(() => {
    playback.pause();
    simulationRef.current = new SignalingSimulation(config);
    forceRender();
  }, [config, forceRender, playback]);

  // Config change handler
  const handleConfigChange = useCallback(
    (partial: Partial<SignalingGameConfig>) => {
      const newConfig = { ...config, ...partial };
      setConfig(newConfig);
      playback.pause();
      simulationRef.current = new SignalingSimulation(newConfig);
      forceRender();
    },
    [config, forceRender, playback]
  );

  // Prepare metrics for display
  const metricsDisplay: MetricDisplay[] = useMemo(
    () => [
      {
        label: 'Turn',
        value: metrics.turn,
        tooltip: CONTENT.metrics.turn.description,
      },
      {
        label: 'Success Rate',
        value: (metrics.successRate * 100).toFixed(1),
        unit: '%',
        tooltip: CONTENT.metrics.successRate.description,
      },
      {
        label: 'Avg Info Content',
        value: metrics.avgInformationContent.toFixed(3),
        unit: 'bits',
        tooltip: CONTENT.metrics.avgInformationContent.description,
      },
      {
        label: 'Info Loss',
        value:
          metrics.informationLoss !== null
            ? metrics.informationLoss.toFixed(3)
            : 'N/A',
        unit: metrics.informationLoss !== null ? 'bits' : '',
      },
    ],
    [metrics]
  );

  // Prepare timeline data
  const timelineData: TimelineData = useMemo(
    () => ({
      turns: history.turns,
      series: [
        {
          label: 'Info (bits)',
          values: history.infoContent,
          color: '#2196f3',
        },
        {
          label: 'Success',
          values: history.successRate,
          color: '#4caf50',
        },
      ],
      markers: history.replacementTurn
        ? [
            {
              turn: history.replacementTurn,
              label: 'Replacement',
              color: '#ff5722',
            },
          ]
        : [],
    }),
    [history]
  );

  return (
    <div className="signaling-game-view" style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>{CONTENT.title}</h1>
          <ScientificStatus status="standard-toy-model" />
        </div>
        <p style={styles.description}>{CONTENT.description}</p>
      </header>

      {/* Main visualization area */}
      <div style={styles.main}>
        <div style={styles.visualizations}>
          {/* Signaling diagram */}
          <div style={styles.diagramSection}>
            <h3 style={styles.sectionTitle}>State-Signal-Action Flow</h3>
            <SignalingDiagram
              config={simulation.getConfig()}
              senderProbs={senderProbs}
              receiverProbs={receiverProbs}
              width={Math.min(width - 40, 700)}
              height={300}
            />
          </div>

          {/* Timeline */}
          <div style={styles.timelineSection}>
            <h3 style={styles.sectionTitle}>Metrics Over Time</h3>
            <Timeline
              data={timelineData}
              width={Math.min(width - 40, 600)}
              height={180}
              yMin={0}
              yMax={2}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <MetricsPanel title="Current Metrics" metrics={metricsDisplay} />

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

          <ParameterControls
            config={config}
            onConfigChange={handleConfigChange}
            disabled={playback.isPlaying}
          />
        </aside>
      </div>

      {/* Info panels */}
      <div style={styles.infoPanels}>
        <WhatThisShowsPanel />
        <WhatThisDoesNotShowPanel />
      </div>

      {/* Source */}
      <footer style={styles.footer}>
        <p style={styles.source}>
          <strong>Source:</strong> {CONTENT.source.paper} by{' '}
          {CONTENT.source.author}. {CONTENT.source.note}
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
    color: '#666',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sidebar: {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  diagramSection: {},
  timelineSection: {},
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  infoPanels: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
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
