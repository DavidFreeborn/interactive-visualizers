import { SeededPrng } from '../model/prng';
import { resolveTownGeneratorConfig } from './config';
import { generateHistory } from './history';
import { generateRiverName } from './names';
import { TOWN_MODEL_ASSUMPTIONS, TOWN_MODEL_SOURCES } from './provenance';
import { REGION_PROFILES } from './regionalProfiles';
import { generateSettlements } from './settlements';
import { generateTerrain } from './terrain';
import { assignPeakTravelDemand, generateTransport } from './transport';
import type { GeneratedTownRegion, TownGeneratorConfigInput } from './types';
import { generateUrbanForm } from './urbanForm';
import { generateWards } from './wards';

export const TOWN_MODEL_VERSION = '1.0.0';

export function generateEnglishTownRegion(input: TownGeneratorConfigInput = {}): GeneratedTownRegion {
  const config = resolveTownGeneratorConfig(input);
  const prng = new SeededPrng(config.seed);
  const profile = REGION_PROFILES[config.region];
  const landscapeArchetype = profile.landscapeArchetypes[prng.nextInt(profile.landscapeArchetypes.length)];
  const riverName = generateRiverName(config.region, prng);
  const terrain = generateTerrain(config, profile, prng, riverName);
  const settlementResult = generateSettlements(config, profile, terrain.cells, profile.geology, terrain.rivers, prng);
  const transport = generateTransport(config, profile, terrain.cells, settlementResult.settlements, prng);
  const urban = generateUrbanForm(
    config,
    profile,
    terrain.cells,
    settlementResult.settlements,
    terrain.rivers,
    transport.roads,
    transport.railways,
    prng,
  );
  const assignedTransport = assignPeakTravelDemand(
    config,
    profile,
    urban.cells,
    transport.roads,
    transport.railways,
    settlementResult.settlements,
  );
  const wardResult = generateWards(
    config,
    profile,
    urban.cells,
    settlementResult.settlements,
    urban.facilities,
    assignedTransport.roads,
    assignedTransport.railways,
    prng,
  );
  const history = generateHistory(settlementResult.settlements, assignedTransport.roads, assignedTransport.railways, urban.facilities, prng);
  const landCells = wardResult.cells.filter((cell) => !cell.isSea);
  const totalPopulation = wardResult.cells.reduce((sum, cell) => sum + cell.population, 0);
  const totalJobs = wardResult.cells.reduce((sum, cell) => sum + cell.jobs, 0);
  const urbanLandUses = new Set(['historic-core', 'town-centre', 'local-centre', 'residential', 'mixed-use', 'industry', 'logistics', 'retail-park', 'education', 'healthcare', 'utilities', 'transport']);
  const semiNatural = new Set(['deciduous woodland', 'semi-natural grassland', 'heath and moor', 'wetland', 'river', 'coastal']);
  const meanAmPeakRoadVcr = assignedTransport.roads.length === 0 ? 0 : assignedTransport.roads.reduce((sum, road) => sum + road.volumeCapacityRatio, 0) / assignedTransport.roads.length;
  const railModeShare = assignedTransport.modeShares?.rail ?? 0;
  const carDriverModeShare = assignedTransport.modeShares?.carDriver ?? 0;
  const unabsorbedSettlementPopulation = settlementResult.settlements
    .filter((settlement, index) => index === 0 || !settlement.absorbedIntoMainUrbanArea)
    .reduce((sum, settlement) => sum + settlement.population, 0);
  const warnings = [
    'All named places and features are fictional; a generated name may accidentally resemble a real place.',
    'Small differences between seeds are scenarios, not confidence samples from a fitted statistical model.',
  ];
  if (config.river === null) warnings.push('No major river was requested; local stream topology is represented only through terrain wetness and runoff indices.');
  if (assignedTransport.railways.length === 0) warnings.push('This scenario has no surviving passenger railway; rail-loading lenses will be empty.');
  return {
    modelVersion: TOWN_MODEL_VERSION,
    scientificStatus: 'standard-toy-model',
    modelKind: 'synthetic-scenario-generator',
    config,
    landscapeArchetype,
    geologyUnits: profile.geology,
    cells: wardResult.cells,
    rivers: terrain.rivers,
    settlements: settlementResult.settlements,
    roads: assignedTransport.roads,
    streets: urban.streets,
    railways: assignedTransport.railways,
    facilities: urban.facilities,
    wards: wardResult.wards,
    history,
    summary: {
      studyAreaKm2: config.sizeKm ** 2,
      principalSettlementPopulation: settlementResult.settlements[0].population,
      totalPopulation,
      totalJobs,
      urbanisedShare: landCells.filter((cell) => urbanLandUses.has(cell.landUse)).length / Math.max(1, landCells.length),
      semiNaturalHabitatShare: landCells.filter((cell) => semiNatural.has(cell.habitat)).length / Math.max(1, landCells.length),
      railModeShare,
      carDriverModeShare,
      meanAmPeakRoadVcr,
    },
    diagnostics: {
      populationBalanceError: totalPopulation - unabsorbedSettlementPopulation,
      demographicMaximumSumError: wardResult.maximumCompositionSumError,
      cellsWithoutWard: landCells.filter((cell) => cell.wardId === null).length,
      riverDownhillShare: terrain.downhillShare,
      warnings,
    },
    assumptions: TOWN_MODEL_ASSUMPTIONS,
    sources: TOWN_MODEL_SOURCES,
  };
}
