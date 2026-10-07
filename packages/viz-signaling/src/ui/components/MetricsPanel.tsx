import React from 'react';
import type { EquilibriumDiagnostic, SignalingMetrics } from '../../model/types';

export interface MetricsPanelProps {
  metrics: SignalingMetrics;
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatBits(value: number): string {
  return `${value.toFixed(3)} bits`;
}

function regimeAccent(kind: EquilibriumDiagnostic['kind']): string {
  switch (kind) {
    case 'signalling-equilibrium':
      return '#166534';
    case 'pooling-equilibrium':
      return '#a16207';
    default:
      return '#4b5563';
  }
}

/**
 * Main non-debug metrics and regime summary for the signaling game.
 */
export function MetricsPanel({ metrics }: MetricsPanelProps): React.ReactElement {
  return (
    <div style={styles.stack}>
      <div style={styles.grid}>
        <MetricCard label="Cumulative success" value={formatPercentage(metrics.cumulativeSuccessRate)} />
        <MetricCard label="Rolling success" value={formatPercentage(metrics.rollingSuccessRate)} />
        <MetricCard label="State-to-message information" value={formatBits(metrics.mutualInformationBits)} />
      </div>

      <section
        style={{
          ...styles.regimeCard,
          borderLeft: `4px solid ${regimeAccent(metrics.equilibriumDiagnostic.kind)}`,
        }}
      >
        <div style={styles.label}>Approximate regime</div>
        <div style={styles.regimeValue}>{metrics.equilibriumDiagnostic.label}</div>
        <p style={styles.regimeDetail}>{metrics.equilibriumDiagnostic.detail}</p>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <section style={styles.card}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  stack: {
    display: 'grid',
    gap: 12,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
  },
  card: { padding: "12px 0", borderTop: "1px solid #ccc" },
  regimeCard: { padding: "4px 12px" },
  label: {
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none',
    color: '#5b6470',
  },
  value: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 400,
    color: '#111111',
  },
  regimeValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 400,
    color: '#111111',
    fontFamily: 'var(--tool-serif, Georgia, serif)',
  },
  regimeDetail: {
    margin: '8px 0 0',
    fontSize: 14,
    lineHeight: 1.5,
    color: '#4b5563',
  },
};
