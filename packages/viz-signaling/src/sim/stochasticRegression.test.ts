import { describe, expect, it } from 'vitest';
import calibration from '../../calibration/baseline-2x2-calibration.json';
import { SimulationRunner } from './SimulationRunner';

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

describe('baseline stochastic regression', () => {
  it('matches the calibrated median expected success threshold over an honest seed bank', () => {
    const values = calibration.regressionRecommendation.seedBank.map((seed) => {
      const runner = new SimulationRunner({ seed });
      runner.stepMany(calibration.regressionRecommendation.rounds);
      return runner.getSnapshot().metrics.expectedSuccessRate;
    });

    expect(median(values)).toBeGreaterThanOrEqual(
      calibration.regressionRecommendation.expectedSuccessMedianFloor
    );
  });

  it('matches the calibrated median mutual-information threshold over an honest seed bank', () => {
    const values = calibration.regressionRecommendation.seedBank.map((seed) => {
      const runner = new SimulationRunner({ seed });
      runner.stepMany(calibration.regressionRecommendation.rounds);
      return runner.getSnapshot().metrics.mutualInformationBits;
    });

    expect(median(values)).toBeGreaterThanOrEqual(
      calibration.regressionRecommendation.mutualInformationMedianFloor
    );
  });
});
