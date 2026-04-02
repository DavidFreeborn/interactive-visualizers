import React from 'react';

export interface MatrixTableProps {
  title: string;
  rowLabels: string[];
  columnLabels: string[];
  matrix: number[][];
  formatter?: (value: number) => string;
  defaultOpen?: boolean;
}

/**
 * Collapsible table view for exact weights and normalized policies.
 */
export function MatrixTable({
  title,
  rowLabels,
  columnLabels,
  matrix,
  formatter = (value) => value.toFixed(3),
  defaultOpen = false,
}: MatrixTableProps): React.ReactElement {
  return (
    <details open={defaultOpen} style={styles.details}>
      <summary style={styles.summary}>{title}</summary>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell} />
              {columnLabels.map((label) => (
                <th key={label} style={styles.headerCell}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={rowLabels[rowIndex]}>
                <th style={styles.rowHeader}>{rowLabels[rowIndex]}</th>
                {row.map((value, columnIndex) => (
                  <td key={`${rowIndex}-${columnIndex}`} style={styles.bodyCell}>
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
    minWidth: 320,
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
