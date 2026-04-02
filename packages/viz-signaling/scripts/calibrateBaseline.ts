import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SimulationRunner } from '../src/sim/SimulationRunner';

interface CalibrationCheckpoint {
  round: number;
  cumulativeSuccessRate: number;
  expectedSuccessRate: number;
  mutualInformationBits: number;
}

interface CalibrationRecord {
  seed: number;
  finalCumulativeSuccessRate: number;
  finalRollingSuccessRate: number;
  finalExpectedSuccessRate: number;
  finalMutualInformationBits: number;
  checkpoints: CalibrationCheckpoint[];
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function quantile(values: number[], probability: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const baseIndex = Math.floor(position);
  const fraction = position - baseIndex;
  const baseValue = sorted[baseIndex];
  const nextValue = sorted[Math.min(baseIndex + 1, sorted.length - 1)];
  return baseValue + (nextValue - baseValue) * fraction;
}

function floorToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
}

const seedCount = 200;
const rounds = 5000;
const checkpointInterval = 500;
const records: CalibrationRecord[] = [];

for (let seed = 0; seed < seedCount; seed += 1) {
  const runner = new SimulationRunner({ seed });
  const checkpoints: CalibrationCheckpoint[] = [];

  for (let round = checkpointInterval; round <= rounds; round += checkpointInterval) {
    runner.stepMany(checkpointInterval);
    const snapshot = runner.getSnapshot();
    checkpoints.push({
      round: snapshot.metrics.round,
      cumulativeSuccessRate: snapshot.metrics.cumulativeSuccessRate,
      expectedSuccessRate: snapshot.metrics.expectedSuccessRate,
      mutualInformationBits: snapshot.metrics.mutualInformationBits,
    });
  }

  const snapshot = runner.getSnapshot();
  records.push({
    seed,
    finalCumulativeSuccessRate: snapshot.metrics.cumulativeSuccessRate,
    finalRollingSuccessRate: snapshot.metrics.rollingSuccessRate,
    finalExpectedSuccessRate: snapshot.metrics.expectedSuccessRate,
    finalMutualInformationBits: snapshot.metrics.mutualInformationBits,
    checkpoints,
  });
}

const finalExpectedSuccesses = records.map((record) => record.finalExpectedSuccessRate);
const finalMutualInformations = records.map((record) => record.finalMutualInformationBits);
const finalCumulativeSuccesses = records.map((record) => record.finalCumulativeSuccessRate);

const summary = {
  model: 'baseline-single-sender',
  configuration: {
    numStates: 2,
    numMessages: 2,
    numActions: 2,
    prior: [0.5, 0.5],
    correctActions: [0, 1],
    initialReinforcement: 1,
  },
  calibration: {
    seedCount,
    rounds,
    checkpointInterval,
  },
  distributions: {
    finalExpectedSuccessRate: {
      median: median(finalExpectedSuccesses),
      lowerQuartile: quantile(finalExpectedSuccesses, 0.25),
      upperQuartile: quantile(finalExpectedSuccesses, 0.75),
    },
    finalMutualInformationBits: {
      median: median(finalMutualInformations),
      lowerQuartile: quantile(finalMutualInformations, 0.25),
      upperQuartile: quantile(finalMutualInformations, 0.75),
    },
    finalCumulativeSuccessRate: {
      median: median(finalCumulativeSuccesses),
      lowerQuartile: quantile(finalCumulativeSuccesses, 0.25),
      upperQuartile: quantile(finalCumulativeSuccesses, 0.75),
    },
  },
  regressionRecommendation: {
    seedBank: records.slice(0, 32).map((record) => record.seed),
    rounds,
    expectedSuccessMedianFloor: floorToDecimals(
      Math.max(0, quantile(finalExpectedSuccesses, 0.25) - 0.02),
      3
    ),
    mutualInformationMedianFloor: floorToDecimals(
      Math.max(0, quantile(finalMutualInformations, 0.25) - 0.03),
      3
    ),
  },
  records,
};

const currentFilePath = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(currentFilePath), '..');
const outputPath = resolve(packageRoot, 'calibration', 'baseline-2x2-calibration.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2));

console.log(`Wrote calibration results to ${outputPath}`);
