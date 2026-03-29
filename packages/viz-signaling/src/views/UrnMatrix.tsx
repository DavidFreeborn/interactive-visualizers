/**
 * Urn visualization as a probability matrix.
 *
 * Displays a heat-map style grid where each cell shows
 * the probability of choosing a particular option.
 */

import React from 'react';

export interface UrnMatrixProps {
  /** Matrix of probabilities: rows = inputs, cols = outputs */
  probabilities: number[][];
  /** Row labels */
  rowLabels: string[];
  /** Column labels */
  colLabels: string[];
  /** Title */
  title: string;
  /** Optional highlight for specific cells */
  highlight?: { row: number; col: number } | null;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
}

/**
 * Converts probability [0,1] to a color.
 */
function probToColor(p: number): string {
  // Blue to white gradient
  const intensity = Math.floor((1 - p) * 255);
  return `rgb(${intensity}, ${intensity}, 255)`;
}

export const UrnMatrix: React.FC<UrnMatrixProps> = ({
  probabilities,
  rowLabels,
  colLabels,
  title,
  highlight = null,
  width = 200,
  height = 200,
}) => {
  const numRows = probabilities.length;
  const numCols = probabilities[0]?.length ?? 0;

  if (numRows === 0 || numCols === 0) {
    return null;
  }

  const cellWidth = width / (numCols + 1);
  const cellHeight = height / (numRows + 1);
  const fontSize = Math.min(cellWidth, cellHeight) * 0.4;

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>{title}</h4>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={styles.svg}
      >
        {/* Column headers */}
        {colLabels.map((label, col) => (
          <text
            key={`col-${col}`}
            x={cellWidth * (col + 1.5)}
            y={cellHeight * 0.6}
            textAnchor="middle"
            fontSize={fontSize}
            fill="#333"
          >
            {label}
          </text>
        ))}

        {/* Rows */}
        {probabilities.map((row, rowIdx) => (
          <g key={`row-${rowIdx}`}>
            {/* Row label */}
            <text
              x={cellWidth * 0.5}
              y={cellHeight * (rowIdx + 1.6)}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#333"
            >
              {rowLabels[rowIdx]}
            </text>

            {/* Cells */}
            {row.map((prob, colIdx) => {
              const x = cellWidth * (colIdx + 1);
              const y = cellHeight * (rowIdx + 1);
              const isHighlighted =
                highlight?.row === rowIdx && highlight?.col === colIdx;

              return (
                <g key={`cell-${rowIdx}-${colIdx}`}>
                  <rect
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={cellHeight}
                    fill={probToColor(prob)}
                    stroke={isHighlighted ? '#ff0' : '#ccc'}
                    strokeWidth={isHighlighted ? 2 : 1}
                  />
                  <text
                    x={x + cellWidth / 2}
                    y={y + cellHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize * 0.8}
                    fill="#000"
                  >
                    {prob.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 500,
  },
  svg: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
};
