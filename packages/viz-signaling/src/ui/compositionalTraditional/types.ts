import type { CompositionalRoundEvent } from '../../model/compositionalShared';

export type TraditionalAnimationPhase =
  | 'idle'
  | 'state'
  | 'senders'
  | 'pair'
  | 'action'
  | 'result';

export interface TraditionalRoundAnimationState {
  phase: TraditionalAnimationPhase;
  progress: number;
  event: CompositionalRoundEvent | null;
}
