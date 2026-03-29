/**
 * Shared type definitions for UI components.
 */

/**
 * Metric definition for display.
 */
export interface MetricDefinition {
  name: string;
  description: string;
  unit: string;
}

/**
 * Control definition.
 */
export interface ControlDefinition {
  name: string;
  description: string;
}

/**
 * Playback state for simulation controls.
 */
export interface PlaybackState {
  isPlaying: boolean;
  speed: number;
  stepsPerFrame: number;
}

/**
 * Common simulation interface that all visualizers implement.
 */
export interface SimulationControls {
  step: () => void;
  stepN: (n: number) => void;
  reset: () => void;
}
