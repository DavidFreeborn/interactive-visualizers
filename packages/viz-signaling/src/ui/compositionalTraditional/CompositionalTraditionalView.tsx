import '../responsive.css';
import React, { startTransition, useEffect, useRef, useState } from "react";
import { COMPOSITIONAL_MODEL_OPTIONS } from "../../model/compositionalShared";
import type {
  CompositionalForgettingSnapshot,
  CompositionalHistoryPoint,
  CompositionalMetrics,
  CompositionalModelType,
} from "../../model/compositionalShared";
import type { CompositionalMinimalistState } from "../../model/compositionalMinimalist";
import type { CompositionalGeneralistState } from "../../model/compositionalGeneralist";
import { CompositionalRunner } from "../../sim/CompositionalRunner";
import { LineChart } from "../components/LineChart";
import { MatrixTable } from "../components/MatrixTable";
import { usePlayback } from "../hooks/usePlayback";
import { SPEED_PRESETS } from "../types";
import type { PlaybackSpeed } from "../types";
import { createRandomSeed } from "../createRandomSeed";
import { CompositionalTraditionalControls } from "./CompositionalTraditionalControls";
import { CompositionalTraditionalDiagram } from "./CompositionalTraditionalDiagram";
import { CompositionalTraditionalMetricsPanel } from "./CompositionalTraditionalMetricsPanel";
import { PairMatrixTable } from "./PairMatrixTable";
import type { TraditionalRoundAnimationState } from "./types";

export interface CompositionalTraditionalViewProps {
  initialSeed?: number;
  initialModelType?: CompositionalModelType;
}

const IDLE_ANIMATION: TraditionalRoundAnimationState = {
  phase: "idle",
  progress: 0,
  event: null,
};

const MAX_CHART_POINTS = 400;
const STATE_LABELS = ["S0", "S1", "S2", "S3"];
const SENDER_A_LABELS = ["A0", "A1"];
const SENDER_B_LABELS = ["B0", "B1"];
const ACTION_CODES = ["a0", "a1", "a2", "a3"];
const PUBLIC_STATE_LABELS = ["red dress", "blue dress", "red suit", "blue suit"];
const PUBLIC_ACTION_LABELS = ["red dress", "blue dress", "red suit", "blue suit"];
const PUBLIC_FORGETTING_CONFIG = {
  enabled: true,
  triggerMode: "manual" as const,
  replacedSender: "b" as const,
  replacedMessageIndex: 0,
};
type ViewSnapshot = ReturnType<CompositionalRunner["getSnapshot"]>;

function sampleHistory(
  history: readonly CompositionalHistoryPoint[],
  maxPoints: number,
): CompositionalHistoryPoint[] {
  if (history.length <= maxPoints) {
    return [...history];
  }

  const sampledIndices = new Set<number>();
  for (let pointIndex = 0; pointIndex < maxPoints; pointIndex += 1) {
    const historyIndex = Math.round(
      (pointIndex * (history.length - 1)) / (maxPoints - 1),
    );
    sampledIndices.add(historyIndex);
  }

  return [...sampledIndices]
    .sort((left, right) => left - right)
    .map((index) => history[index]);
}

function derivePublicLabels(_forgetting: CompositionalForgettingSnapshot): { stateLabels: string[]; actionLabels: string[] } {
  return {stateLabels: [...PUBLIC_STATE_LABELS], actionLabels: [...PUBLIC_ACTION_LABELS]};
}

function deriveForgettingNote(
  forgetting: CompositionalForgettingSnapshot,
): string {
  if (
    forgetting.hasTriggered &&
    forgetting.replacedSender === "b" &&
    forgetting.replacedMessageIndex === 0
  ) {
    return "Sender B’s B0 was replaced with a new message.";
  }

  return "Replaces Sender B’s B0 with a new message; states and actions stay the same.";
}

function shouldAnimateRound(snapshot: ViewSnapshot): boolean {
  return !(
    snapshot.forgetting.hasTriggered &&
    snapshot.forgetting.triggeredRound !== null &&
    snapshot.lastRoundEvent?.round === snapshot.forgetting.triggeredRound
  );
}

/**
 * Public-facing compositional signaling-games view.
 */
export function CompositionalTraditionalView({
  initialSeed,
  initialModelType,
}: CompositionalTraditionalViewProps): React.ReactElement {
  const runnerRef = useRef(
    new CompositionalRunner({
      seed: initialSeed,
      modelType: initialModelType,
      forgetting: PUBLIC_FORGETTING_CONFIG,
    }),
  );
  const animationRunIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState(() =>
    runnerRef.current.getSnapshot(),
  );
  const [modelTypeInput, setModelTypeInput] = useState(snapshot.modelType);
  const [seedInput, setSeedInput] = useState(snapshot.config.seed.toString());
  const [signalingBiasEnabledInput, setSignalingBiasEnabledInput] = useState(
    snapshot.config.signalingBiasEnabled,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speed, setSpeed] = useState<PlaybackSpeed>("normal");
  const [animationsEnabled, setAnimationsEnabled] = useState(() => !(typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const [debugMode, setDebugMode] = useState(false);
  const [showProbabilityLabels, setShowProbabilityLabels] = useState(false);
  const [animation, setAnimation] =
    useState<TraditionalRoundAnimationState>(IDLE_ANIMATION);

  function commitSnapshot(
    nextSnapshot: ReturnType<CompositionalRunner["getSnapshot"]>,
  ): void {
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
    event: NonNullable<TraditionalRoundAnimationState["event"]>,
    phase: Exclude<TraditionalRoundAnimationState["phase"], "idle">,
    durationMs: number,
    onComplete: () => void,
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

  function startRoundAnimation(
    event: NonNullable<TraditionalRoundAnimationState["event"]>,
  ): void {
    const preset = SPEED_PRESETS[speed];

    if (!animationsEnabled || !preset.animate) {
      setAnimation(IDLE_ANIMATION);
      return;
    }

    clearAnimation();
    const runId = animationRunIdRef.current;

    runAnimationPhase(runId, event, "state", preset.phaseDurationMs, () => {
      runAnimationPhase(runId, event, "senders", preset.phaseDurationMs, () => {
        runAnimationPhase(runId, event, "pair", preset.phaseDurationMs, () => {
          runAnimationPhase(
            runId,
            event,
            "action",
            preset.phaseDurationMs,
            () => {
              setAnimation({ event, phase: "result", progress: 1 });
              animationTimeoutRef.current = window.setTimeout(() => {
                if (runId === animationRunIdRef.current) {
                  setAnimation(IDLE_ANIMATION);
                }
              }, preset.resultHoldMs);
            },
          );
        });
      });
    });
  }

  function executePlaybackStep(): void {
    const preset = SPEED_PRESETS[speed];

    if (!animationsEnabled || !preset.animate) {
      const nextSnapshot =
        preset.batchSize > 1
          ? runnerRef.current.stepMany(preset.batchSize)
          : runnerRef.current.step();
      commitSnapshot(nextSnapshot);
      return;
    }

    const nextSnapshot = runnerRef.current.step();
    commitSnapshot(nextSnapshot);
    if (nextSnapshot.lastRoundEvent && shouldAnimateRound(nextSnapshot)) {
      startRoundAnimation(nextSnapshot.lastRoundEvent);
    }
  }

  const playback = usePlayback({
    intervalMs: SPEED_PRESETS[speed].intervalMs,
    isBlocked: animationsEnabled && animation.phase !== "idle",
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
      setErrorMessage(
        "Seed must be a non-negative integer not exceeding 4294967295.",
      );
      return;
    }

    try {
      const nextSnapshot = runnerRef.current.updateConfig({
        seed: parsedSeed,
        modelType: modelTypeInput,
        signalingBiasEnabled: signalingBiasEnabledInput,
        forgetting: PUBLIC_FORGETTING_CONFIG,
      });
      setErrorMessage(null);
      commitSnapshot(nextSnapshot);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to apply configuration.";
      setErrorMessage(message);
    }
  }

  function handleApplyForgettingNow(): void {
    pauseAndClear();
    setErrorMessage(null);
    commitSnapshot(runnerRef.current.applyForgettingNow());
  }

  function handleModelTypeChange(nextModelType: CompositionalModelType): void {
    setModelTypeInput(nextModelType);
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
    if (nextSnapshot.lastRoundEvent && shouldAnimateRound(nextSnapshot)) {
      startRoundAnimation(nextSnapshot.lastRoundEvent);
    }
  }

  function handleReset(): void {
    setModelTypeInput(snapshot.modelType);
    setSignalingBiasEnabledInput(snapshot.config.signalingBiasEnabled);
    pauseAndClear();
    setErrorMessage(null);
    commitSnapshot(runnerRef.current.updateConfig({ seed: createRandomSeed() }));
  }

  useEffect(() => {
    setSeedInput(snapshot.config.seed.toString());
  }, [snapshot.config.seed]);

  useEffect(() => {
    setSignalingBiasEnabledInput(snapshot.config.signalingBiasEnabled);
  }, [snapshot.config.signalingBiasEnabled]);

  useEffect(() => {
    return () => {
      clearAnimation();
    };
  }, []);

  const visibleHistory = sampleHistory(snapshot.history, MAX_CHART_POINTS);
  const rounds = visibleHistory.map((point) => point.round);
  const currentModel =
    COMPOSITIONAL_MODEL_OPTIONS.find(
      (option) => option.type === snapshot.modelType,
    ) ?? COMPOSITIONAL_MODEL_OPTIONS[0];
  const pendingModel = COMPOSITIONAL_MODEL_OPTIONS.find(option => option.type === modelTypeInput) ?? currentModel;
  const { stateLabels, actionLabels } = derivePublicLabels(snapshot.forgetting);
  const forgettingNote = deriveForgettingNote(snapshot.forgetting);
  const forgettingMarkers =
    snapshot.forgetting.hasTriggered && snapshot.forgetting.triggeredRound !== null
      ? [
          {
            id: "forgetting",
            round: snapshot.forgetting.triggeredRound,
            label: "Forgetting",
            color: "#991b1b",
            dashed: true,
            opacity: 0.9,
          },
        ]
      : [];

  return (
    <div className="signalling-tool" style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTextBlock}>
          <h1 style={styles.title}>Compositional signaling games</h1>
          <div
            style={styles.modelLine}
          >{`4x(2+2)x4 ${currentModel.label} model`}</div>

        </div>
        <div style={styles.statusGroup}>
          <div style={styles.roundChip}>
            <span style={styles.roundLabel}>Round</span>
            <span
              style={styles.roundValue}
              data-testid="compositional-round-value"
            >
              {snapshot.metrics.round.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      <div className="signal-layout" style={styles.layout}>
        <div className="signal-right" style={styles.rightColumn}>

          <CompositionalTraditionalControls
            hasPendingChanges={modelTypeInput !== snapshot.modelType || signalingBiasEnabledInput !== snapshot.config.signalingBiasEnabled || seedInput !== snapshot.config.seed.toString()}
            modelType={modelTypeInput}
            modelLabel={pendingModel.label}
            modelDescription={pendingModel.description}
            signalingBiasEnabled={signalingBiasEnabledInput}
            canApplyForgettingNow={!snapshot.forgetting.hasTriggered}
            forgettingNote={forgettingNote}
            errorMessage={errorMessage}
            isPlaying={playback.isPlaying}
            isBusy={animationsEnabled && animation.phase !== "idle"}
            speed={speed}
            animationsEnabled={animationsEnabled}
            onModelTypeChange={handleModelTypeChange}
            onSignalingBiasEnabledChange={setSignalingBiasEnabledInput}
            onApplyConfig={applyConfiguration}
            onApplyForgettingNow={handleApplyForgettingNow}
            onPlayPause={handlePlayPause}
            onStepOne={handleStepOne}
            onReset={handleReset}
            onSpeedChange={(nextSpeed) => {
              pauseAndClear();
              setSpeed(nextSpeed);
            }}
            onAnimationsChange={(value) => {
              pauseAndClear();
              setAnimationsEnabled(value);
            }}
          />
        </div>
        <div className="signal-left" style={styles.leftColumn}>
          <CompositionalTraditionalDiagram
            config={snapshot.config}
            policies={snapshot.policies}
            animation={animation}
            showProbabilityLabels={debugMode && showProbabilityLabels}
            stateLabels={stateLabels}
            actionLabels={actionLabels}
          />

          <div className="signal-charts" style={styles.chartGrid}>
            <section style={styles.card}>
              <h3 style={styles.cardTitle}>Success</h3>
              <LineChart
                title={`${currentModel.label} compositional success`}
                rounds={rounds}
                yMin={0}
                yMax={1}
                formatTick={(value) => `${Math.round(value * 100)}%`}
                dataTestId="compositional-success-chart"
                verticalMarkers={forgettingMarkers}
                series={[
                  {
                    id: "cumulative",
                    label: "Cumulative",
                    color: "#111111",
                    values: visibleHistory.map(
                      (point) => point.cumulativeSuccessRate,
                    ),
                  },
                  {
                    id: "rolling",
                    label: "Rolling",
                    color: "#0f766e",
                    values: visibleHistory.map(
                      (point) => point.rollingSuccessRate,
                    ),
                  },
                ]}
              />
              <Legend
                entries={[
                  ["Cumulative", "#111111"],
                  ["Rolling", "#0f766e"],
                ]}
              />
            </section>

            <section style={styles.card}>
              <h3 style={styles.cardTitle}>Information</h3>
              <LineChart
                title={`${currentModel.label} compositional mutual information`}
                rounds={rounds}
                yMin={0}
                yMax={2}
                dataTestId="compositional-information-chart"
                verticalMarkers={forgettingMarkers}
                series={[
                  {
                    id: "joint",
                    label: "Mutual information",
                    color: "#111111",
                    values: visibleHistory.map(
                      (point) => point.jointMutualInformationBits,
                    ),
                  },
                ]}
              />
            </section>
          </div>
          <CompositionalTraditionalMetricsPanel
            metrics={snapshot.metrics}
            forgetting={snapshot.forgetting}
          />
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
            {debugMode ? "Hide" : "Show"}
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
                    data-testid="compositional-seed-input"
                  />
                </label>
                <label style={styles.debugCheckboxRow}>
                  <input
                    type="checkbox"
                    checked={showProbabilityLabels}
                    onChange={(event) =>
                      setShowProbabilityLabels(event.target.checked)
                    }
                  />
                  Show exact probability labels on edges
                </label>
                <button
                  type="button"
                  onClick={applyConfiguration}
                  style={styles.debugButton}
                >
                  Apply all settings and restart
                </button>
              </section>
              <TraditionalDebugDiagnostics
                metrics={snapshot.metrics}
                showsTraditionalStructureDiagnostics={
                  currentModel.showsTraditionalStructureDiagnostics
                }
              />
            </div>

            <div style={styles.greedySummaryCard}>
              <h3 style={styles.debugCardTitle}>Greedy Summary</h3>
              <div style={styles.greedyList}>
                {snapshot.metrics.greedyDiagnostic.greedyPairByState.map(
                  ([messageAIndex, messageBIndex], stateIndex) => (
                    <div
                      key={`traditional-greedy-${stateIndex}`}
                      style={styles.greedyRow}
                    >
                      <span style={styles.greedyCode}>
                        {`S${stateIndex} -> A${messageAIndex}, B${messageBIndex} -> action ${snapshot.metrics.greedyDiagnostic.composedActionByState[stateIndex]}`}
                      </span>
                      <span>
                        {snapshot.metrics.greedyDiagnostic
                          .composedActionByState[stateIndex] === stateIndex
                          ? "correct"
                          : "mismatch"}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div style={styles.tableGrid}>
              <MatrixTable
                title="Sender A weights"
                rowLabels={STATE_LABELS}
                columnLabels={SENDER_A_LABELS}
                matrix={snapshot.state.senderAWeights}
                formatter={(value) => value.toFixed(2)}
                defaultOpen
              />
              <MatrixTable
                title="Sender B weights"
                rowLabels={STATE_LABELS}
                columnLabels={SENDER_B_LABELS}
                matrix={snapshot.state.senderBWeights}
                formatter={(value) => value.toFixed(2)}
              />
              {renderReceiverDebugTables(snapshot.modelType, snapshot.state)}
              <MatrixTable
                title="Sender A policy"
                rowLabels={STATE_LABELS}
                columnLabels={SENDER_A_LABELS}
                matrix={snapshot.policies.senderAPolicy}
              />
              <MatrixTable
                title="Sender B policy"
                rowLabels={STATE_LABELS}
                columnLabels={SENDER_B_LABELS}
                matrix={snapshot.policies.senderBPolicy}
              />
              <PairMatrixTable
                title="Receiver pair policy"
                actionLabels={ACTION_CODES}
                pairTensor={snapshot.policies.receiverPairPolicy}
              />
            </div>
          </div>
        ) : null}
      </section>
      <details className="tool-methodology"><summary>Model and methodology</summary>
        <h3>States, messages and actions</h3><p>Four equally likely states combine two binary features. Both senders observe the whole state and independently choose one of two messages. The receiver sees their pair and chooses one of four actions. Correct choices reinforce the sampled sender and receiver associations.</p>
        <h3>Receiver models</h3><p>Traditional learns an action distribution for each message pair. Minimalist learns associations between individual messages and actions, combining their scores through a softmax with temperature 5. Both Generalist variants learn pair associations, individual-message associations and observation counts. They behave identically before message replacement; their replacement rules differ.</p>
        <p>The optional signalling bias changes learning beyond the basic reward update. Traditional and Generalist weaken competing associations after success. Minimalist also uses the stipulated feature structure to favour compatible associations across states and actions. This additional structure matters when interpreting apparent compositional organisation.</p>
        <h3>Message replacement</h3><p>The replacement experiment introduces a new token in place of Sender B’s B0. It does not change the states or correct actions, and B0 need not have acquired any particular meaning. Traditional resets the affected pair associations. Minimalist resets the replaced token’s individual association while retaining the other component. Information-Erasing Generalist initialises affected pairs without learned preferences; Information-Preserving Generalist reconstructs them from evidence for the surviving component. This reconstruction is an application-specific implementation of an independence-style idea for this fixed example.</p>
        <h3>Reading the results</h3><p>State-to-pair information measures how informative messages are about states. The replacement experiment instead measures pair-to-action information. Initial information drop is the pre-replacement peak of that second quantity minus its immediate post-replacement value, clipped at zero. Current information deficit compares the same peak with the current value. These measures are not interchangeable. Rolling success covers the latest 200 rounds, or all rounds so far if fewer.</p>
        <p>Regime and stability indicators are threshold-based diagnostics of the current policies. They do not establish lasting equilibrium, semantic compositionality or human-like understanding. Restart with settings clears all learning, results and the replacement event. New random run uses a fresh seed for the active model.</p>
        <h3>References</h3><div style={styles.referenceLine}>
            <span style={styles.referencePrefix}>Based on the models in</span>
            <cite style={styles.referenceText}>
              <a
                href={currentModel.referenceUrl}
                target="_blank"
                rel="noreferrer"
                style={styles.referenceLink}
              >
                {currentModel.reference}
              </a>
            </cite>
          </div>
        <p>The receiver variants draw on Barrett, Cochran and Skyrms (2020), <a href="https://www.cambridge.org/core/journals/philosophy-of-science/article/abs/on-the-evolution-of-compositional-language/E65AF2A9D2DB2B8E3C8B4AA0C7273592"><cite>On the Evolution of Compositional Language</cite></a>, and Freeborn (2025), <a href="https://link.springer.com/article/10.1007/s11229-025-05184-3"><cite>Compositional Understanding in Signaling Games</cite></a>. The learning bias, softmax temperature and replacement procedures are choices specific to this application.</p>
      </details>
    </div>
  );
}

function renderReceiverDebugTables(
  modelType: CompositionalModelType,
  state: ViewSnapshot["state"],
): React.ReactNode {
  if (modelType === "minimalist") {
    const minimalistState = state as CompositionalMinimalistState;

    return (
      <>
        <MatrixTable
          title="Receiver A atomic weights"
          rowLabels={SENDER_A_LABELS}
          columnLabels={ACTION_CODES}
          matrix={minimalistState.receiverAtomicAWeights}
          formatter={(value) => value.toFixed(2)}
        />
        <MatrixTable
          title="Receiver B atomic weights"
          rowLabels={SENDER_B_LABELS}
          columnLabels={ACTION_CODES}
          matrix={minimalistState.receiverAtomicBWeights}
          formatter={(value) => value.toFixed(2)}
        />
      </>
    );
  }

  if (
    modelType === "information-erasing-generalist" ||
    modelType === "information-preserving-generalist"
  ) {
    const generalistState = state as CompositionalGeneralistState;

    return (
      <>
        <PairMatrixTable
          title="Receiver pair action weights"
          actionLabels={ACTION_CODES}
          pairTensor={generalistState.receiverPairActionWeights}
          formatter={(value) => value.toFixed(2)}
        />
        <MatrixTable
          title="Receiver A atomic action weights"
          rowLabels={SENDER_A_LABELS}
          columnLabels={ACTION_CODES}
          matrix={generalistState.receiverAtomicAActionWeights}
          formatter={(value) => value.toFixed(2)}
        />
        <MatrixTable
          title="Receiver B atomic action weights"
          rowLabels={SENDER_B_LABELS}
          columnLabels={ACTION_CODES}
          matrix={generalistState.receiverAtomicBActionWeights}
          formatter={(value) => value.toFixed(2)}
        />
        <MatrixTable
          title="Receiver A observation counts"
          rowLabels={["Observed"]}
          columnLabels={SENDER_A_LABELS}
          matrix={[generalistState.receiverAObservationWeights]}
          formatter={(value) => value.toFixed(2)}
        />
        <MatrixTable
          title="Receiver B observation counts"
          rowLabels={["Observed"]}
          columnLabels={SENDER_B_LABELS}
          matrix={[generalistState.receiverBObservationWeights]}
          formatter={(value) => value.toFixed(2)}
        />
        <MatrixTable
          title="Receiver pair observation counts"
          rowLabels={SENDER_A_LABELS}
          columnLabels={SENDER_B_LABELS}
          matrix={generalistState.receiverPairObservationWeights}
          formatter={(value) => value.toFixed(2)}
        />
      </>
    );
  }

  const traditionalState = state as ViewSnapshot["state"] & {
    receiverPairWeights: ViewSnapshot["policies"]["receiverPairPolicy"];
  };

  return (
    <PairMatrixTable
      title="Receiver pair weights"
      actionLabels={ACTION_CODES}
      pairTensor={traditionalState.receiverPairWeights}
      formatter={(value) => value.toFixed(2)}
    />
  );
}

function TraditionalDebugDiagnostics({
  metrics,
  showsTraditionalStructureDiagnostics,
}: {
  metrics: CompositionalMetrics;
  showsTraditionalStructureDiagnostics: boolean;
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
          <span>A-message information</span>
          <strong>{`${metrics.senderAMutualInformationBits.toFixed(3)} bits`}</strong>
        </div>
        <div style={styles.debugMetricRow}>
          <span>B-message information</span>
          <strong>{`${metrics.senderBMutualInformationBits.toFixed(3)} bits`}</strong>
        </div>
        <div style={styles.debugMetricRow}>
          <span>Joint mutual information</span>
          <strong>{`${metrics.jointMutualInformationBits.toFixed(3)} bits`}</strong>
        </div>
        <div style={styles.debugMetricRow}>
          <span>Total successes</span>
          <strong>{metrics.totalSuccesses.toLocaleString()}</strong>
        </div>
        {showsTraditionalStructureDiagnostics ? (
          <>
            <div style={styles.debugMetricRow}>
              <span>Strict canonical traditional criterion</span>
              <strong>
                {metrics.traditionalStructuralDiagnostic
                  .stableTraditionalSignalingSystem
                  ? "yes"
                  : "no"}
              </strong>
            </div>
            <div style={styles.debugMetricRow}>
              <span>Sender A garment partition</span>
              <strong>
                {metrics.traditionalStructuralDiagnostic
                  .senderAPartitionsByGarment
                  ? "yes"
                  : "no"}
              </strong>
            </div>
            <div style={styles.debugMetricRow}>
              <span>Sender B colour partition</span>
              <strong>
                {metrics.traditionalStructuralDiagnostic
                  .senderBPartitionsByColour
                  ? "yes"
                  : "no"}
              </strong>
            </div>
          </>
        ) : (
          <div style={styles.debugNote}>
            Traditional structural diagnostics are shown only for the
            Traditional receiver.
          </div>
        )}
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
    minHeight: "100%",
    padding: "24px 28px 36px",
    color: "#111111",
    fontFamily: 'var(--tool-sans, system-ui, sans-serif)',
    background: "#ffffff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 22,
  },
  headerTextBlock: {
    display: "grid",
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
    letterSpacing: "normal",
    textTransform: "none",
    color: "#374151",
  },
  referenceLine: {
    display: "flex",
    gap: 8,
    alignItems: "baseline",
    flexWrap: "wrap",
    maxWidth: 760,
  },
  referencePrefix: {
    fontSize: 18,
    fontWeight: 400,
    letterSpacing: "normal",
    textTransform: "none",
    color: "#6b7280",
  },
  referenceText: {
    fontSize: 18,
    lineHeight: 1.5,
    fontStyle: "normal",
    color: "#374151",
  },
  referenceLink: {
    color: "inherit",
    textDecoration: "underline",
    textDecorationColor: "#9ca3af",
    textUnderlineOffset: "0.16em",
  },
  statusGroup: {
    display: "flex",
    gap: 12,
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  roundChip: { display: "flex", gap: 8, alignItems: "baseline", padding: "8px 0" },
  roundLabel: {
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: "normal",
    textTransform: "none",
    color: "#5b6470",
  },
  roundValue: {
    fontSize: 24,
    fontWeight: 400,
    color: "#111111",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: 18,
    alignItems: "start",
  },
  leftColumn: {
    display: "grid",
    gap: 16,
  },
  rightColumn: {
    display: "grid",
    gap: 16,
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  },
  card: {
    padding: "12px 0",
    borderTop: "1px solid #ccc",
    background: "#ffffff",
  },
  cardTitle: {
    fontFamily: "var(--tool-serif, Georgia, serif)",
    margin: "0 0 10px",
    fontSize: 21,
    fontWeight: 400,
    color: "#111111",
  },
  legend: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
    fontSize: 14,
    color: "#374151",
  },
  legendEntry: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  debugSection: {
    marginTop: 22,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 18,
  },
  debugHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  debugTitle: {
    fontFamily: "var(--tool-serif, Georgia, serif)",
    margin: 0,
    fontSize: 21,
    fontWeight: 400,
    letterSpacing: "normal",
    textTransform: "none",
    color: "#5b6470",
  },
  debugToggle: {
    border: "1px solid #d6dce5",
    borderRadius: 2,
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 400,
    color: "#111111",
    background: "#ffffff",
    cursor: "pointer",
  },
  debugContent: {
    display: "grid",
    gap: 16,
  },
  debugGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 14,
  },
  debugCard: {
    padding: "12px 0",
    borderTop: "1px solid #ccc",
    background: "#ffffff",
  },
  greedySummaryCard: {
    padding: "12px 0",
    borderTop: "1px solid #ccc",
    background: "#ffffff",
  },
  debugCardTitle: {
    fontFamily: "var(--tool-serif, Georgia, serif)",
    margin: "0 0 12px",
    fontSize: 21,
    fontWeight: 400,
    color: "#111111",
  },
  debugLabel: {
    display: "grid",
    gap: 8,
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: "normal",
    textTransform: "none",
    color: "#5b6470",
  },
  debugInput: {
    borderRadius: 2,
    border: "1px solid #d6dce5",
    padding: "10px 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#111111",
  },
  debugCheckboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    fontSize: 14,
    color: "#111111",
  },
  debugButton: {
    border: "1px solid #d6dce5",
    borderRadius: 2,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 400,
    color: "#111111",
    background: "#ffffff",
    cursor: "pointer",
  },
  debugMetricList: {
    display: "grid",
    gap: 10,
  },
  debugMetricRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    fontSize: 14,
    color: "#111111",
  },
  debugNote: {
    fontSize: 14,
    lineHeight: 1.45,
    color: "#4b5563",
  },
  greedyList: {
    display: "grid",
    gap: 10,
  },
  greedyRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    fontSize: 14,
    color: "#111111",
  },
  greedyCode: {
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 14,
  },
};
