import '../responsive.css';
import React, { startTransition, useEffect, useRef, useState } from 'react';
import type { SignalingGameConfigInput, SimulationHistoryPoint, SignalingMetrics } from '../../model/types';
import { createIdentityMapping, createUniformPrior } from '../../model/validation';
import { SimulationRunner } from '../../sim/SimulationRunner';
import { ControlsPanel } from './ControlsPanel';
import { LineChart } from './LineChart';
import { MatrixTable } from './MatrixTable';
import { MetricsPanel } from './MetricsPanel';
import { SignalDiagram } from './SignalDiagram';
import { usePlayback } from '../hooks/usePlayback';
import { SPEED_PRESETS } from '../types';
import type { PlaybackSpeed, RoundAnimationState } from '../types';
import { createRandomSeed } from '../createRandomSeed';

export interface SignalingGameViewProps {
  initialConfig?: SignalingGameConfigInput;
}

const IDLE_ANIMATION: RoundAnimationState = {
  phase: 'idle',
  progress: 0,
  event: null,
};

const MAX_CHART_POINTS = 400;
const SKYRMS_REFERENCE =
  'Brian Skyrms, Signals: Evolution, Learning, and Information (2010).';
const SKYRMS_REFERENCE_URL =
  'https://sites.socsci.uci.edu/~bskyrms/bio/books/signals.pdf';

function buildIndexedLabels(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`);
}

function buildConfig(
  numStates: number,
  numMessages: number,
  numActions: number,
  seed: number
): SignalingGameConfigInput {
  return {
    numStates,
    numMessages,
    numActions,
    prior: createUniformPrior(numStates),
    correctActions: createIdentityMapping(numStates),
    seed,
  };
}

function sampleHistory(
  history: readonly SimulationHistoryPoint[],
  maxPoints: number
): SimulationHistoryPoint[] {
  if (history.length <= maxPoints) {
    return [...history];
  }

  const sampledIndices = new Set<number>();
  for (let pointIndex = 0; pointIndex < maxPoints; pointIndex += 1) {
    const historyIndex = Math.round((pointIndex * (history.length - 1)) / (maxPoints - 1));
    sampledIndices.add(historyIndex);
  }

  return [...sampledIndices].sort((left, right) => left - right).map((index) => history[index]);
}

/**
 * Main single-sender signaling-game visualizer.
 */
export function SignalingGameView({
  initialConfig = {},
}: SignalingGameViewProps): React.ReactElement {
  const runnerRef = useRef(new SimulationRunner(initialConfig));
  const animationRunIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState(() => runnerRef.current.getSnapshot());
  const [selectedStates, setSelectedStates] = useState(snapshot.config.numStates);
  const [selectedMessages, setSelectedMessages] = useState(snapshot.config.numMessages);
  const [selectedActions, setSelectedActions] = useState(snapshot.config.numActions);
  const [seedInput, setSeedInput] = useState(snapshot.config.seed.toString());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speed, setSpeed] = useState<PlaybackSpeed>('normal');
  const [animationsEnabled, setAnimationsEnabled] = useState(() => !(typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const [debugMode, setDebugMode] = useState(false);
  const [showProbabilityLabels, setShowProbabilityLabels] = useState(false);
  const [animation, setAnimation] = useState<RoundAnimationState>(IDLE_ANIMATION);

  function commitSnapshot(nextSnapshot: ReturnType<SimulationRunner['getSnapshot']>): void {
    startTransition(() => {
      setSnapshot(nextSnapshot);
    });
  }

  function clearAnimation(): void {
    animationRunIdRef.current += 1;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    setAnimation(IDLE_ANIMATION);
  }

  function runAnimationPhase(
    runId: number,
    event: NonNullable<RoundAnimationState['event']>,
    phase: Exclude<RoundAnimationState['phase'], 'idle'>,
    durationMs: number,
    onComplete: () => void
  ): void {
    if (runId !== animationRunIdRef.current) {
      return;
    }

    if (durationMs <= 0) {
      setAnimation({ event, phase, progress: 1 });
      onComplete();
      return;
    }

    const startTime = performance.now();
    const tick = (timestamp: number) => {
      if (runId !== animationRunIdRef.current) {
        return;
      }

      const progress = Math.min(1, (timestamp - startTime) / durationMs);
      setAnimation({ event, phase, progress });

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
        onComplete();
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }

  function startRoundAnimation(event: NonNullable<RoundAnimationState['event']>): void {
    const preset = SPEED_PRESETS[speed];

    if (!animationsEnabled || !preset.animate) {
      setAnimation(IDLE_ANIMATION);
      return;
    }

    clearAnimation();
    const runId = animationRunIdRef.current;

    runAnimationPhase(runId, event, 'state', preset.phaseDurationMs, () => {
      runAnimationPhase(runId, event, 'message', preset.phaseDurationMs, () => {
        runAnimationPhase(runId, event, 'action', preset.phaseDurationMs, () => {
          setAnimation({ event, phase: 'result', progress: 1 });
          animationTimeoutRef.current = window.setTimeout(() => {
            if (runId === animationRunIdRef.current) {
              setAnimation(IDLE_ANIMATION);
            }
          }, preset.resultHoldMs);
        });
      });
    });
  }

  function executePlaybackStep(): void {
    const preset = SPEED_PRESETS[speed];

    if (!animationsEnabled || !preset.animate) {
      const nextSnapshot =
        preset.batchSize > 1 ? runnerRef.current.stepMany(preset.batchSize) : runnerRef.current.step();
      commitSnapshot(nextSnapshot);
      return;
    }

    const nextSnapshot = runnerRef.current.step();
    commitSnapshot(nextSnapshot);
    if (nextSnapshot.lastRoundEvent) {
      startRoundAnimation(nextSnapshot.lastRoundEvent);
    }
  }

  const playback = usePlayback({
    intervalMs: SPEED_PRESETS[speed].intervalMs,
    isBlocked: animationsEnabled && animation.phase !== 'idle',
    onTick: executePlaybackStep,
  });

  function pauseAndClear(): void {
    playback.pause();
    clearAnimation();
  }

  function applyConfiguration(): void {
    pauseAndClear();
    const parsedSeed = Number.parseInt(seedInput, 10);
    if (!Number.isInteger(parsedSeed) || parsedSeed < 0) {
      setErrorMessage('Seed must be a non-negative integer not exceeding 4294967295.');
      return;
    }

    try {
      const nextSnapshot = runnerRef.current.updateConfig(
        buildConfig(selectedStates, selectedMessages, selectedActions, parsedSeed)
      );
      setErrorMessage(null);
      commitSnapshot(nextSnapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to apply configuration.';
      setErrorMessage(message);
    }
  }

  function handlePlayPause(): void {
    if (playback.isPlaying) {
      playback.pause();
      return;
    }

    setErrorMessage(null);
    playback.play();
  }

  function handleStepOne(): void {
    pauseAndClear();
    const nextSnapshot = runnerRef.current.step();
    commitSnapshot(nextSnapshot);
    if (nextSnapshot.lastRoundEvent) {
      startRoundAnimation(nextSnapshot.lastRoundEvent);
    }
  }

  function handleReset(): void {
    pauseAndClear();
    setErrorMessage(null);
    commitSnapshot(runnerRef.current.updateConfig({ seed: createRandomSeed() }));
  }

  useEffect(() => {
    setSelectedStates(snapshot.config.numStates);
    setSelectedMessages(snapshot.config.numMessages);
    setSelectedActions(snapshot.config.numActions);
    setSeedInput(snapshot.config.seed.toString());
  }, [
    snapshot.config.numStates,
    snapshot.config.numMessages,
    snapshot.config.numActions,
    snapshot.config.seed,
  ]);

  useEffect(() => {
    return () => {
      clearAnimation();
    };
  }, []);

  const visibleHistory = sampleHistory(snapshot.history, MAX_CHART_POINTS);
  const rounds = visibleHistory.map((point) => point.round);
  const stateLabels = buildIndexedLabels('S', snapshot.config.numStates);
  const messageLabels = buildIndexedLabels('M', snapshot.config.numMessages);
  const actionLabels = buildIndexedLabels('A', snapshot.config.numActions);
  const modelLabel = `${snapshot.config.numStates}x${snapshot.config.numMessages}x${snapshot.config.numActions} model`;

  return (
    <div className="signalling-tool" style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTextBlock}>
          <h1 style={styles.title}>Classic signaling games</h1>
          <div style={styles.modelLine}>{modelLabel}</div>

        </div>
        <div style={styles.statusGroup}>
          <div style={styles.roundChip}>
            <span style={styles.roundLabel}>Round</span>
            <span style={styles.roundValue} data-testid="round-value">
              {snapshot.metrics.round.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      <div className="signal-layout" style={styles.layout}>
        <div className="signal-right" style={styles.rightColumn}>

          <ControlsPanel
            hasPendingChanges={selectedStates !== snapshot.config.numStates || selectedMessages !== snapshot.config.numMessages || selectedActions !== snapshot.config.numActions || seedInput !== snapshot.config.seed.toString()}
            numStates={selectedStates}
            numMessages={selectedMessages}
            numActions={selectedActions}
            errorMessage={errorMessage}
            isPlaying={playback.isPlaying}
            isBusy={animationsEnabled && animation.phase !== 'idle'}
            speed={speed}
            animationsEnabled={animationsEnabled}
            onPlayPause={handlePlayPause}
            onStepOne={handleStepOne}
            onReset={handleReset}
            onSpeedChange={(nextSpeed) => {
              pauseAndClear();
              setSpeed(nextSpeed);
            }}
            onStatesChange={(value) => {
              setSelectedStates(value);
              setSelectedActions((currentValue) => Math.max(currentValue, value));
            }}
            onMessagesChange={(value) => setSelectedMessages(value)}
            onActionsChange={(value) => setSelectedActions(value)}
            onApplyConfig={applyConfiguration}
            onAnimationsChange={(value) => {
              pauseAndClear();
              setAnimationsEnabled(value);
            }}
          />
        </div>
        <div className="signal-left" style={styles.leftColumn}>
          <SignalDiagram
            config={snapshot.config}
            policies={snapshot.policies}
            animation={animation}
            showProbabilityLabels={debugMode && showProbabilityLabels}
          />

          <div className="signal-charts" style={styles.chartGrid}>
            <section style={styles.card}>
              <h3 style={styles.cardTitle}>Success</h3>
              <LineChart
                title="Success"
                rounds={rounds}
                yMin={0}
                yMax={1}
                formatTick={(value) => `${Math.round(value * 100)}%`}
                dataTestId="success-chart"
                series={[
                  {
                    id: 'cumulative',
                    label: 'Cumulative',
                    color: '#111111',
                    values: visibleHistory.map((point) => point.cumulativeSuccessRate),
                  },
                  {
                    id: 'rolling',
                    label: 'Rolling',
                    color: '#0f766e',
                    values: visibleHistory.map((point) => point.rollingSuccessRate),
                  },
                ]}
              />
              <Legend
                entries={[
                  ['Cumulative', '#111111'],
                  ['Rolling', '#0f766e'],
                ]}
              />
            </section>

            <section style={styles.card}>
              <h3 style={styles.cardTitle}>Information</h3>
              <LineChart
                title="Information"
                rounds={rounds}
                yMin={0}
                yMax={Math.max(1, snapshot.metrics.maxMutualInformationBits)}
                dataTestId="information-chart"
                series={[
                  {
                    id: 'mutual-information',
                    label: 'Mutual information',
                    color: '#374151',
                    values: visibleHistory.map((point) => point.mutualInformationBits),
                  },
                ]}
              />
              <Legend entries={[['Mutual information', '#374151']]} />
            </section>
          </div>
          <MetricsPanel metrics={snapshot.metrics} />
        </div>
      </div>

      <section style={styles.debugSection}>
        <div style={styles.debugHeader}>
          <h2 style={styles.debugTitle}>Advanced controls</h2>
          <button
            type="button"
            aria-expanded={debugMode}
            onClick={() => setDebugMode((currentValue) => !currentValue)}
            style={styles.debugToggle}
          >
            {debugMode ? 'Hide' : 'Show'}
          </button>
        </div>

        {debugMode ? (
          <div style={styles.debugContent}>
            <div style={styles.debugGrid}>
              <section style={styles.debugCard}>
                <h3 style={styles.debugCardTitle}>Seed and display</h3>
                <label style={styles.debugLabel}>
                  Seed
                  <input
                    value={seedInput}
                    onChange={(event) => setSeedInput(event.target.value)}
                    style={styles.debugInput}
                    inputMode="numeric"
                    data-testid="seed-input"
                  />
                </label>
                <label style={styles.debugCheckboxRow}>
                  <input
                    type="checkbox"
                    checked={showProbabilityLabels}
                    onChange={(event) => setShowProbabilityLabels(event.target.checked)}
                  />
                  Show exact probability labels on edges
                </label>
                <button type="button" onClick={applyConfiguration} style={styles.debugButton}>
                  Apply all settings and restart
                </button>
              </section>

              <DebugDiagnostics metrics={snapshot.metrics} />
            </div>

            <div style={styles.tableGrid}>
              <MatrixTable
                title="Sender weights"
                rowLabels={stateLabels}
                columnLabels={messageLabels}
                matrix={snapshot.state.senderWeights}
                formatter={(value) => value.toFixed(2)}
                defaultOpen
              />
              <MatrixTable
                title="Receiver weights"
                rowLabels={messageLabels}
                columnLabels={actionLabels}
                matrix={snapshot.state.receiverWeights}
                formatter={(value) => value.toFixed(2)}
              />
              <MatrixTable
                title="Sender policy"
                rowLabels={stateLabels}
                columnLabels={messageLabels}
                matrix={snapshot.policies.senderPolicy}
              />
              <MatrixTable
                title="Receiver policy"
                rowLabels={messageLabels}
                columnLabels={actionLabels}
                matrix={snapshot.policies.receiverPolicy}
              />
            </div>
          </div>
        ) : null}
      </section>
      <details className="tool-methodology"><summary>Model and methodology</summary>
        <h3>Learning rule</h3><p>Each round draws a state uniformly. A sender observes it and samples a message; a receiver sees only the message and samples an action. A round succeeds when the action matches the state. Successful choices each receive one additional unit of reinforcement; unsuccessful rounds leave the weights unchanged. Choices are sampled in proportion to their weights, which initially equal one.</p>
        <h3>Reading the results</h3><p>Cumulative success covers all completed rounds. Rolling success covers the latest 200 rounds, or all rounds so far if fewer. State-to-message information, measured in bits, describes the dependence between states and messages under the current sender policy. It does not itself measure whether the receiver acts correctly. The regime and stability indicators use thresholds on the current policies; they do not prove convergence or lasting equilibrium.</p>
        <h3>Assumptions and limitations</h3><p>This finite reinforcement model illustrates coordination under a particular learning rule, rather than the full complexity of human language. Different seeds and model sizes can give different outcomes. Restart with settings clears all learning and results, using the displayed seed; New random run starts the active model with a fresh seed. The seed and learned weights are available under Advanced controls.</p>
        <h3>Reference</h3><div style={styles.referenceLine}>
            <span style={styles.referencePrefix}>Based on the models in</span>
            <cite style={styles.referenceText}>
              <a
                href={SKYRMS_REFERENCE_URL}
                target="_blank"
                rel="noreferrer"
                style={styles.referenceLink}
              >
                {SKYRMS_REFERENCE}
              </a>
            </cite>
          </div>
      </details>
    </div>
  );
}

function DebugDiagnostics({
  metrics,
}: {
  metrics: SignalingMetrics;
}): React.ReactElement {
  return (
    <section style={styles.debugCard}>
      <h3 style={styles.debugCardTitle}>Diagnostics</h3>
      <div style={styles.debugMetricList}>
        <div style={styles.debugMetricRow}>
          <span>Expected success</span>
          <strong>{metrics.expectedSuccessRate.toFixed(3)}</strong>
        </div>
        <div style={styles.debugMetricRow}>
          <span>Normalized MI</span>
          <strong>
            {metrics.normalizedMutualInformation === null
              ? 'N/A'
              : metrics.normalizedMutualInformation.toFixed(3)}
          </strong>
        </div>
        <div style={styles.debugMetricRow}>
          <span>Total successes</span>
          <strong>{metrics.totalSuccesses.toLocaleString()}</strong>
        </div>
        <div style={styles.debugMetricRow}>
          <span>Approximate stable signalling</span>
          <strong>{metrics.stableSignalingSystem ? 'yes' : 'no'}</strong>
        </div>
      </div>
      <div style={styles.greedyList}>
        {metrics.greedyDiagnostic.senderMessageByState.map((messageIndex, stateIndex) => (
          <div key={`greedy-${stateIndex}`} style={styles.greedyRow}>
            <span style={styles.greedyCode}>
              {`S${stateIndex} -> M${messageIndex} -> A${metrics.greedyDiagnostic.composedActionByState[stateIndex]}`}
            </span>
            <span>
              {metrics.greedyDiagnostic.composedActionByState[stateIndex] === stateIndex
                ? 'correct'
                : 'mismatch'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Legend({
  entries,
}: {
  entries: [string, string][];
}): React.ReactElement {
  return (
    <div style={styles.legend}>
      {entries.map(([label, color]) => (
        <div key={label} style={styles.legendEntry}>
          <span style={{ ...styles.legendSwatch, background: color }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100%',
    padding: '24px 28px 36px',
    color: '#111111',
    fontFamily: 'var(--tool-sans, system-ui, sans-serif)',
    background: '#ffffff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  headerTextBlock: {
    display: 'grid',
    gap: 6,
  },
  title: {
    fontFamily: "var(--tool-serif, Georgia, serif)",
    margin: 0,
    fontSize: 32,
    fontWeight: 400,
    lineHeight: 1.05,
  },
  modelLine: {
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none',
    color: '#374151',
  },
  referenceLine: {
    display: 'flex',
    gap: 8,
    alignItems: 'baseline',
    flexWrap: 'wrap',
    maxWidth: 760,
  },
  referencePrefix: {
    fontSize: 18,
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none',
    color: '#6b7280',
  },
  referenceText: {
    fontSize: 18,
    lineHeight: 1.5,
    fontStyle: 'normal',
    color: '#374151',
  },
  referenceLink: {
    color: 'inherit',
    textDecoration: 'underline',
    textDecorationColor: '#9ca3af',
    textUnderlineOffset: '0.16em',
  },
  referenceWork: {
    fontFamily: 'var(--tool-serif, Georgia, serif)',
  },
  statusGroup: {
    display: 'flex',
    gap: 12,
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  roundChip: { display: "flex", gap: 8, alignItems: "baseline", padding: "8px 0" },
  roundLabel: {
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none',
    color: '#5b6470',
  },
  roundValue: {
    fontSize: 24,
    fontWeight: 400,
    color: '#111111',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 320px',
    gap: 18,
    alignItems: 'start',
  },
  leftColumn: {
    display: 'grid',
    gap: 16,
  },
  rightColumn: {
    display: 'grid',
    gap: 16,
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
  },
  card: {
    padding: "12px 0",
    borderTop: "1px solid #ccc",
    background: "#ffffff",
  },
  cardTitle: {
    fontFamily: "var(--tool-serif, Georgia, serif)",
    margin: '0 0 10px',
    fontSize: 21,
    fontWeight: 400,
    color: '#111111',
  },
  legend: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
  },
  legendEntry: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  debugSection: {
    marginTop: 22,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 18,
  },
  debugHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  debugTitle: {
    fontFamily: "var(--tool-serif, Georgia, serif)",
    margin: 0,
    fontSize: 21,
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none',
    color: '#5b6470',
  },
  debugToggle: {
    border: '1px solid #d6dce5',
    borderRadius: 2,
    padding: '8px 12px',
    fontSize: 14,
    fontWeight: 400,
    color: '#111111',
    background: '#ffffff',
    cursor: 'pointer',
  },
  debugContent: {
    display: 'grid',
    gap: 16,
  },
  debugGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  debugCard: {
    padding: "12px 0",
    borderTop: "1px solid #ccc",
    background: "#ffffff",
  },
  debugCardTitle: {
    fontFamily: "var(--tool-serif, Georgia, serif)",
    margin: '0 0 12px',
    fontSize: 21,
    fontWeight: 400,
    color: '#111111',
  },
  debugLabel: {
    display: 'grid',
    gap: 8,
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none',
    color: '#5b6470',
  },
  debugInput: {
    borderRadius: 2,
    border: '1px solid #d6dce5',
    padding: '10px 12px',
    fontSize: 14,
    background: '#ffffff',
    color: '#111111',
  },
  debugCheckboxRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#111111',
  },
  debugButton: {
    border: '1px solid #d6dce5',
    borderRadius: 2,
    padding: '10px 12px',
    fontSize: 14,
    fontWeight: 400,
    color: '#111111',
    background: '#ffffff',
    cursor: 'pointer',
  },
  debugMetricList: {
    display: 'grid',
    gap: 10,
  },
  debugMetricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    fontSize: 14,
    color: '#111111',
  },
  greedyList: {
    display: 'grid',
    gap: 8,
    marginTop: 14,
  },
  greedyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 2,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    fontSize: 14,
    color: '#111111',
  },
  greedyCode: {
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  },
  tableGrid: {
    display: 'grid',
    gap: 12,
  },
};
