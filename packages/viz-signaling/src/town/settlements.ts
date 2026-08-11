import { SeededPrng } from '../model/prng';
import { populationBandMidpoint } from './config';
import { distance } from './math';
import { generateSettlementName } from './names';
import type { RegionProfile } from './regionalProfiles';
import type {
  GeologyUnit,
  RiverFeature,
  Settlement,
  SettlementKind,
  TerrainCell,
  TownGeneratorConfig,
} from './types';

function chooseMainSite(
  cells: readonly TerrainCell[],
  config: TownGeneratorConfig,
  profile: RegionProfile,
  prng: SeededPrng,
): TerrainCell {
  const candidates = cells.filter((cell) => !cell.isSea && cell.slope < 0.24 && cell.floodRisk !== 'high');
  if (candidates.length === 0) {
    throw new Error('Boundary conditions leave no buildable site for the principal settlement.');
  }

  let best = candidates[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const cell of candidates) {
    const centreScore = 1 - Math.min(1, distance(cell.centre, { x: 0.5, y: 0.5 }) / 0.7);
    const riverScore = config.river === null ? 0 : Math.exp(-cell.riverDistanceKm / 1.1) * 1.35;
    const coastPortScore = Number.isFinite(cell.coastDistanceKm)
      ? Math.exp(-Math.abs(cell.coastDistanceKm - 1.2) / 1.8) * profile.portPropensity * 0.75
      : 0;
    const floodPenalty = cell.floodRisk === 'medium' ? 0.35 : 0;
    const slopePenalty = cell.slope * 3.4;
    const fertilityScore = ['1', '2', '3a'].includes(cell.agriculturalGrade) ? 0.12 : 0;
    const jitter = prng.nextFloat() * 0.08;
    const score = centreScore + riverScore + coastPortScore + fertilityScore - floodPenalty - slopePenalty + jitter;
    if (score > bestScore) {
      best = cell;
      bestScore = score;
    }
  }
  return best;
}

function settlementKind(
  main: boolean,
  population: number,
  cell: TerrainCell,
  geology: GeologyUnit,
  profile: RegionProfile,
  prng: SeededPrng,
): SettlementKind {
  if (cell.coastDistanceKm < 2.2 && prng.nextFloat() < profile.portPropensity) return 'port-town';
  if (geology.resource === 'coal' && prng.nextFloat() < profile.industrialLegacy) return main ? 'industrial-town' : 'mining-village';
  if (main) return population >= 175_000 ? 'principal-city' : 'principal-town';
  if (population >= 5_000) return 'market-town';
  return 'village';
}

function originFor(kind: SettlementKind, prng: SeededPrng): { era: string; driver: string; roman: boolean } {
  if (kind === 'port-town') return { era: 'medieval core; major growth 1750–1914', driver: 'estuary or coastal trade, later rail-served docks', roman: false };
  if (kind === 'industrial-town' || kind === 'mining-village') return { era: 'medieval or early-modern precursor; major growth 1780–1914', driver: 'extractive or manufacturing industry tied to local geology and transport', roman: false };
  const draw = prng.nextFloat();
  if (draw < 0.08) return { era: 'Roman-origin site with medieval continuity', driver: 'strategic route crossing and later market functions', roman: true };
  if (draw < 0.48) return { era: 'early medieval', driver: 'agricultural settlement at a defensible crossing or route junction', roman: false };
  if (draw < 0.86) return { era: 'medieval market foundation', driver: 'periodic market serving an agricultural hinterland', roman: false };
  return { era: 'early modern', driver: 'roadside, estate, or proto-industrial settlement', roman: false };
}

export interface SettlementResult {
  settlements: Settlement[];
  mainCell: TerrainCell;
}

export function generateSettlements(
  config: TownGeneratorConfig,
  profile: RegionProfile,
  terrain: readonly TerrainCell[],
  geologyUnits: readonly GeologyUnit[],
  _rivers: readonly RiverFeature[],
  prng: SeededPrng,
): SettlementResult {
  const mainCell = chooseMainSite(terrain, config, profile, prng);
  const geologyById = new Map(geologyUnits.map((geology) => [geology.id, geology]));
  const midpoint = populationBandMidpoint(config.populationBand);
  const mainPopulation = Math.round((midpoint * (0.92 + prng.nextFloat() * 0.16)) / 100) * 100;
  const provisionalMainKind = settlementKind(true, mainPopulation, mainCell, geologyById.get(mainCell.bedrockUnitId)!, profile, prng);
  const mainOrigin = originFor(provisionalMainKind, prng);
  const usedNames = new Set<string>();
  const generatedMainName = generateSettlementName({
    region: config.region,
    nearRiver: mainCell.riverDistanceKm < 1.4,
    nearCoast: mainCell.coastDistanceKm < 2.4,
    wooded: ['deciduous woodland', 'conifer plantation'].includes(mainCell.habitat),
    valley: mainCell.riverDistanceKm < 2,
    upland: mainCell.elevationM > profile.baseElevationM + profile.reliefM * 0.35,
    romanOrigin: mainOrigin.roman,
    isSecondary: false,
  }, prng, usedNames);
  const mainName = config.mainSettlementName ?? generatedMainName.name;
  usedNames.add(mainName);
  const settlements: Settlement[] = [{
    id: 'settlement-main',
    name: mainName,
    kind: provisionalMainKind,
    centre: mainCell.centre,
    population: mainPopulation,
    foundedEra: mainOrigin.era,
    historicalDriver: mainOrigin.driver,
    etymology: config.mainSettlementName === null ? generatedMainName.etymology : null,
    absorbedIntoMainUrbanArea: false,
  }];

  const desiredCount = config.populationBand === '50k' ? 6 : config.populationBand === '100k' ? 8 : 10;
  const minimumSeparation = 2.8 / config.sizeKm;
  const candidates = terrain
    .filter((cell) => !cell.isSea && cell.slope < 0.2 && cell.floodRisk !== 'high' && distance(cell.centre, mainCell.centre) > minimumSeparation)
    .map((cell) => ({
      cell,
      score: (1 - cell.slope * 3) + Math.exp(-cell.riverDistanceKm / 1.7) * 0.6 +
        (['1', '2', '3a'].includes(cell.agriculturalGrade) ? 0.3 : 0) + prng.nextFloat() * 0.25,
    }))
    .sort((left, right) => right.score - left.score);

  for (const candidate of candidates) {
    if (settlements.length >= desiredCount + 1) break;
    if (settlements.some((settlement) => distance(settlement.centre, candidate.cell.centre) < minimumSeparation)) continue;
    const absorbed = distance(candidate.cell.centre, mainCell.centre) * config.sizeKm < (mainPopulation >= 175_000 ? 7 : mainPopulation >= 80_000 ? 5.2 : 4.1);
    const population = absorbed
      ? Math.round((2_500 + prng.nextFloat() * 8_000) / 100) * 100
      : Math.round((700 + prng.nextFloat() ** 1.7 * 11_000) / 100) * 100;
    const geology = geologyById.get(candidate.cell.bedrockUnitId)!;
    const kind = absorbed ? 'suburb' : settlementKind(false, population, candidate.cell, geology, profile, prng);
    const origin = originFor(kind, prng);
    const generated = generateSettlementName({
      region: config.region,
      nearRiver: candidate.cell.riverDistanceKm < 1.2,
      nearCoast: candidate.cell.coastDistanceKm < 1.8,
      wooded: ['deciduous woodland', 'conifer plantation'].includes(candidate.cell.habitat),
      valley: candidate.cell.riverDistanceKm < 2,
      upland: candidate.cell.elevationM > profile.baseElevationM + profile.reliefM * 0.35,
      romanOrigin: origin.roman,
      isSecondary: true,
    }, prng, usedNames);
    settlements.push({
      id: `settlement-${settlements.length}`,
      name: generated.name,
      kind,
      centre: candidate.cell.centre,
      population,
      foundedEra: origin.era,
      historicalDriver: origin.driver,
      etymology: generated.etymology,
      absorbedIntoMainUrbanArea: absorbed,
    });
  }

  return { settlements, mainCell };
}
