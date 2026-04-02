import React from 'react';
import type {
  CompositionalForgettingSnapshot,
  CompositionalMetrics,
} from '../../model/compositionalShared';

export interface CompositionalTraditionalMetricsPanelProps {
  metrics: CompositionalMetrics;
  forgetting: CompositionalForgettingSnapshot;
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatBits(value: number): string {
  return `${value.toFixed(3)} bits`;
}

function formatNullableBits(value: number | null): string {
  return value === null ? '-' : formatBits(value);
}

function regimeAccent(kind: CompositionalMetrics['approximateRegime']['kind']): string {
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
 * Main public metrics panel for the traditional compositional game.
 */
export function CompositionalTraditionalMetricsPanel({
  metrics,
  forgetting,
}: CompositionalTraditionalMetricsPanelProps): React.ReactElement {
  return (
    <div style={styles.stack}>
      <div style={styles.grid}>
        <MetricCard label="Cumulative Success" value={formatPercentage(metrics.cumulativeSuccessRate)} />
        <MetricCard label="Rolling Success" value={formatPercentage(metrics.rollingSuccessRate)} />
        <MetricCard
          label="Mutual information"
          value={formatBits(metrics.jointMutualInformationBits)}
        />
        <MetricCard
          label="Information lost"
          value={formatNullableBits(forgetting.diagnostics.informationLostBits)}
        />
        <MetricCard
          label="Peak information lost"
          value={formatNullableBits(forgetting.diagnostics.peakInformationLostBits)}
        />
      </div>
      {forgetting.enabled ? (
        <p style={styles.note}>
          Forgetting loss is measured against the pre-forgetting peak
          signal-to-action information.
        </p>
      ) : null}

      <section
        style={{
          ...styles.regimeCard,
          borderLeft: `4px solid ${regimeAccent(metrics.approximateRegime.kind)}`,
        }}
      >
        <div style={styles.label}>Approximate Regime</div>
        <div style={styles.regimeValue}>{metrics.approximateRegime.label}</div>
        <p style={styles.regimeDetail}>{metrics.approximateRegime.detail}</p>
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  card: {
    borderRadius: 18,
    padding: '16px 18px',
    background: '#ffffff',
    border: '1px solid #d6dce5',
  },
  regimeCard: {
    borderRadius: 18,
    padding: '16px 18px',
    background: '#ffffff',
    borderTop: '1px solid #d6dce5',
    borderRight: '1px solid #d6dce5',
    borderBottom: '1px solid #d6dce5',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#5b6470',
  },
  value: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 700,
    color: '#111111',
  },
  regimeValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 700,
    color: '#111111',
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
  },
  regimeDetail: {
    margin: '8px 0 0',
    fontSize: 13,
    lineHeight: 1.5,
    color: '#4b5563',
  },
  note: {
    margin: '-2px 2px 0',
    fontSize: 12,
    lineHeight: 1.45,
    color: '#4b5563',
  },
};
