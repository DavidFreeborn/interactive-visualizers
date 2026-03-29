/**
 * Pure model logic for Signaling Games.
 *
 * Scientific Status: Standard toy model
 * Based on: CompositionalSignal paper (Freeborn)
 *
 * This implements the Lewis-Skyrms signaling game with urn-based
 * reinforcement learning. For MVP, only traditional receiver is implemented.
 */

import { SeededRandom, normalize, sampleFromDistribution } from '@viz/core-math';
import type {
  SignalingGameConfig,
  SignalingGameState,
  SenderUrns,
  ReceiverUrns,
  RoundResult,
  SignalingMetrics,
} from './types';

/**
 * Default configuration for the 4x4x4 two-sender game.
 */
export const DEFAULT_CONFIG: SignalingGameConfig = {
  numStates: 4,
  numSenders: 2,
  messagesPerSender: 2,
  initialReinforcement: 1,
  replacementTurn: 50000,
  receiverType: 'traditional',
  seed: 12345,
};

/**
 * Validates a configuration.
 */
export function validateConfig(config: SignalingGameConfig): string | null {
  if (config.numStates < 2) {
    return 'numStates must be at least 2';
  }
  if (config.numSenders < 1 || config.numSenders > 2) {
    return 'numSenders must be 1 or 2';
  }
  if (config.messagesPerSender < 2) {
    return 'messagesPerSender must be at least 2';
  }
  if (config.numSenders === 2) {
    // For 2-sender game, states = messagesA x messagesB
    const expectedStates = config.messagesPerSender * config.messagesPerSender;
    if (config.numStates !== expectedStates) {
      return `For 2-sender game with ${config.messagesPerSender} messages each, numStates must be ${expectedStates}`;
    }
  }
  if (config.initialReinforcement < 1) {
    return 'initialReinforcement must be at least 1';
  }
  if (config.replacementTurn < 0) {
    return 'replacementTurn must be non-negative';
  }
  return null;
}

/**
 * Creates initial sender urns.
 * Each sender has urns for each state, with balls for each message.
 */
export function createSenderUrns(config: SignalingGameConfig): SenderUrns {
  const urns: SenderUrns = [];
  for (let s = 0; s < config.numSenders; s++) {
    const senderUrns: number[][] = [];
    for (let state = 0; state < config.numStates; state++) {
      const messageUrn: number[] = [];
      for (let m = 0; m < config.messagesPerSender; m++) {
        messageUrn.push(config.initialReinforcement);
      }
      senderUrns.push(messageUrn);
    }
    urns.push(senderUrns);
  }
  return urns;
}

/**
 * Creates initial receiver urns for traditional architecture.
 * One urn per message pair, with balls for each action.
 */
export function createReceiverUrns(config: SignalingGameConfig): ReceiverUrns {
  const numPairs =
    config.numSenders === 1
      ? config.messagesPerSender
      : config.messagesPerSender * config.messagesPerSender;

  const urns: ReceiverUrns = [];
  for (let pair = 0; pair < numPairs; pair++) {
    const actionUrn: number[] = [];
    for (let a = 0; a < config.numStates; a++) {
      actionUrn.push(config.initialReinforcement);
    }
    urns.push(actionUrn);
  }
  return urns;
}

/**
 * Creates the initial state for a signaling game.
 */
export function createInitialState(config: SignalingGameConfig): SignalingGameState {
  return {
    turn: 0,
    senderUrns: createSenderUrns(config),
    receiverUrns: createReceiverUrns(config),
    replacementOccurred: false,
    successCount: 0,
    totalRounds: 0,
    infoHistory: [],
    successHistory: [],
    replacementAtTurn: null,
  };
}

/**
 * Gets the message pair index for a 2-sender game.
 * For 2 messages per sender: pair index = msgA * 2 + msgB
 */
export function getMessagePairIndex(
  messages: number[],
  messagesPerSender: number
): number {
  if (messages.length === 1) {
    return messages[0];
  }
  return messages[0] * messagesPerSender + messages[1];
}

/**
 * Samples a message from a sender given a state.
 */
export function sampleSenderMessage(
  senderUrns: number[][],
  state: number,
  rng: SeededRandom
): number {
  const probs = normalize(senderUrns[state]);
  return sampleFromDistribution(probs, rng);
}

/**
 * Samples an action from the receiver given messages (traditional architecture).
 */
export function sampleReceiverAction(
  receiverUrns: ReceiverUrns,
  messages: number[],
  messagesPerSender: number,
  rng: SeededRandom
): number {
  const pairIndex = getMessagePairIndex(messages, messagesPerSender);
  const probs = normalize(receiverUrns[pairIndex]);
  return sampleFromDistribution(probs, rng);
}

/**
 * Runs one round of the signaling game.
 * Returns the result and whether to update urns (success = update).
 */
export function runRound(
  state: SignalingGameState,
  config: SignalingGameConfig,
  rng: SeededRandom
): RoundResult {
  // 1. Nature samples a state uniformly
  const selectedState = rng.randInt(0, config.numStates - 1);

  // 2. Each sender sends a message based on the state
  const messages: number[] = [];
  for (let s = 0; s < config.numSenders; s++) {
    const msg = sampleSenderMessage(state.senderUrns[s], selectedState, rng);
    messages.push(msg);
  }

  // 3. Receiver selects an action based on the message(s)
  const action = sampleReceiverAction(
    state.receiverUrns,
    messages,
    config.messagesPerSender,
    rng
  );

  // 4. Success if action matches state
  const success = action === selectedState;

  return {
    state: selectedState,
    messages,
    action,
    success,
  };
}

/**
 * Updates urns after a successful round.
 */
export function updateUrns(
  state: SignalingGameState,
  config: SignalingGameConfig,
  result: RoundResult
): void {
  if (!result.success) return;

  // Update sender urns: reinforce the message sent for this state
  for (let s = 0; s < config.numSenders; s++) {
    state.senderUrns[s][result.state][result.messages[s]] += 1;
  }

  // Update receiver urns: reinforce the action taken for this message pair
  const pairIndex = getMessagePairIndex(result.messages, config.messagesPerSender);
  state.receiverUrns[pairIndex][result.action] += 1;
}

/**
 * Performs signal replacement: resets one message's associations.
 * For traditional receiver, this resets all pairs containing that message.
 */
export function performReplacement(
  state: SignalingGameState,
  config: SignalingGameConfig
): void {
  if (config.numSenders !== 2) return; // Only for 2-sender game

  // Replace sender B's first message (m^B_0)
  const senderToReplace = 1; // Sender B
  const messageToReplace = 0; // First message

  // Reset sender urn for this message across all states
  for (let s = 0; s < config.numStates; s++) {
    state.senderUrns[senderToReplace][s][messageToReplace] = config.initialReinforcement;
  }

  // Reset all receiver urns that involve this message
  // For message pair index: pairs where msgB == 0 are indices 0, 2 (when messagesPerSender=2)
  for (let msgA = 0; msgA < config.messagesPerSender; msgA++) {
    const pairIndex = msgA * config.messagesPerSender + messageToReplace;
    for (let a = 0; a < config.numStates; a++) {
      state.receiverUrns[pairIndex][a] = config.initialReinforcement;
    }
  }

  state.replacementOccurred = true;
  state.replacementAtTurn = state.turn;
}

/**
 * Computes the probability distribution the receiver assigns to actions
 * given a state (integrating over sender message distributions).
 */
export function computeReceiverProbsGivenState(
  state: SignalingGameState,
  config: SignalingGameConfig,
  givenState: number
): number[] {
  const actionProbs = new Array(config.numStates).fill(0);

  if (config.numSenders === 1) {
    // P(action | state) = sum_m P(m | state) * P(action | m)
    const messageProbs = normalize(state.senderUrns[0][givenState]);
    for (let m = 0; m < config.messagesPerSender; m++) {
      const actionGivenMsg = normalize(state.receiverUrns[m]);
      for (let a = 0; a < config.numStates; a++) {
        actionProbs[a] += messageProbs[m] * actionGivenMsg[a];
      }
    }
  } else {
    // P(action | state) = sum_{mA,mB} P(mA | state) * P(mB | state) * P(action | mA, mB)
    const msgAProbs = normalize(state.senderUrns[0][givenState]);
    const msgBProbs = normalize(state.senderUrns[1][givenState]);

    for (let mA = 0; mA < config.messagesPerSender; mA++) {
      for (let mB = 0; mB < config.messagesPerSender; mB++) {
        const pairIndex = mA * config.messagesPerSender + mB;
        const actionGivenPair = normalize(state.receiverUrns[pairIndex]);
        const pairProb = msgAProbs[mA] * msgBProbs[mB];

        for (let a = 0; a < config.numStates; a++) {
          actionProbs[a] += pairProb * actionGivenPair[a];
        }
      }
    }
  }

  return actionProbs;
}

/**
 * Computes the pointwise mutual information for a message and state.
 * PMI(m, s) = log2(P(s | m) / P(s))
 *
 * For simplicity, we compute average "information content" as the
 * expected correct-action probability across states.
 */
export function computeAverageInformation(
  state: SignalingGameState,
  config: SignalingGameConfig
): number {
  // Average probability of correct action across all states (uniform prior)
  let totalCorrectProb = 0;

  for (let s = 0; s < config.numStates; s++) {
    const actionProbs = computeReceiverProbsGivenState(state, config, s);
    totalCorrectProb += actionProbs[s]; // P(correct action | state s)
  }

  const avgCorrectProb = totalCorrectProb / config.numStates;

  // Convert to bits: if perfect, avgCorrectProb = 1, info = log2(numStates)
  // We use: info = log2(numStates * avgCorrectProb) when avgCorrectProb > 1/numStates
  const random = 1 / config.numStates;
  if (avgCorrectProb <= random) {
    return 0;
  }

  return Math.log2(avgCorrectProb * config.numStates);
}

/**
 * Computes display metrics from the current state.
 */
export function computeMetrics(
  state: SignalingGameState,
  config: SignalingGameConfig
): SignalingMetrics {
  const avgInfo = computeAverageInformation(state, config);
  const successRate = state.totalRounds > 0 ? state.successCount / state.totalRounds : 0;

  // Consider it a signaling system if success rate > 0.9
  const hasSignalingSystem = successRate > 0.9 && state.totalRounds > 100;

  // Information loss: compare pre and post replacement (if occurred)
  let informationLoss: number | null = null;
  if (state.replacementOccurred && state.infoHistory.length > 0) {
    // Find info just before replacement
    const preReplacementIdx = state.replacementAtTurn
      ? Math.min(state.replacementAtTurn, state.infoHistory.length - 1)
      : state.infoHistory.length - 1;
    const preInfo = state.infoHistory[preReplacementIdx] ?? 0;
    informationLoss = Math.max(0, preInfo - avgInfo);
  }

  return {
    turn: state.turn,
    avgInformationContent: avgInfo,
    successRate,
    hasSignalingSystem,
    informationLoss,
  };
}

/**
 * The SignalingGameModel class provides the pure model logic.
 */
export class SignalingGameModel {
  readonly config: SignalingGameConfig;

  constructor(config: Partial<SignalingGameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const error = validateConfig(this.config);
    if (error) {
      throw new Error(`Invalid config: ${error}`);
    }
  }

  createInitialState(): SignalingGameState {
    return createInitialState(this.config);
  }

  runRound(state: SignalingGameState, rng: SeededRandom): RoundResult {
    return runRound(state, this.config, rng);
  }

  updateUrns(state: SignalingGameState, result: RoundResult): void {
    updateUrns(state, this.config, result);
  }

  performReplacement(state: SignalingGameState): void {
    performReplacement(state, this.config);
  }

  computeMetrics(state: SignalingGameState): SignalingMetrics {
    return computeMetrics(state, this.config);
  }

  shouldReplace(state: SignalingGameState): boolean {
    return (
      this.config.replacementTurn > 0 &&
      state.turn === this.config.replacementTurn &&
      !state.replacementOccurred
    );
  }
}
