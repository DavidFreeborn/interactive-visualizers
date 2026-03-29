/**
 * Control panel for manifold learning parameters.
 */

import React from 'react';
import type { ManifoldConfig, DatasetType, AlgorithmType } from '../model/types';
import { PRESETS } from '../presets';
import { CONTENT } from '../content';

export interface ManifoldControlsProps {
  config: ManifoldConfig;
  onConfigChange: (config: Partial<ManifoldConfig>) => void;
  onRunEmbedding: () => void;
  onReset: () => void;
  isEmbedded: boolean;
  disabled?: boolean;
}

const DATASETS: { value: DatasetType; label: string }[] = [
  { value: 'swiss-roll', label: 'Swiss Roll' },
  { value: 's-curve', label: 'S-Curve' },
  { value: 'circles', label: 'Circles' },
];

const ALGORITHMS: { value: AlgorithmType; label: string }[] = [
  { value: 'pca', label: 'PCA' },
  { value: 'isomap', label: 'Isomap' },
];

export const ManifoldControls: React.FC<ManifoldControlsProps> = ({
  config,
  onConfigChange,
  onRunEmbedding,
  onReset,
  isEmbedded,
  disabled = false,
}) => {
  const handlePresetChange = (presetName: string) => {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (preset) {
      onConfigChange(preset.config);
    }
  };

  return (
    <div className="manifold-controls" style={styles.container}>
      <h4 style={styles.title}>Parameters</h4>

      {/* Preset */}
      <div style={styles.row}>
        <label style={styles.label}>
          Preset:
          <select
            style={styles.select}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">-- Select --</option>
            {PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Dataset */}
      <div style={styles.row}>
        <label style={styles.label}>
          Dataset:
          <select
            value={config.dataset}
            onChange={(e) =>
              onConfigChange({ dataset: e.target.value as DatasetType })
            }
            style={styles.select}
            disabled={disabled}
          >
            {DATASETS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Samples */}
      <div style={styles.row}>
        <label style={styles.label}>
          Samples:
          <input
            type="number"
            value={config.numSamples}
            onChange={(e) =>
              onConfigChange({ numSamples: Number(e.target.value) })
            }
            min={10}
            max={2000}
            step={50}
            style={styles.input}
            disabled={disabled}
          />
        </label>
      </div>

      {/* Noise */}
      <div style={styles.row}>
        <label style={styles.label}>
          Noise:
          <input
            type="number"
            value={config.noise}
            onChange={(e) => onConfigChange({ noise: Number(e.target.value) })}
            min={0}
            max={2}
            step={0.1}
            style={styles.input}
            disabled={disabled}
          />
        </label>
      </div>

      {/* Algorithm */}
      <div style={styles.row}>
        <label style={styles.label}>
          Algorithm:
          <select
            value={config.algorithm}
            onChange={(e) =>
              onConfigChange({ algorithm: e.target.value as AlgorithmType })
            }
            style={styles.select}
            disabled={disabled}
          >
            {ALGORITHMS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Neighbors (for Isomap) */}
      {config.algorithm === 'isomap' && (
        <div style={styles.row}>
          <label style={styles.label}>
            k-Neighbors:
            <input
              type="number"
              value={config.numNeighbors}
              onChange={(e) =>
                onConfigChange({ numNeighbors: Number(e.target.value) })
              }
              min={2}
              max={50}
              style={styles.input}
              disabled={disabled}
            />
          </label>
        </div>
      )}

      {/* Seed */}
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

      {/* Buttons */}
      <div style={styles.buttons}>
        <button onClick={onRunEmbedding} style={styles.button} disabled={disabled}>
          {isEmbedded ? 'Re-run Embedding' : 'Run Embedding'}
        </button>
        <button onClick={onReset} style={styles.button} disabled={disabled}>
          Reset
        </button>
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
    marginBottom: '8px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '14px',
    gap: '8px',
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
  buttons: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  button: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
  },
};
