/**
 * State-Signal-Action flow diagram for the signaling game.
 *
 * Shows:
 * - States on the left
 * - Sender A signals
 * - Sender B signals
 * - Message pair in the middle
 * - Receiver actions on the right
 */

import React from 'react';
import type { SignalingGameConfig } from '../model/types';

export interface SignalingDiagramProps {
  config: SignalingGameConfig;
  senderProbs: number[][][]; // senderProbs[sender][state][message]
  receiverProbs: number[][]; // receiverProbs[messagePair][action]
  width?: number;
  height?: number;
}

/**
 * Generates labels for states (S0, S1, ...).
 */
function stateLabels(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `S${i}`);
}

/**
 * Generates labels for messages (m0, m1, ...).
 */
function messageLabels(n: number, prefix: string): string[] {
  return Array.from({ length: n }, (_, i) => `${prefix}${i}`);
}

/**
 * Generates labels for message pairs ((0,0), (0,1), ...).
 */
function pairLabels(messagesPerSender: number): string[] {
  const labels: string[] = [];
  for (let a = 0; a < messagesPerSender; a++) {
    for (let b = 0; b < messagesPerSender; b++) {
      labels.push(`(${a},${b})`);
    }
  }
  return labels;
}

/**
 * Generates labels for actions (A0, A1, ...).
 */
function actionLabels(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `A${i}`);
}

export const SignalingDiagram: React.FC<SignalingDiagramProps> = ({
  config,
  senderProbs,
  receiverProbs,
  width = 700,
  height = 400,
}) => {
  const { numStates, numSenders, messagesPerSender } = config;
  const numPairs = messagesPerSender ** numSenders;

  const padding = 40;
  const colWidth = (width - 2 * padding) / 5;
  const colX = [
    padding, // States
    padding + colWidth, // Sender A
    padding + colWidth * 2, // Sender B
    padding + colWidth * 3, // Pairs
    padding + colWidth * 4, // Actions
  ];

  const nodeRadius = 12;
  const fontSize = 10;

  // Calculate Y positions for each column
  const stateY = (i: number) =>
    padding + ((height - 2 * padding) * (i + 0.5)) / numStates;
  const msgAY = (i: number) =>
    padding + ((height - 2 * padding) * (i + 0.5)) / messagesPerSender;
  const msgBY = (i: number) =>
    padding + ((height - 2 * padding) * (i + 0.5)) / messagesPerSender;
  const pairY = (i: number) =>
    padding + ((height - 2 * padding) * (i + 0.5)) / numPairs;
  const actionY = (i: number) =>
    padding + ((height - 2 * padding) * (i + 0.5)) / numStates;

  const states = stateLabels(numStates);
  const msgsA = messageLabels(messagesPerSender, 'a');
  const msgsB = messageLabels(messagesPerSender, 'b');
  const pairs = pairLabels(messagesPerSender);
  const actions = actionLabels(numStates);

  // Function to determine edge opacity from probability
  const edgeOpacity = (p: number) => 0.1 + p * 0.9;
  const edgeWidth = (p: number) => 0.5 + p * 2.5;

  return (
    <svg
      width={width}
      height={height}
      style={styles.svg}
      role="img"
      aria-label="Signaling game flow diagram showing states, sender messages, message pairs, and receiver actions with probability-weighted edges"
    >
      <title>State-Signal-Action Flow Diagram</title>
      <desc>
        A flow diagram showing how states (S0-S3) map to messages from Sender A
        and Sender B, which combine into message pairs, leading to receiver actions (A0-A3).
        Edge thickness indicates probability strength.
      </desc>
      {/* Column labels */}
      {['State', 'Sender A', 'Sender B', 'Pair', 'Action'].map((label, i) => (
        <text
          key={label}
          x={colX[i]}
          y={20}
          textAnchor="middle"
          fontSize={12}
          fontWeight={500}
          fill="#595959"
        >
          {label}
        </text>
      ))}

      {/* Edges: State -> Message A (solid lines) */}
      {numSenders >= 1 &&
        senderProbs[0]?.map((stateProbs, state) =>
          stateProbs.map((prob, msg) => (
            <line
              key={`sA-${state}-${msg}`}
              x1={colX[0] + nodeRadius}
              y1={stateY(state)}
              x2={colX[1] - nodeRadius}
              y2={msgAY(msg)}
              stroke="#1565c0"
              strokeWidth={edgeWidth(prob)}
              strokeOpacity={edgeOpacity(prob)}
              aria-label={`State ${state} to message a${msg}: ${(prob * 100).toFixed(0)}%`}
            />
          ))
        )}

      {/* Edges: State -> Message B (dashed lines for visual distinction) */}
      {numSenders >= 2 &&
        senderProbs[1]?.map((stateProbs, state) =>
          stateProbs.map((prob, msg) => (
            <line
              key={`sB-${state}-${msg}`}
              x1={colX[0] + nodeRadius}
              y1={stateY(state)}
              x2={colX[2] - nodeRadius}
              y2={msgBY(msg)}
              stroke="#7b1fa2"
              strokeWidth={edgeWidth(prob)}
              strokeOpacity={edgeOpacity(prob)}
              strokeDasharray="4,2"
              aria-label={`State ${state} to message b${msg}: ${(prob * 100).toFixed(0)}%`}
            />
          ))
        )}

      {/* Edges: Messages -> Pairs */}
      {Array.from({ length: messagesPerSender }).map((_, msgA) =>
        Array.from({ length: messagesPerSender }).map((_, msgB) => {
          const pairIdx = msgA * messagesPerSender + msgB;
          return (
            <g key={`pair-edges-${pairIdx}`}>
              <line
                x1={colX[1] + nodeRadius}
                y1={msgAY(msgA)}
                x2={colX[3] - nodeRadius}
                y2={pairY(pairIdx)}
                stroke="#888"
                strokeWidth={1}
                strokeOpacity={0.3}
              />
              <line
                x1={colX[2] + nodeRadius}
                y1={msgBY(msgB)}
                x2={colX[3] - nodeRadius}
                y2={pairY(pairIdx)}
                stroke="#888"
                strokeWidth={1}
                strokeOpacity={0.3}
              />
            </g>
          );
        })
      )}

      {/* Edges: Pairs -> Actions (dotted lines for visual distinction) */}
      {receiverProbs.map((pairProbs, pair) =>
        pairProbs.map((prob, action) => (
          <line
            key={`r-${pair}-${action}`}
            x1={colX[3] + nodeRadius}
            y1={pairY(pair)}
            x2={colX[4] - nodeRadius}
            y2={actionY(action)}
            stroke="#2e7d32"
            strokeWidth={edgeWidth(prob)}
            strokeOpacity={edgeOpacity(prob)}
            strokeDasharray="1,2"
            aria-label={`Pair ${pair} to action ${action}: ${(prob * 100).toFixed(0)}%`}
          />
        ))
      )}

      {/* State nodes */}
      {states.map((label, i) => (
        <g key={`state-${i}`}>
          <circle
            cx={colX[0]}
            cy={stateY(i)}
            r={nodeRadius}
            fill="#e3f2fd"
            stroke="#2196f3"
            strokeWidth={2}
          />
          <text
            x={colX[0]}
            y={stateY(i)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      ))}

      {/* Message A nodes */}
      {msgsA.map((label, i) => (
        <g key={`msgA-${i}`}>
          <circle
            cx={colX[1]}
            cy={msgAY(i)}
            r={nodeRadius}
            fill="#e3f2fd"
            stroke="#2196f3"
            strokeWidth={2}
          />
          <text
            x={colX[1]}
            y={msgAY(i)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      ))}

      {/* Message B nodes */}
      {msgsB.map((label, i) => (
        <g key={`msgB-${i}`}>
          <circle
            cx={colX[2]}
            cy={msgBY(i)}
            r={nodeRadius}
            fill="#f3e5f5"
            stroke="#9c27b0"
            strokeWidth={2}
          />
          <text
            x={colX[2]}
            y={msgBY(i)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      ))}

      {/* Pair nodes */}
      {pairs.map((label, i) => (
        <g key={`pair-${i}`}>
          <rect
            x={colX[3] - nodeRadius}
            y={pairY(i) - nodeRadius * 0.7}
            width={nodeRadius * 2}
            height={nodeRadius * 1.4}
            rx={4}
            fill="#fff9c4"
            stroke="#fbc02d"
            strokeWidth={2}
          />
          <text
            x={colX[3]}
            y={pairY(i)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize - 1}
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      ))}

      {/* Action nodes */}
      {actions.map((label, i) => (
        <g key={`action-${i}`}>
          <circle
            cx={colX[4]}
            cy={actionY(i)}
            r={nodeRadius}
            fill="#e8f5e9"
            stroke="#4caf50"
            strokeWidth={2}
          />
          <text
            x={colX[4]}
            y={actionY(i)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      ))}

      {/* Legend for edge types */}
      <g transform={`translate(${width - 140}, ${height - 55})`} aria-label="Legend">
        <rect x={-5} y={-5} width={135} height={55} fill="#fff" stroke="#e0e0e0" rx={4} />
        <text x={0} y={8} fontSize={10} fontWeight={600} fill="#333">Edge Types:</text>

        {/* Sender A - solid */}
        <line x1={0} y1={20} x2={25} y2={20} stroke="#1565c0" strokeWidth={2} />
        <text x={30} y={23} fontSize={9} fill="#595959">Sender A (solid)</text>

        {/* Sender B - dashed */}
        <line x1={0} y1={32} x2={25} y2={32} stroke="#7b1fa2" strokeWidth={2} strokeDasharray="4,2" />
        <text x={30} y={35} fontSize={9} fill="#595959">Sender B (dashed)</text>

        {/* Receiver - dotted */}
        <line x1={0} y1={44} x2={25} y2={44} stroke="#2e7d32" strokeWidth={2} strokeDasharray="1,2" />
        <text x={30} y={47} fontSize={9} fill="#595959">Receiver (dotted)</text>
      </g>
    </svg>
  );
};

const styles: Record<string, React.CSSProperties> = {
  svg: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
};
