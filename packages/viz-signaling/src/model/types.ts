/**
 * Type definitions for the Signaling Games model.
 *
 * Scientific Status: Standard toy model
 * Based on: CompositionalSignal paper (Freeborn)
 */

/**
 * Receiver architecture type.
 * MVP: Traditional only
 * Stretch: Minimalist, Generalist
 */
export type ReceiverType = 'traditional';

/**
 * Configuration for a signaling game.
 */
export interface SignalingGameConfig {
  /** Number of states (and acts) - must be a square for 2-sender game */
  numStates: number;

  /** Number of senders (1 or 2) */
  numSenders: number;

  /** Messages per sender */
  messagesPerSender: number;

  /** Initial reinforcement value for urns */
  initialReinforcement: number;

  /** Turn at which signal replacement occurs (0 = no replacement) */
  replacementTurn: number;

  /** Receiver architecture type */
  receiverType: ReceiverType;

  /** Random seed for reproducibility */
  seed: number;
}

/**
 * Sender's urn: maps state -> message probabilities
 * Structure: senderUrns[senderId][stateId][messageId] = reinforcement count
 */
export type SenderUrns = number[][][];

/**
 * Traditional receiver's urn: maps message pair -> action probabilities
 * For 2 senders with 2 messages each: 4 pairs, 4 actions
 * Structure: receiverUrns[messagePairIndex][actionId] = reinforcement count
 */
export type ReceiverUrns = number[][];

/**
 * The current state of a signaling game simulation.
 */
export interface SignalingGameState {
  /** Current simulation turn */
  turn: number;

  /** Sender urns */
  senderUrns: SenderUrns;

  /** Receiver urns (traditional architecture) */
  receiverUrns: ReceiverUrns;

  /** Whether signal replacement has occurred */
  replacementOccurred: boolean;

  /** Communication success count */
  successCount: number;

  /** Total rounds played */
  totalRounds: number;

  /** History of average information content per turn (sampled) */
  infoHistory: number[];

  /** History of success rate per turn (sampled) */
  successHistory: number[];

  /** Turn at which replacement occurred (if any) */
  replacementAtTurn: number | null;
}

/**
 * Computed metrics for display.
 */
export interface SignalingMetrics {
  /** Current turn */
  turn: number;

  /** Average information content in bits */
  avgInformationContent: number;

  /** Communication success rate [0,1] */
  successRate: number;

  /** Whether a stable signaling system has emerged */
  hasSignalingSystem: boolean;

  /** Information lost after replacement (if occurred) */
  informationLoss: number | null;
}

/**
 * Result of a single game round.
 */
export interface RoundResult {
  /** State that was sampled */
  state: number;

  /** Messages sent by each sender */
  messages: number[];

  /** Action chosen by receiver */
  action: number;

  /** Whether communication succeeded (action == state) */
  success: boolean;
}
