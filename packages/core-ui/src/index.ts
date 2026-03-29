/**
 * @package core-ui
 * Shared UI components for all visualizers
 */

// Components
export { PlaybackControls } from './components/PlaybackControls';
export type { PlaybackControlsProps } from './components/PlaybackControls';

export { MetricsPanel } from './components/MetricsPanel';
export type { MetricsPanelProps, MetricDisplay } from './components/MetricsPanel';

export { InfoPanel } from './components/InfoPanel';
export type { InfoPanelProps } from './components/InfoPanel';

export { ScientificStatus } from './components/ScientificStatus';
export type { ScientificStatusProps, StatusType } from './components/ScientificStatus';

// Hooks
export { usePlayback } from './hooks/usePlayback';
export type { UsePlaybackOptions, UsePlaybackReturn } from './hooks/usePlayback';

// Types
export type {
  MetricDefinition,
  ControlDefinition,
  PlaybackState,
  SimulationControls,
} from './types';
