import type { SignalingRoundEvent } from '../model/types';

export type PlaybackSpeed = 'slow' | 'normal' | 'fast';

export type AnimationPhase = 'idle' | 'state' | 'message' | 'action' | 'result';

export interface RoundAnimationState {
  phase: AnimationPhase;
  progress: number;
  event: SignalingRoundEvent | null;
}

export interface SpeedPreset {
  intervalMs: number;
  batchSize: number;
  animate: boolean;
  phaseDurationMs: number;
  resultHoldMs: number;
}

export const SPEED_PRESETS: Record<PlaybackSpeed, SpeedPreset> = {
  slow: {
    intervalMs: 700,
    batchSize: 1,
    animate: true,
    phaseDurationMs: 260,
    resultHoldMs: 300,
  },
  normal: {
    intervalMs: 340,
    batchSize: 1,
    animate: true,
    phaseDurationMs: 140,
    resultHoldMs: 180,
  },
  fast: {
    intervalMs: 60,
    batchSize: 30,
    animate: false,
    phaseDurationMs: 0,
    resultHoldMs: 0,
  },
};
