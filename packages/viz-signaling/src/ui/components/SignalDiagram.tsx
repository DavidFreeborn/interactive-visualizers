import React, { useMemo, useState } from 'react';
import type { SignalingGameConfig, SignalingPolicies } from '../../model/types';
import type { RoundAnimationState } from '../types';

export interface SignalDiagramProps {
  config: SignalingGameConfig;
  policies: SignalingPolicies;
  animation: RoundAnimationState;
  showProbabilityLabels: boolean;
}

interface HoveredEdge {
  description: string;
  probability: number;
}

interface Palette {
  fill: string;
  stroke: string;
  text: string;
}

interface Point {
  x: number;
  y: number;
}

interface NodeGeometry extends Point {
  radius: number;
}

interface CurveGeometry {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
  midpoint: Point;
  path: string;
}

function createPalette(index: number, total: number): Palette {
  const hue = (24 + index * (360 / total)) % 360;
  return {
    fill: `hsl(${hue} 58% 94%)`,
    stroke: `hsl(${hue} 58% 42%)`,
    text: '#111111',
  };
}

function neutralPalette(): Palette {
  return {
    fill: '#ffffff',
    stroke: '#8b94a3',
    text: '#111111',
  };
}

function formatProbability(value: number): string {
  return value.toFixed(3);
}

function visualStrength(probability: number, optionCount: number): number {
  const uniform = 1 / optionCount;
  return Math.max(0, (probability - uniform) / (1 - uniform));
}

function cubicBezierPoint(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  progress: number
): Point {
  const inverse = 1 - progress;
  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * progress * control1.x +
      3 * inverse * progress ** 2 * control2.x +
      progress ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * progress * control1.y +
      3 * inverse * progress ** 2 * control2.y +
      progress ** 3 * end.y,
  };
}

function buildCurve(source: NodeGeometry, target: NodeGeometry): CurveGeometry {
  const start = { x: source.x, y: source.y };
  const end = { x: target.x, y: target.y };
  const horizontalSpan = end.x - start.x;
  const controlOffset = Math.max(56, horizontalSpan * 0.34);
  const control1 = { x: start.x + controlOffset, y: start.y };
  const control2 = { x: end.x - controlOffset, y: end.y };
  const midpoint = cubicBezierPoint(start, control1, control2, end, 0.5);

  return {
    start,
    control1,
    control2,
    end,
    midpoint,
    path: `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`,
  };
}

/**
 * Main three-column signal-flow diagram for the signaling game.
 */
export function SignalDiagram({
  config,
  policies,
  animation,
  showProbabilityLabels,
}: SignalDiagramProps): React.ReactElement {
  const [hoveredEdge, setHoveredEdge] = useState<HoveredEdge | null>(null);
  const width = 920;
  const height = 430;
  const padding = { top: 56, right: 84, bottom: 38, left: 84 };
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const stateX = padding.left + usableWidth * 0.1;
  const messageX = padding.left + usableWidth * 0.5;
  const actionX = padding.left + usableWidth * 0.9;
  const stateSpacing = usableHeight / Math.max(1, config.numStates - 1);
  const messageSpacing = usableHeight / Math.max(1, config.numMessages - 1);
  const actionSpacing = usableHeight / Math.max(1, config.numActions - 1);
  const stateY = (index: number) =>
    config.numStates === 1 ? padding.top + usableHeight / 2 : padding.top + index * stateSpacing;
  const messageY = (index: number) =>
    config.numMessages === 1 ? padding.top + usableHeight / 2 : padding.top + index * messageSpacing;
  const actionY = (index: number) =>
    config.numActions === 1 ? padding.top + usableHeight / 2 : padding.top + index * actionSpacing;

  const stateNodes = useMemo(
    () =>
      Array.from({ length: config.numStates }, (_, index) => ({
        x: stateX,
        y: stateY(index),
        radius: 22,
      })),
    [config.numStates, stateX]
  );
  const messageNodes = useMemo(
    () =>
      Array.from({ length: config.numMessages }, (_, index) => ({
        x: messageX,
        y: messageY(index),
        radius: 20,
      })),
    [config.numMessages, messageX]
  );
  const actionNodes = useMemo(
    () =>
      Array.from({ length: config.numActions }, (_, index) => ({
        x: actionX,
        y: actionY(index),
        radius: 22,
      })),
    [config.numActions, actionX]
  );

  const statePalettes = useMemo(
    () => Array.from({ length: config.numStates }, (_, index) => createPalette(index, config.numStates)),
    [config.numStates]
  );
  const actionPalettes = useMemo(
    () =>
      Array.from({ length: config.numActions }, (_, actionIndex) => {
        const matchingStates = config.correctActions
          .map((correctAction, stateIndex) => ({ correctAction, stateIndex }))
          .filter((entry) => entry.correctAction === actionIndex);
        if (matchingStates.length !== 1) {
          return neutralPalette();
        }
        return statePalettes[matchingStates[0].stateIndex];
      }),
    [config.correctActions, config.numActions, statePalettes]
  );
  const messagePalette = neutralPalette();

  const activeEvent = animation.event;
  const showStatePulse = animation.phase === 'state' && activeEvent !== null;
  const showMessagePulse = animation.phase === 'message' && activeEvent !== null;
  const showActionPulse = animation.phase === 'action' && activeEvent !== null;
  const showResult = animation.phase === 'result' && activeEvent !== null;

  const activeStateCurve =
    activeEvent === null
      ? null
      : buildCurve(stateNodes[activeEvent.stateIndex], messageNodes[activeEvent.messageIndex]);
  const activeActionCurve =
    activeEvent === null
      ? null
      : buildCurve(messageNodes[activeEvent.messageIndex], actionNodes[activeEvent.actionIndex]);

  return (
    <div style={styles.wrapper}>
      {hoveredEdge ? (
        <div style={styles.tooltip} data-testid="edge-tooltip">
          {`${hoveredEdge.description} = ${formatProbability(hoveredEdge.probability)}`}
        </div>
      ) : null}

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Signaling game diagram">
        <rect x={0} y={0} width={width} height={height} rx={24} fill="#ffffff" />

        {[stateX, messageX, actionX].map((x) => (
          <line
            key={`guide-${x}`}
            x1={x}
            y1={padding.top - 18}
            x2={x}
            y2={height - padding.bottom + 10}
            stroke="#eef2f7"
            strokeWidth={1}
          />
        ))}

        <text x={stateX} y={28} textAnchor="middle" style={styles.headerText}>
          Nature
        </text>
        <text x={messageX} y={28} textAnchor="middle" style={styles.headerText}>
          Sender
        </text>
        <text x={actionX} y={28} textAnchor="middle" style={styles.headerText}>
          Receiver
        </text>

        {policies.senderPolicy.map((row, stateIndex) =>
          row.map((probability, messageIndex) => {
            const strength = visualStrength(probability, config.numMessages);
            const palette = statePalettes[stateIndex];
            const curve = buildCurve(stateNodes[stateIndex], messageNodes[messageIndex]);
            const active =
              activeEvent !== null &&
              stateIndex === activeEvent.stateIndex &&
              messageIndex === activeEvent.messageIndex &&
              animation.phase !== 'idle';

            return (
              <g key={`state-edge-${stateIndex}-${messageIndex}`}>
                <path
                  d={curve.path}
                  fill="none"
                  stroke={active ? '#d97706' : strength > 0 ? palette.stroke : '#cbd5e1'}
                  strokeOpacity={active ? 1 : 0.24 + probability * 0.28 + strength * 0.34}
                  strokeWidth={active ? 5 : 1.2 + probability * 2.6 + strength * 2.8}
                  strokeLinecap="round"
                  onMouseEnter={() =>
                    setHoveredEdge({
                      description: `P(M${messageIndex} | S${stateIndex})`,
                      probability,
                    })
                  }
                  onMouseLeave={() => setHoveredEdge(null)}
                  data-testid={`edge-state-${stateIndex}-message-${messageIndex}`}
                />
                {showProbabilityLabels ? (
                  <text
                    x={curve.midpoint.x}
                    y={curve.midpoint.y - 8}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={styles.edgeLabel}
                  >
                    {formatProbability(probability)}
                  </text>
                ) : null}
              </g>
            );
          })
        )}

        {policies.receiverPolicy.map((row, messageIndex) =>
          row.map((probability, actionIndex) => {
            const strength = visualStrength(probability, config.numActions);
            const palette = actionPalettes[actionIndex];
            const curve = buildCurve(messageNodes[messageIndex], actionNodes[actionIndex]);
            const active =
              activeEvent !== null &&
              messageIndex === activeEvent.messageIndex &&
              actionIndex === activeEvent.actionIndex &&
              ['message', 'action', 'result'].includes(animation.phase);

            return (
              <g key={`message-edge-${messageIndex}-${actionIndex}`}>
                <path
                  d={curve.path}
                  fill="none"
                  stroke={active ? '#d97706' : strength > 0 ? palette.stroke : '#cbd5e1'}
                  strokeOpacity={active ? 1 : 0.24 + probability * 0.28 + strength * 0.34}
                  strokeWidth={active ? 5 : 1.2 + probability * 2.6 + strength * 2.8}
                  strokeLinecap="round"
                  onMouseEnter={() =>
                    setHoveredEdge({
                      description: `P(A${actionIndex} | M${messageIndex})`,
                      probability,
                    })
                  }
                  onMouseLeave={() => setHoveredEdge(null)}
                  data-testid={`edge-message-${messageIndex}-action-${actionIndex}`}
                />
                {showProbabilityLabels ? (
                  <text
                    x={curve.midpoint.x}
                    y={curve.midpoint.y - 8}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={styles.edgeLabel}
                  >
                    {formatProbability(probability)}
                  </text>
                ) : null}
              </g>
            );
          })
        )}

        {statePalettes.map((palette, stateIndex) => {
          const node = stateNodes[stateIndex];
          return (
            <g key={`state-node-${stateIndex}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={palette.fill}
                stroke={palette.stroke}
                strokeWidth={2}
              />
              <text x={node.x} y={node.y + 1} textAnchor="middle" style={styles.nodeCode}>
                {`S${stateIndex}`}
              </text>
              <text x={node.x - 40} y={node.y + 5} textAnchor="end" style={styles.nodeLabel}>
                {`state ${stateIndex}`}
              </text>
            </g>
          );
        })}

        {Array.from({ length: config.numMessages }, (_, messageIndex) => {
          const node = messageNodes[messageIndex];
          return (
            <g key={`message-node-${messageIndex}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={messagePalette.fill}
                stroke={messagePalette.stroke}
                strokeWidth={2}
              />
              <text x={node.x} y={node.y + 1} textAnchor="middle" style={styles.nodeCode}>
                {`M${messageIndex}`}
              </text>
            </g>
          );
        })}

        {actionPalettes.map((palette, actionIndex) => {
          const node = actionNodes[actionIndex];
          return (
            <g key={`action-node-${actionIndex}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={palette.fill}
                stroke={palette.stroke}
                strokeWidth={2}
              />
              <text x={node.x} y={node.y + 1} textAnchor="middle" style={styles.nodeCode}>
                {`A${actionIndex}`}
              </text>
              <text x={node.x + 40} y={node.y + 5} textAnchor="start" style={styles.nodeLabel}>
                {`action ${actionIndex}`}
              </text>
            </g>
          );
        })}

        {showStatePulse && activeEvent !== null ? (
          <circle
            cx={stateNodes[activeEvent.stateIndex].x}
            cy={stateNodes[activeEvent.stateIndex].y}
            r={30 + animation.progress * 6}
            fill="none"
            stroke="#d97706"
            strokeWidth={3.5}
            strokeOpacity={0.88 - animation.progress * 0.3}
          />
        ) : null}

        {showMessagePulse && activeStateCurve !== null ? (
          <AnimatedToken
            curve={activeStateCurve}
            progress={animation.progress}
          />
        ) : null}

        {showActionPulse && activeActionCurve !== null ? (
          <AnimatedToken
            curve={activeActionCurve}
            progress={animation.progress}
          />
        ) : null}

        {showResult && activeEvent !== null ? (
          <g>
            <circle
              cx={actionNodes[activeEvent.actionIndex].x}
              cy={actionNodes[activeEvent.actionIndex].y}
              r={31}
              fill="none"
              stroke={activeEvent.success ? '#15803d' : '#b91c1c'}
              strokeWidth={4.5}
            />
            <text
              x={width / 2}
              y={height - 14}
              textAnchor="middle"
              style={{
                ...styles.resultText,
                fill: activeEvent.success ? '#166534' : '#b91c1c',
              }}
            >
              {activeEvent.success
                ? `Success: A${activeEvent.actionIndex} is correct for S${activeEvent.stateIndex}.`
                : `Failure: A${activeEvent.actionIndex} is incorrect for S${activeEvent.stateIndex}.`}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function AnimatedToken({
  curve,
  progress,
}: {
  curve: CurveGeometry;
  progress: number;
}): React.ReactElement {
  const point = cubicBezierPoint(
    curve.start,
    curve.control1,
    curve.control2,
    curve.end,
    progress
  );

  return (
    <g>
      <circle cx={point.x} cy={point.y} r={11} fill="rgba(217, 119, 6, 0.18)" />
      <circle cx={point.x} cy={point.y} r={5.5} fill="#d97706" stroke="#ffffff" strokeWidth={1.75} />
    </g>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    border: '1px solid #d6dce5',
    background: '#ffffff',
  },
  tooltip: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    maxWidth: 280,
    padding: '8px 10px',
    borderRadius: 10,
    background: 'rgba(255, 255, 255, 0.98)',
    color: '#111111',
    border: '1px solid #d6dce5',
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: 12,
    lineHeight: 1.35,
  },
  headerText: {
    fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fill: '#111111',
  },
  nodeCode: {
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: 12,
    fontWeight: 700,
    fill: '#111111',
  },
  nodeLabel: {
    fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif',
    fontSize: 12,
    fontWeight: 600,
    fill: '#111111',
  },
  edgeLabel: {
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: 10,
    fill: '#111111',
  },
  resultText: {
    fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif',
    fontSize: 13,
    fontWeight: 700,
  },
};
