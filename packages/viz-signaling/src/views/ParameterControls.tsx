/**
 * Parameter controls for the signaling game.
 */

import React from 'react';
import type { SignalingGameConfig } from '../model/types';
import { PRESETS, type Preset } from '../presets';

export interface ParameterControlsProps {
  config: SignalingGameConfig;
  onConfigChange: (config: Partial<SignalingGameConfig>) => void;
  disabled?: boolean;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  config,
  onConfigChange,
  disabled = false,
}) => {
  const handlePresetChange = (presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (preset) {
      onConfigChange(preset.config);
    }
  };

  return (
    <div className="parameter-controls" style={styles.container}>
      <h4 style={styles.title}>Parameters</h4>

      <div style={styles.row}>
        <label style={styles.label}>
          Preset:
          <select
            style={styles.select}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">-- Select Preset --</option>
            {PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={styles.row}>
        <label style={styles.label}>
          Seed:
          <input
            type="number"
            value={config.seed}
            onChange={(e) => onConfigChange({ seed: Number(e.target.value) })}
            style={styles.input}
            disabled={disabled}
          />
        </label>
      </div>

      <div style={styles.row}>
        <label style={styles.label}>
          Replacement Turn:
          <input
            type="number"
            value={config.replacementTurn}
            onChange={(e) =>
              onConfigChange({ replacementTurn: Number(e.target.value) })
            }
            min={0}
            step={1000}
            style={styles.input}
            disabled={disabled}
          />
        </label>
        <span style={styles.hint}>0 = no replacement</span>
      </div>

      <div style={styles.info}>
        <strong>Current config:</strong>
        <ul style={styles.list}>
          <li>States/Actions: {config.numStates}</li>
          <li>Senders: {config.numSenders}</li>
          <li>Messages/sender: {config.messagesPerSender}</li>
          <li>Receiver: {config.receiverType}</li>
        </ul>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  input: {
    width: '80px',
    padding: '4px 8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  select: {
    padding: '4px 8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
  info: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#666',
  },
  list: {
    margin: '4px 0 0 0',
    paddingLeft: '20px',
  },
};
