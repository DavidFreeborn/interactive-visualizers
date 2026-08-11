import { describe, expect, it } from 'vitest';
import { generateEnglishTownRegion } from './generateTown';
import { REGION_PROFILES } from './regionalProfiles';
import { assignPeakTravelDemand } from './transport';

describe('assignPeakTravelDemand', () => {
  it('loads employment-attracted trips onto the network and conserves finite mode shares', () => {
    const region = generateEnglishTownRegion({ gridSize: 32, sizeKm: 36, seed: 515, populationBand: '100k' });
    const profile = REGION_PROFILES[region.config.region];
    const zeroJobCells = region.cells.map((cell) => ({ ...cell, jobs: 0 }));
    const withoutAttractions = assignPeakTravelDemand(
      region.config,
      profile,
      zeroJobCells,
      region.roads,
      region.railways,
      region.settlements,
    );
    const withAttractions = assignPeakTravelDemand(
      region.config,
      profile,
      region.cells,
      region.roads,
      region.railways,
      region.settlements,
    );

    const noJobRoadFlow = withoutAttractions.roads.reduce((sum, road) => sum + road.amPeakVehicles, 0);
    const assignedRoadFlow = withAttractions.roads.reduce((sum, road) => sum + road.amPeakVehicles, 0);
    expect(assignedRoadFlow).toBeGreaterThan(noJobRoadFlow);
    expect(withoutAttractions.modeShares).toEqual({ carDriver: 0, rail: 0 });
    expect(withAttractions.modeShares!.carDriver).toBeGreaterThan(0);
    expect(withAttractions.modeShares!.carDriver + withAttractions.modeShares!.rail).toBeLessThanOrEqual(1);
    expect(withAttractions.roads.every((road) => Number.isFinite(road.amPeakVehicles) && road.amPeakVehicles >= 0 && Number.isFinite(road.congestedMinutes))).toBe(true);
    expect(withAttractions.railways.every((line) => Number.isFinite(line.peakDirectionPassengers) && line.peakDirectionPassengers >= 0 && Number.isFinite(line.loadFactor))).toBe(true);
  });
});
