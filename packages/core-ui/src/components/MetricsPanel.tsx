/**
 * Metrics display panel.
 */

import React from 'react';

export interface MetricDisplay {
  label: string;
  value: string | number;
  unit?: string;
  tooltip?: string;
}

export interface MetricsPanelProps {
  title?: string;
  metrics: MetricDisplay[];
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  title = 'Metrics',
  metrics,
}) => {
  return (
    <div className="metrics-panel" style={styles.container}>
      {title && <h3 style={styles.title}>{title}</h3>}
      <div style={styles.grid}>
        {metrics.map((metric, idx) => (
          <div key={idx} style={styles.metric} title={metric.tooltip}>
            <span style={styles.label}>{metric.label}</span>
            <span style={styles.value}>
              {typeof metric.value === 'number'
                ? metric.value.toFixed(3)
                : metric.value}
              {metric.unit && (
                <span style={styles.unit}> {metric.unit}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    fontSize: '18px',
    fontWeight: 500,
    fontFamily: 'monospace',
  },
  unit: {
    fontSize: '12px',
    color: '#888',
  },
};
