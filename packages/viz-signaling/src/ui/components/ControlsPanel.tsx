import React from 'react';
import type { PlaybackSpeed } from '../types';

export interface ControlsPanelProps {
  numStates: number;
  numMessages: number;
  numActions: number;
  errorMessage: string | null;
  isPlaying: boolean;
  isBusy: boolean;
  speed: PlaybackSpeed;
  animationsEnabled: boolean;
  onPlayPause: () => void;
  onStepOne: () => void;
  onReset: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onStatesChange: (value: number) => void;
  onMessagesChange: (value: number) => void;
  onActionsChange: (value: number) => void;
  onApplyConfig: () => void;
  onAnimationsChange: (value: boolean) => void;
}

function range(start: number, endInclusive: number): number[] {
  return Array.from({ length: endInclusive - start + 1 }, (_, index) => start + index);
}

/**
 * Main user-facing controls for model size and playback.
 */
export function ControlsPanel({
  numStates,
  numMessages,
  numActions,
  errorMessage,
  isPlaying,
  isBusy,
  speed,
  animationsEnabled,
  onPlayPause,
  onStepOne,
  onReset,
  onSpeedChange,
  onStatesChange,
  onMessagesChange,
  onActionsChange,
  onApplyConfig,
  onAnimationsChange,
}: ControlsPanelProps): React.ReactElement {
  const actionOptions = range(Math.max(2, numStates), 6);
  const modelLabel = `${numStates}x${numMessages}x${numActions} model`;

  return (
    <div style={styles.column}>
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <h3 style={styles.sectionTitle}>Model</h3>
          <span style={styles.modelBadge}>{modelLabel}</span>
        </div>
        <div style={styles.selectGrid}>
          <label style={styles.label}>
            States
            <select
              value={numStates}
              onChange={(event) => onStatesChange(Number(event.target.value))}
              style={styles.select}
            >
              {range(2, 6).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.label}>
            Messages
            <select
              value={numMessages}
              onChange={(event) => onMessagesChange(Number(event.target.value))}
              style={styles.select}
            >
              {range(2, 6).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.label}>
            Actions
            <select
              value={numActions}
              onChange={(event) => onActionsChange(Number(event.target.value))}
              style={styles.select}
            >
              {actionOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" onClick={onApplyConfig} style={styles.primaryButton}>
          Apply model
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
            data-testid="play-pause-button"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={onStepOne} style={styles.secondaryButton} disabled={isBusy}>
            Step
          </button>
          <button type="button" onClick={onReset} style={styles.secondaryButton}>
            Reset
          </button>
        </div>
        <div style={styles.speedRow}>
          {(['slow', 'normal', 'fast'] as PlaybackSpeed[]).map((option) => (
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
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  column: {
    display: 'grid',
    gap: 14,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    background: '#ffffff',
    border: '1px solid #d6dce5',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#111111',
  },
  modelBadge: {
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 700,
    color: '#111111',
    background: '#f3f5f8',
    border: '1px solid #d6dce5',
  },
  selectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
    marginBottom: 12,
  },
  label: {
    display: 'grid',
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  select: {
    borderRadius: 12,
    border: '1px solid #d6dce5',
    padding: '10px 12px',
    fontSize: 14,
    background: '#ffffff',
    color: '#111111',
  },
  buttonRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  primaryButton: {
    border: '1px solid #111111',
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 14,
    fontWeight: 700,
    color: '#ffffff',
    background: '#111111',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #d6dce5',
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 14,
    fontWeight: 700,
    color: '#111111',
    background: '#ffffff',
    cursor: 'pointer',
  },
  speedRow: {
    display: 'flex',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  speedButton: {
    flex: 1,
    border: '1px solid #d6dce5',
    borderRadius: 999,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
    background: '#ffffff',
    cursor: 'pointer',
  },
  speedButtonActive: {
    background: '#111111',
    color: '#ffffff',
    border: '1px solid #111111',
  },
  checkboxRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    fontSize: 14,
    color: '#111111',
  },
  error: {
    marginTop: 12,
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 13,
    fontWeight: 700,
    color: '#991b1b',
    background: '#fef2f2',
    border: '1px solid #fecaca',
  },
};
