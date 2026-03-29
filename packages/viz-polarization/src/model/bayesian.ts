/**
 * Bayesian updating logic.
 *
 * Scientific Status: Standard toy model
 */

import type { BayesNetwork, AgentBeliefs, NetworkType } from './types';
import { getNetwork } from './networks';

/**
 * Computes P(D=1 | H) for a chain network.
 *
 * Chain: H -> S -> D
 * P(D=1 | H=1) = P(D=1 | S=1) * P(S=1 | H=1) + P(D=1 | S=0) * P(S=0 | H=1)
 */
function computeLikelihoodChain(
  h: boolean,
  likelihoodRatio: number
): number {
  // Simplified model: P(S=1|H) = likelihoodRatio for H=1, 1-likelihoodRatio for H=0
  // P(D=1|S) = likelihoodRatio for S=1, 1-likelihoodRatio for S=0
  const pSGivenH = h ? likelihoodRatio : 1 - likelihoodRatio;
  const pDGivenS1 = likelihoodRatio;
  const pDGivenS0 = 1 - likelihoodRatio;

  return pDGivenS1 * pSGivenH + pDGivenS0 * (1 - pSGivenH);
}

/**
 * Computes P(D=1 | H) for a collider network.
 *
 * Collider: H -> D <- S
 * P(D=1 | H) depends on marginalization over S (which agent has prior on)
 */
function computeLikelihoodCollider(
  h: boolean,
  priorS: number,
  likelihoodRatio: number
): number {
  // P(D=1 | H=h, S=s) via noisy-OR-like model
  // For simplicity: D=1 if either H or S, with likelihood ratio controlling strength
  const pDGivenH1S1 = likelihoodRatio;
  const pDGivenH1S0 = likelihoodRatio * 0.7; // Weaker if only H
  const pDGivenH0S1 = likelihoodRatio * 0.7; // Weaker if only S
  const pDGivenH0S0 = 1 - likelihoodRatio;

  if (h) {
    return pDGivenH1S1 * priorS + pDGivenH1S0 * (1 - priorS);
  } else {
    return pDGivenH0S1 * priorS + pDGivenH0S0 * (1 - priorS);
  }
}

/**
 * Performs Bayesian update on agent's belief in H given evidence D.
 *
 * P(H|D) = P(D|H) * P(H) / P(D)
 */
export function bayesianUpdate(
  agent: AgentBeliefs,
  evidence: boolean,
  networkType: NetworkType,
  likelihoodRatio: number
): AgentBeliefs {
  const priorH = agent.h;
  const priorS = agent.beliefs['S'] ?? 0.5;

  // Compute likelihoods
  let pDGivenH1: number;
  let pDGivenH0: number;

  if (networkType === 'chain') {
    pDGivenH1 = computeLikelihoodChain(true, likelihoodRatio);
    pDGivenH0 = computeLikelihoodChain(false, likelihoodRatio);
  } else {
    // Collider
    pDGivenH1 = computeLikelihoodCollider(true, priorS, likelihoodRatio);
    pDGivenH0 = computeLikelihoodCollider(false, priorS, likelihoodRatio);
  }

  // Adjust for evidence=false
  if (!evidence) {
    pDGivenH1 = 1 - pDGivenH1;
    pDGivenH0 = 1 - pDGivenH0;
  }

  // Bayes rule
  const pD = pDGivenH1 * priorH + pDGivenH0 * (1 - priorH);
  const posteriorH = pD > 0 ? (pDGivenH1 * priorH) / pD : priorH;

  // Clamp to avoid numerical issues
  const clampedH = Math.max(0.001, Math.min(0.999, posteriorH));

  return {
    h: clampedH,
    beliefs: {
      ...agent.beliefs,
      H: clampedH,
    },
  };
}

/**
 * Updates belief in S (for collider network) given evidence.
 * This creates the "explaining away" effect.
 */
export function updateBeliefInS(
  agent: AgentBeliefs,
  evidence: boolean,
  networkType: NetworkType,
  likelihoodRatio: number
): AgentBeliefs {
  if (networkType !== 'collider') {
    return agent;
  }

  const priorS = agent.beliefs['S'] ?? 0.5;
  const priorH = agent.h;

  // P(S | D, H) - explaining away
  // If we see D and believe H is likely, S becomes less likely (and vice versa)
  const pDGivenH1S1 = likelihoodRatio;
  const pDGivenH1S0 = likelihoodRatio * 0.7;
  const pDGivenH0S1 = likelihoodRatio * 0.7;
  const pDGivenH0S0 = 1 - likelihoodRatio;

  // Compute P(S | D) by weighting with current H belief
  let pDGivenS1: number;
  let pDGivenS0: number;

  pDGivenS1 = pDGivenH1S1 * priorH + pDGivenH0S1 * (1 - priorH);
  pDGivenS0 = pDGivenH1S0 * priorH + pDGivenH0S0 * (1 - priorH);

  if (!evidence) {
    pDGivenS1 = 1 - pDGivenS1;
    pDGivenS0 = 1 - pDGivenS0;
  }

  const pD = pDGivenS1 * priorS + pDGivenS0 * (1 - priorS);
  const posteriorS = pD > 0 ? (pDGivenS1 * priorS) / pD : priorS;
  const clampedS = Math.max(0.001, Math.min(0.999, posteriorS));

  return {
    ...agent,
    beliefs: {
      ...agent.beliefs,
      S: clampedS,
    },
  };
}
