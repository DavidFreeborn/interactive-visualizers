/**
 * Scientific status badge component.
 *
 * REQUIRED: Every visualizer must display this badge prominently.
 */

import React from 'react';

export type StatusType =
  | 'exact-model'
  | 'standard-toy-model'
  | 'conceptual-analogy'
  | 'theorem-intuition';

export interface ScientificStatusProps {
  status: StatusType;
}

const STATUS_LABELS: Record<StatusType, string> = {
  'exact-model': 'Exact model',
  'standard-toy-model': 'Standard toy model',
  'conceptual-analogy': 'Conceptual analogy',
  'theorem-intuition': 'Theorem intuition builder',
};

const STATUS_COLORS: Record<StatusType, { bg: string; text: string }> = {
  'exact-model': { bg: '#e3f2fd', text: '#1565c0' },
  'standard-toy-model': { bg: '#f3e5f5', text: '#7b1fa2' },
  'conceptual-analogy': { bg: '#fff3e0', text: '#ef6c00' },
  'theorem-intuition': { bg: '#e8f5e9', text: '#2e7d32' },
};

export const ScientificStatus: React.FC<ScientificStatusProps> = ({
  status,
}) => {
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <span
      className="scientific-status"
      style={{
        ...styles.badge,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {label}
    </span>
  );
};

const styles: Record<string, React.CSSProperties> = {
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};
