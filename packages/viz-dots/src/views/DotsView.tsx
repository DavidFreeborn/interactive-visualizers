/**
 * Main view component for the Swarm Dynamics visualizer.
 */

import React, { useState, useRef, useCallback } from 'react';
import { usePlayback } from '@viz/core-ui';
import type { DotsConfig, RenderOptions, Interaction, DotsMetrics } from '../model/types';
import { DEFAULT_CONFIG, DEFAULT_RENDER_OPTIONS, MAX_PARTICLES } from '../model/types';
import { DotsSimulation } from '../sim/DotsSimulation';
import { DotsCanvas } from './DotsCanvas';
import { DotsControls } from './DotsControls';
import { PRESETS, type Preset } from '../presets';
import { CONTENT } from '../content';

interface DotsViewProps {
  initialConfig?: Partial<DotsConfig>;
  initialRenderOptions?: Partial<RenderOptions>;
  width?: number;
  height?: number;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    margin: 0,
    color: '#1a1a1a',
  },
  main: {
    display: 'flex',
    gap: '16px',
  },
  canvasSection: {
    flex: 1,
    minWidth: 0,
  },
  controlsSection: {
    flex: '0 0 280px',
  },
  metricsBar: {
    display: 'flex',
    gap: '20px',
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '12px',
    marginTop: '8px',
  },
  metric: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  metricLabel: {
    color: '#888',
  },
  metricValue: {
    fontWeight: 600,
    fontFamily: 'monospace',
    color: '#333',
  },
  interactionHint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  infoPanel: {
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginTop: '12px',
  },
  infoPanelTitle: {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#333',
  },
  infoPanelText: {
    margin: 0,
    fontSize: '12px',
    color: '#555',
    lineHeight: 1.6,
    whiteSpace: 'pre-line' as const,
    fontFamily: 'SFMono-Regular, Consolas, Monaco, "Liberation Mono", monospace',
  },
  credit: {
    fontSize: '11px',
    color: '#888',
    fontStyle: 'italic' as const,
    marginTop: '6px',
  },
};

export const DotsView: React.FC<DotsViewProps> = ({
  initialConfig = {},
  initialRenderOptions = {},
  width = 900,
  height = 600,
}) => {
  // Configuration state
  const [config, setConfig] = useState<DotsConfig>(() => ({
    ...DEFAULT_CONFIG,
    width,
    height,
    ...initialConfig,
  }));

  // Set render options based on initial behavior
  const [renderOptions, setRenderOptions] = useState<RenderOptions>(() => {
    const behavior = initialConfig.behavior || DEFAULT_CONFIG.behavior;
    return {
      ...DEFAULT_RENDER_OPTIONS,
      showArrows: behavior === 'boids',
      colorScheme: behavior === 'particle-life' ? 'type'
                 : behavior === 'swarmalators' ? 'phase'
                 : 'monochrome',
      ...initialRenderOptions,
    };
  });

  // Zoom state for manual view control
  const [zoom, setZoom] = useState(1);

  // Simulation ref
  const simRef = useRef(new DotsSimulation(config, renderOptions));
  const [, forceRender] = useState(0);
  const triggerRender = useCallback(() => forceRender((c) => c + 1), []);

  // Metrics
  const [metrics, setMetrics] = useState<DotsMetrics>(() =>
    simRef.current.getMetrics()
  );

  // Handle simulation step
  const handleStep = useCallback(() => {
    simRef.current.step();
    setMetrics(simRef.current.getMetrics());
    triggerRender();
  }, [triggerRender]);

  // Playback hook
  const playback = usePlayback({
    onStep: handleStep,
    initialSpeed: 1,
  });

  // Handle interaction
  const handleInteraction = useCallback((interaction: Interaction) => {
    simRef.current.setInteraction(interaction);
  }, []);

  // Handle config change
  const handleConfigChange = useCallback(
    (newConfig: Partial<DotsConfig>) => {
      const updated = { ...config, ...newConfig };
      setConfig(updated);

      // If seed changed, reset simulation with new seed
      if (newConfig.seed !== undefined && newConfig.seed !== config.seed) {
        simRef.current.resetWithSeed(newConfig.seed);
        setMetrics(simRef.current.getMetrics());
        triggerRender();
        return;
      }

      simRef.current.updateConfig(newConfig);
      setMetrics(simRef.current.getMetrics());
      triggerRender();

      // Auto-adjust render options, topology, and particle count based on behavior
      if (newConfig.behavior) {
        const behavior = newConfig.behavior;
        const newRenderOpts: Partial<RenderOptions> = {
          showArrows: behavior === 'boids',
          colorScheme: behavior === 'particle-life' ? 'type'
                     : behavior === 'swarmalators' ? 'phase'
                     : 'monochrome',
        };
        setRenderOptions(prev => ({ ...prev, ...newRenderOpts }));
        simRef.current.updateRenderOptions(newRenderOpts);

        // Auto-set topology: plane for self-bounding models, torus for others
        const naturalTopology =
          behavior === 'friends-enemies' || behavior === 'swarmalators'
            ? 'plane'
            : 'torus';
        if (updated.topology !== naturalTopology) {
          const topologyUpdate = { topology: naturalTopology as DotsConfig['topology'] };
          setConfig(prev => ({ ...prev, ...topologyUpdate }));
          simRef.current.updateConfig(topologyUpdate);
        }

        // Clamp particle count to max for this behavior
        const maxParticles = MAX_PARTICLES[behavior] || 1000;
        if (updated.numParticles > maxParticles) {
          const particleUpdate = { numParticles: maxParticles };
          setConfig(prev => ({ ...prev, ...particleUpdate }));
          simRef.current.updateConfig(particleUpdate);
        }
      }
    },
    [config, triggerRender]
  );

  // Handle render options change
  const handleRenderOptionsChange = useCallback(
    (newOptions: Partial<RenderOptions>) => {
      const updated = { ...renderOptions, ...newOptions };
      setRenderOptions(updated);
      simRef.current.updateRenderOptions(newOptions);
    },
    [renderOptions]
  );

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (preset: Preset) => {
      const newConfig = { ...preset.config, width, height };
      setConfig(newConfig);
      simRef.current.resetWithConfig(newConfig);
      setMetrics(simRef.current.getMetrics());
      triggerRender();
    },
    [width, height, triggerRender]
  );

  // Handle reset (same seed)
  const handleReset = useCallback(() => {
    simRef.current.reset();
    setMetrics(simRef.current.getMetrics());
    triggerRender();
  }, [triggerRender]);

  // Handle new seed
  const handleNewSeed = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 1000000);
    const newConfig = { ...config, seed: newSeed };
    setConfig(newConfig);
    simRef.current.resetWithSeed(newSeed);
    setMetrics(simRef.current.getMetrics());
    triggerRender();
  }, [config, triggerRender]);

  // Get current behavior info
  const behaviorInfo = CONTENT.behaviors[config.behavior];
  const state = simRef.current.getState();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>{CONTENT.title}</h1>
      </header>

      {/* Main content */}
      <div style={styles.main}>
        {/* Canvas section */}
        <div style={styles.canvasSection}>
          <DotsCanvas
            state={state}
            options={renderOptions}
            width={width}
            height={height}
            zoom={zoom}
            onInteraction={handleInteraction}
          />

          {/* Metrics bar */}
          <div style={styles.metricsBar}>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Frame</span>
              <span style={styles.metricValue}>{metrics.frame}</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Speed</span>
              <span style={styles.metricValue}>
                {metrics.avgSpeed.toFixed(2)}
              </span>
            </div>
            {metrics.orderParameter !== undefined && (
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Order</span>
                <span style={styles.metricValue}>
                  {metrics.orderParameter.toFixed(2)}
                </span>
              </div>
            )}
            {metrics.phaseSynchronization !== undefined && (
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Sync</span>
                <span style={styles.metricValue}>
                  {metrics.phaseSynchronization.toFixed(2)}
                </span>
              </div>
            )}
            <span style={styles.interactionHint}>
              Click to attract · Right-click to repel
            </span>
          </div>

          {/* Behavior description */}
          {behaviorInfo && (
            <div style={styles.infoPanel}>
              <div style={styles.infoPanelTitle}>{behaviorInfo.name}</div>
              <p style={styles.infoPanelText}>
                {behaviorInfo.description}
              </p>
              {behaviorInfo.credit && (
                <p style={styles.credit}>
                  {behaviorInfo.credit}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Controls section */}
        <div style={styles.controlsSection}>
          <DotsControls
            config={config}
            renderOptions={renderOptions}
            presets={PRESETS}
            isPlaying={playback.isPlaying}
            simulationSpeed={playback.speed}
            zoom={zoom}
            onSimulationSpeedChange={playback.setSpeed}
            onZoomChange={setZoom}
            onConfigChange={handleConfigChange}
            onRenderOptionsChange={handleRenderOptionsChange}
            onPresetSelect={handlePresetSelect}
            onPlay={playback.play}
            onPause={playback.pause}
            onStep={handleStep}
            onReset={handleReset}
            onNewSeed={handleNewSeed}
          />
        </div>
      </div>
    </div>
  );
};

export default DotsView;
