import { describe, expect, it } from 'vitest';
import { ENGLISH_REGIONS, populationBandMidpoint, resolveTownGeneratorConfig } from './config';
import { generateEnglishTownRegion } from './generateTown';
import { REGION_PROFILES } from './regionalProfiles';
import type { Composition, MapSide, Point, TownGeneratorConfigInput } from './types';

const FAST_CONFIG: TownGeneratorConfigInput = { gridSize: 32, sizeKm: 36 };

function compositionTotal(composition: Composition): number {
  return Object.values(composition).reduce((sum, share) => sum + share, 0);
}

function expectPointOnSide(point: Point, side: MapSide): void {
  if (side === 'north') expect(point.y).toBeLessThan(0.02);
  if (side === 'east') expect(point.x).toBeGreaterThan(0.98);
  if (side === 'south') expect(point.y).toBeGreaterThan(0.98);
  if (side === 'west') expect(point.x).toBeLessThan(0.02);
}

describe('town generator configuration', () => {
  it('resolves a valid reproducible default', () => {
    const config = resolveTownGeneratorConfig();
    expect(config.seed).toBe(20250717);
    expect(config.gridSize).toBe(48);
    expect(config.river).toEqual({ sourceSide: 'west', outletSide: 'east' });
  });

  it('rejects physically incoherent or out-of-range inputs', () => {
    expect(() => resolveTownGeneratorConfig({ sizeKm: 10 })).toThrow(/between 20 and 60/);
    expect(() => resolveTownGeneratorConfig({ gridSize: 20 })).toThrow(/between 32 and 72/);
    expect(() => resolveTownGeneratorConfig({ river: { sourceSide: 'west', outletSide: 'west' } })).toThrow(/different/);
    expect(() => resolveTownGeneratorConfig({ boundaries: { north: 'sea', south: 'sea' } })).toThrow(/adjacent sea edges/);
    expect(() => resolveTownGeneratorConfig({ seed: -1 })).toThrow(/unsigned 32-bit/);
    expect(() => resolveTownGeneratorConfig({ seed: 0x1_0000_0000 })).toThrow(/unsigned 32-bit/);
    expect(() => resolveTownGeneratorConfig({ sizeKm: Number.NaN })).toThrow(/between 20 and 60/);
    expect(() => resolveTownGeneratorConfig({ gridSize: 32.5 })).toThrow(/integer/);
    expect(() => resolveTownGeneratorConfig({ mainSettlementName: 'A' })).toThrow(/2–60/);
    expect(() => resolveTownGeneratorConfig({ region: 'not-a-region' as TownGeneratorConfigInput['region'] })).toThrow(/supported/);
    expect(() => resolveTownGeneratorConfig({ boundaries: { north: 'rolling', east: 'rolling', south: 'lowland', west: 'sea' }, river: { sourceSide: 'west', outletSide: 'east' } })).toThrow(/cannot enter/);
  });

  it('accepts inclusive numeric endpoints', () => {
    expect(resolveTownGeneratorConfig({ seed: 0, sizeKm: 20, gridSize: 32 }).seed).toBe(0);
    expect(resolveTownGeneratorConfig({ seed: 0xffffffff, sizeKm: 60, gridSize: 72 }).seed).toBe(0xffffffff);
  });
});

describe('generateEnglishTownRegion', () => {
  it('is exactly deterministic for a fixed seed and configuration', () => {
    const first = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 142 });
    const second = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 142 });
    expect(second).toEqual(first);
  });

  it('changes structural outputs when the seed changes', () => {
    const first = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 142 });
    const second = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 143 });
    expect(second.cells.map((cell) => cell.elevationM)).not.toEqual(first.cells.map((cell) => cell.elevationM));
    expect(second.settlements.map((settlement) => settlement.name)).not.toEqual(first.settlements.map((settlement) => settlement.name));
  });

  it('balances population, jobs and ward assignments without hidden residuals', () => {
    const region = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 71, populationBand: '200k' });
    const cellPopulation = region.cells.reduce((sum, cell) => sum + cell.population, 0);
    const wardPopulation = region.wards.reduce((sum, ward) => sum + ward.population, 0);
    const cellJobs = region.cells.reduce((sum, cell) => sum + cell.jobs, 0);
    expect(cellPopulation).toBe(region.summary.totalPopulation);
    expect(wardPopulation).toBe(region.summary.totalPopulation);
    expect(cellJobs).toBe(region.summary.totalJobs);
    expect(region.diagnostics.populationBalanceError).toBe(0);
    expect(region.diagnostics.cellsWithoutWard).toBe(0);
    expect(region.cells.filter((cell) => !cell.isSea).every((cell) => cell.wardId !== null)).toBe(true);
    expect(region.streets.length).toBeGreaterThan(0);
    expect(region.streets.every((street) => street.path.length >= 2)).toBe(true);
    expect(region.summary.carDriverModeShare).toBeGreaterThan(0);
    expect(region.summary.carDriverModeShare).toBeLessThan(1);
    expect(region.summary.railModeShare).toBeGreaterThanOrEqual(0);
    expect(region.summary.railModeShare).toBeLessThan(1);
  });

  it('normalises every demographic composition and contains estimates in their intervals', () => {
    const region = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 912, region: 'west-midlands' });
    for (const ward of region.wards) {
      for (const composition of [ward.age, ward.ethnicity, ward.qualifications, ward.occupations, ward.tenure]) {
        expect(compositionTotal(composition)).toBeCloseTo(1, 10);
        expect(Object.values(composition).every((share) => share >= 0 && share <= 1)).toBe(true);
      }
      for (const estimate of [ward.metrics.gvaPerResidentGbp, ward.metrics.lifeExpectancyYears, ward.metrics.pm25AnnualMeanUgM3, ward.metrics.noiseScreeningDb]) {
        expect(estimate.lower).toBeLessThanOrEqual(estimate.estimate);
        expect(estimate.upper).toBeGreaterThanOrEqual(estimate.estimate);
      }
    }
    expect(region.diagnostics.demographicMaximumSumError).toBeLessThan(1e-10);
  });

  it('respects coastal and river boundary conditions', () => {
    const coastal = generateEnglishTownRegion({
      ...FAST_CONFIG,
      seed: 404,
      boundaries: { north: 'rolling', east: 'sea', south: 'lowland', west: 'uplands' },
      river: { sourceSide: 'west', outletSide: 'east' },
    });
    expect(coastal.cells.filter((cell) => cell.column === 31).some((cell) => cell.isSea)).toBe(true);
    expect(coastal.rivers.length).toBeGreaterThan(0);
    expect(coastal.rivers[0].path[0].x).toBeLessThan(0.02);
    expect(coastal.rivers[0].path.at(-1)?.x).toBeGreaterThan(0.98);

    const inland = generateEnglishTownRegion({
      ...FAST_CONFIG,
      seed: 404,
      boundaries: { north: 'rolling', east: 'rolling', south: 'rolling', west: 'rolling' },
      river: null,
    });
    expect(inland.cells.some((cell) => cell.isSea)).toBe(false);
    expect(inland.rivers).toHaveLength(0);
  });

  it('routes all 12 directed river side-pairs with a non-rising stored bed profile', () => {
    const sides: MapSide[] = ['north', 'east', 'south', 'west'];
    let seed = 2_000;
    for (const sourceSide of sides) {
      for (const outletSide of sides) {
        if (sourceSide === outletSide) continue;
        const region = generateEnglishTownRegion({
          ...FAST_CONFIG,
          seed: seed++,
          boundaries: { north: 'rolling', east: 'lowland', south: 'rolling', west: 'uplands' },
          river: { sourceSide, outletSide },
        });
        const river = region.rivers[0];
        expectPointOnSide(river.path[0], sourceSide);
        expectPointOnSide(river.path.at(-1)!, outletSide);
        expect(river.bedElevationM).toHaveLength(river.path.length);
        expect(river.bedElevationM!.every((elevation, index) => index === 0 || elevation <= river.bedElevationM![index - 1])).toBe(true);
        expect(region.diagnostics.riverDownhillShare).toBeGreaterThanOrEqual(0.85);
      }
    }
  });

  it('uses only the selected regional geology and internally consistent transport metrics', () => {
    const region = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 277, region: 'north-east', populationBand: '200k' });
    const validGeology = new Set(REGION_PROFILES['north-east'].geology.map((unit) => unit.id));
    expect(region.cells.every((cell) => validGeology.has(cell.bedrockUnitId))).toBe(true);
    for (const road of region.roads) {
      expect(road.congestedMinutes).toBeGreaterThanOrEqual(road.freeFlowMinutes);
      expect(road.meanSpeedKph).toBeGreaterThan(0);
      expect(road.volumeCapacityRatio).toBeCloseTo(road.amPeakVehicles / road.hourlyCapacity, 1);
      expect(['free-flow', 'busy', 'congested', 'oversaturated']).toContain(road.congestionState);
    }
    for (const railway of region.railways) {
      expect(railway.loadFactor).toBeCloseTo(
        railway.peakDirectionPassengers / (railway.trainsPerPeakHour * railway.seatedCapacityPerTrain),
        1,
      );
    }
  });

  it('satisfies shared invariants across every modelling profile and population band', () => {
    const bands: TownGeneratorConfigInput['populationBand'][] = ['50k', '100k', '200k'];
    ENGLISH_REGIONS.forEach((profileName, profileIndex) => {
      bands.forEach((populationBand, bandIndex) => {
        const topology = profileIndex % 3;
        const boundaries = topology === 0
          ? { north: 'rolling' as const, east: 'lowland' as const, south: 'rolling' as const, west: 'uplands' as const }
          : topology === 1
            ? { north: 'rolling' as const, east: 'sea' as const, south: 'lowland' as const, west: 'uplands' as const }
            : { north: 'sea' as const, east: 'sea' as const, south: 'lowland' as const, west: 'uplands' as const };
        const river = topology === 0 ? null : topology === 1
          ? { sourceSide: 'west' as const, outletSide: 'east' as const }
          : { sourceSide: 'west' as const, outletSide: 'north' as const };
        const generated = generateEnglishTownRegion({
          ...FAST_CONFIG,
          region: profileName,
          populationBand,
          seed: 1_000 + profileIndex * 10 + bandIndex,
          boundaries,
          river,
        });
        expect(generated.cells).toHaveLength(32 ** 2);
        expect(generated.diagnostics.populationBalanceError).toBe(0);
        expect(generated.diagnostics.cellsWithoutWard).toBe(0);
        expect(generated.cells.every((cell, index) => cell.id === index)).toBe(true);
        expect(generated.cells.every((cell) => Number.isFinite(cell.elevationM) && cell.slope >= 0 && cell.slope <= 1 && cell.runoffIndex >= 0 && cell.runoffIndex <= 1)).toBe(true);
        expect(generated.cells.filter((cell) => cell.isSea).every((cell) => cell.population === 0 && cell.jobs === 0)).toBe(true);
        expect([...generated.rivers, ...generated.roads, ...generated.railways].every((feature) =>
          feature.path.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1),
        )).toBe(true);
        if (generated.diagnostics.riverDownhillShare !== null) {
          expect(generated.diagnostics.riverDownhillShare).toBeGreaterThanOrEqual(0);
          expect(generated.diagnostics.riverDownhillShare).toBeLessThanOrEqual(1);
        }
        const midpoint = populationBandMidpoint(populationBand!);
        expect(generated.summary.principalSettlementPopulation).toBeGreaterThanOrEqual(midpoint * 0.92);
        expect(generated.summary.principalSettlementPopulation).toBeLessThanOrEqual(midpoint * 1.08);
      });
    });
  });

  it('forms an exact ward partition and keeps streets and facilities on valid generated land', () => {
    const region = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 801, populationBand: '200k' });
    const landIds = region.cells.filter((cell) => !cell.isSea).map((cell) => cell.id).sort((left, right) => left - right);
    const wardIds = region.wards.flatMap((ward) => ward.cellIds).sort((left, right) => left - right);
    expect(wardIds).toEqual(landIds);
    expect(new Set(wardIds).size).toBe(wardIds.length);
    for (const ward of region.wards) {
      expect(ward.population).toBe(ward.cellIds.reduce((sum, cellId) => sum + region.cells[cellId].population, 0));
      expect(ward.jobs).toBe(ward.cellIds.reduce((sum, cellId) => sum + region.cells[cellId].jobs, 0));
      expect(ward.cellIds.every((cellId) => region.cells[cellId].wardId === ward.id)).toBe(true);
    }
    expect(new Set(region.streets.map((street) => street.id)).size).toBe(region.streets.length);
    expect(region.streets.every((street) => street.path.every((point) => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1))).toBe(true);
    expect(region.facilities.every((facility) => {
      const column = Math.min(31, Math.floor(facility.location.x * 32));
      const row = Math.min(31, Math.floor(facility.location.y * 32));
      return !region.cells[row * 32 + column].isSea;
    })).toBe(true);
  });

  it('labels its epistemic status and preserves explicit provenance and caveats', () => {
    const region = generateEnglishTownRegion({ ...FAST_CONFIG, seed: 19 });
    expect(region.scientificStatus).toBe('standard-toy-model');
    expect(region.modelKind).toBe('synthetic-scenario-generator');
    expect(region.sources.length).toBeGreaterThanOrEqual(10);
    expect(region.assumptions.some((assumption) => /GVA/i.test(assumption))).toBe(true);
    expect(region.diagnostics.warnings.some((warning) => /fictional/i.test(warning))).toBe(true);
    expect(region.wards.every((ward) => ward.interpretationNotes.some((note) => /synthetic/i.test(note)))).toBe(true);
  });
});
