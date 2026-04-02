import React from "react";
import { COMPOSITIONAL_MODEL_OPTIONS } from "../../model/compositionalShared";
import type { CompositionalModelType } from "../../model/compositionalShared";
import type { PlaybackSpeed } from "../types";

export interface CompositionalTraditionalControlsProps {
  modelType: CompositionalModelType;
  modelLabel: string;
  modelDescription: string;
  signalingBiasEnabled: boolean;
  canApplyForgettingNow: boolean;
  forgettingNote: string;
  errorMessage: string | null;
  isPlaying: boolean;
  isBusy: boolean;
  speed: PlaybackSpeed;
  animationsEnabled: boolean;
  onModelTypeChange: (value: CompositionalModelType) => void;
  onSignalingBiasEnabledChange: (value: boolean) => void;
  onApplyConfig: () => void;
  onApplyForgettingNow: () => void;
  onPlayPause: () => void;
  onStepOne: () => void;
  onReset: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onAnimationsChange: (value: boolean) => void;
}

/**
 * Main public controls for the traditional compositional app.
 */
export function CompositionalTraditionalControls({
  modelType,
  modelLabel,
  modelDescription,
  signalingBiasEnabled,
  canApplyForgettingNow,
  forgettingNote,
  errorMessage,
  isPlaying,
  isBusy,
  speed,
  animationsEnabled,
  onModelTypeChange,
  onSignalingBiasEnabledChange,
  onApplyConfig,
  onApplyForgettingNow,
  onPlayPause,
  onStepOne,
  onReset,
  onSpeedChange,
  onAnimationsChange,
}: CompositionalTraditionalControlsProps): React.ReactElement {
  return (
    <div style={styles.column}>
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <h3 style={styles.sectionTitle}>Model</h3>
          <span
            style={styles.modelBadge}
          >{`4x(2+2)x4 ${modelLabel} model`}</span>
        </div>
        <label style={styles.label}>
          Receiver Model
          <select
            value={modelType}
            onChange={(event) =>
              onModelTypeChange(event.target.value as CompositionalModelType)
            }
            style={styles.select}
            data-testid="compositional-model-select"
          >
            {COMPOSITIONAL_MODEL_OPTIONS.map((option) => (
              <option key={option.type} value={option.type}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div style={styles.modelDescription}>{modelDescription}</div>
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={signalingBiasEnabled}
            onChange={(event) =>
              onSignalingBiasEnabledChange(event.target.checked)
            }
            data-testid="compositional-signaling-bias-checkbox"
          />
          Signaling Bias
        </label>
        <div style={styles.helpText}>
          Applies a weak symmetry-preserving learning bias to favour learning
          signalling systems.
        </div>
        <button
          type="button"
          onClick={onApplyConfig}
          style={styles.primaryButton}
        >
          Apply config
        </button>
        {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}
      </section>

      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Playback</h3>
        <div style={styles.buttonRow}>
          <button
            type="button"
            onClick={onPlayPause}
            style={styles.primaryButton}
            data-testid="compositional-play-pause-button"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={onStepOne}
            style={styles.secondaryButton}
            disabled={isBusy}
          >
            Step
          </button>
          <button
            type="button"
            onClick={onReset}
            style={styles.secondaryButton}
          >
            Reset
          </button>
        </div>
        <div style={styles.speedRow}>
          {(["slow", "normal", "fast"] as PlaybackSpeed[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSpeedChange(option)}
              style={{
                ...styles.speedButton,
                ...(speed === option ? styles.speedButtonActive : null),
              }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={animationsEnabled}
            onChange={(event) => onAnimationsChange(event.target.checked)}
          />
          Animate rounds
        </label>
        <button
          type="button"
          onClick={onApplyForgettingNow}
          style={{
            ...styles.primaryButton,
            ...styles.forgettingButton,
            ...(!canApplyForgettingNow ? styles.buttonDisabled : null),
          }}
          disabled={!canApplyForgettingNow}
          data-testid="compositional-apply-forgetting-button"
        >
          Apply Forgetting
        </button>
        <div style={styles.helpText}>{forgettingNote}</div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  column: {
    display: "grid",
    gap: 14,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    background: "#ffffff",
    border: "1px solid #d6dce5",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#111111",
  },
  modelBadge: {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    color: "#111111",
    background: "#f3f5f8",
    border: "1px solid #d6dce5",
  },
  label: {
    display: "grid",
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    color: "#4b5563",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    border: "1px solid #d6dce5",
    padding: "10px 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#111111",
  },
  select: {
    borderRadius: 12,
    border: "1px solid #d6dce5",
    padding: "10px 12px",
    fontSize: 14,
    background: "#ffffff",
    color: "#111111",
  },
  modelDescription: {
    marginTop: -4,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 1.45,
    color: "#4b5563",
  },
  helpText: {
    marginTop: -4,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 1.45,
    color: "#4b5563",
  },
  buttonRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  primaryButton: {
    border: "1px solid #111111",
    borderRadius: 12,
    padding: "11px 14px",
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    background: "#111111",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #d6dce5",
    borderRadius: 12,
    padding: "11px 14px",
    fontSize: 14,
    fontWeight: 700,
    color: "#111111",
    background: "#ffffff",
    cursor: "pointer",
  },
  forgettingButton: {
    marginTop: 6,
    background: "#8a1c1c",
    border: "1px solid #8a1c1c",
  },
  buttonDisabled: {
    cursor: "not-allowed",
    opacity: 0.72,
  },
  speedRow: {
    display: "flex",
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  speedButton: {
    flex: 1,
    border: "1px solid #d6dce5",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    background: "#ffffff",
    cursor: "pointer",
  },
  speedButtonActive: {
    background: "#111111",
    color: "#ffffff",
    border: "1px solid #111111",
  },
  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    fontSize: 14,
    color: "#111111",
  },
  error: {
    marginTop: 12,
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 700,
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
  },
};
