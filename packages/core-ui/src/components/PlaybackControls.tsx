/**
 * Playback controls component (play/pause, speed, step).
 */

import React from 'react';

export interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: number;
  stepsPerFrame: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onStepsPerFrameChange: (steps: number) => void;
  onReset: () => void;
}

const SPEEDS = [0.5, 1, 2, 5, 10];
const STEPS_OPTIONS = [1, 10, 50, 100, 500];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  speed,
  stepsPerFrame,
  onPlay,
  onPause,
  onStep,
  onSpeedChange,
  onStepsPerFrameChange,
  onReset,
}) => {
  return (
    <div className="playback-controls" style={styles.container}>
      <div style={styles.row}>
        <button
          onClick={isPlaying ? onPause : onPlay}
          style={styles.button}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={onStep}
          disabled={isPlaying}
          style={styles.button}
          aria-label="Step"
        >
          Step
        </button>

        <button onClick={onReset} style={styles.button} aria-label="Reset">
          Reset
        </button>
      </div>

      <div style={styles.row}>
        <label style={styles.label}>
          Speed:
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            style={styles.select}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Steps/frame:
          <select
            value={stepsPerFrame}
            onChange={(e) => onStepsPerFrameChange(Number(e.target.value))}
            style={styles.select}
          >
            {STEPS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  row: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
  },
  select: {
    padding: '4px',
    fontSize: '14px',
  },
};
