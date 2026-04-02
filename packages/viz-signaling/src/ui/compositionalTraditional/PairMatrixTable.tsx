import React from 'react';
import type { CompositionalForgettingPairReference } from '../../model/compositionalShared';
import type { PairTensor } from '../../model/compositionalTraditional/types';

export interface PairMatrixTableProps {
  title: string;
  actionLabels: string[];
  pairTensor: PairTensor;
  pairReferences?: readonly CompositionalForgettingPairReference[];
  formatter?: (value: number) => string;
  defaultOpen?: boolean;
}

/**
 * Collapsible exact table view for pair-conditioned receiver weights and policies.
 */
export function PairMatrixTable({
  title,
  actionLabels,
  pairTensor,
  pairReferences,
  formatter = (value) => value.toFixed(3),
  defaultOpen = false,
}: PairMatrixTableProps): React.ReactElement {
  const rows =
    pairReferences?.map(({ messageAIndex, messageBIndex }) => ({
      label: `(A${messageAIndex}, B${messageBIndex})`,
      values: pairTensor[messageAIndex][messageBIndex],
    })) ??
    pairTensor.flatMap((rowA, messageAIndex) =>
      rowA.map((rowB, messageBIndex) => ({
        label: `(A${messageAIndex}, B${messageBIndex})`,
        values: rowB,
      })),
    );

  return (
    <details open={defaultOpen} style={styles.details}>
      <summary style={styles.summary}>{title}</summary>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Pair</th>
              {actionLabels.map((label) => (
                <th key={label} style={styles.headerCell}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th style={styles.rowHeader}>{row.label}</th>
                {row.values.map((value, columnIndex) => (
                  <td key={`${row.label}-${columnIndex}`} style={styles.bodyCell}>
                    {formatter(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const styles: Record<string, React.CSSProperties> = {
  details: {
    border: '1px solid rgba(148, 163, 184, 0.35)',
    borderRadius: 18,
    background: 'rgba(255, 255, 255, 0.76)',
    overflow: 'hidden',
  },
  summary: {
    padding: '14px 16px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#0f172a',
    listStyle: 'none',
  },
  tableWrapper: {
    overflowX: 'auto',
    padding: '0 16px 16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 420,
  },
  headerCell: {
    padding: '10px 12px',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    borderBottom: '1px solid rgba(148, 163, 184, 0.35)',
  },
  rowHeader: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
  },
  bodyCell: {
    padding: '10px 12px',
    textAlign: 'center',
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: 12,
    color: '#0f172a',
    borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
  },
};
