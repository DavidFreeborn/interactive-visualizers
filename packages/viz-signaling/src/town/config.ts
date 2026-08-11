import type {
  BoundaryConditions,
  EdgeCharacter,
  EnglishRegion,
  MapSide,
  PopulationBand,
  TownGeneratorConfig,
  TownGeneratorConfigInput,
} from './types';

export const MAP_SIDES: MapSide[] = ['north', 'east', 'south', 'west'];
export const EDGE_CHARACTERS: EdgeCharacter[] = ['sea', 'uplands', 'rolling', 'lowland'];
export const POPULATION_BANDS: PopulationBand[] = ['50k', '100k', '200k'];
export const ENGLISH_REGIONS: EnglishRegion[] = [
  'north-east', 'north-west', 'yorkshire-humber', 'east-midlands', 'west-midlands',
  'east-of-england', 'london-fringe', 'south-east', 'south-west',
];

export const DEFAULT_BOUNDARIES: BoundaryConditions = {
  north: 'rolling',
  east: 'sea',
  south: 'lowland',
  west: 'uplands',
};

export const DEFAULT_TOWN_GENERATOR_CONFIG: TownGeneratorConfig = {
  seed: 20250717,
  region: 'yorkshire-humber',
  populationBand: '100k',
  mainSettlementName: null,
  sizeKm: 40,
  gridSize: 48,
  boundaries: DEFAULT_BOUNDARIES,
  river: { sourceSide: 'west', outletSide: 'east' },
};

function areAdjacent(left: MapSide, right: MapSide): boolean {
  const leftIndex = MAP_SIDES.indexOf(left);
  const rightIndex = MAP_SIDES.indexOf(right);
  return Math.abs(leftIndex - rightIndex) === 1 || Math.abs(leftIndex - rightIndex) === 3;
}

export function resolveTownGeneratorConfig(input: TownGeneratorConfigInput = {}): TownGeneratorConfig {
  const resolved: TownGeneratorConfig = {
    ...DEFAULT_TOWN_GENERATOR_CONFIG,
    ...input,
    mainSettlementName: input.mainSettlementName?.trim() || null,
    boundaries: {
      ...DEFAULT_BOUNDARIES,
      ...input.boundaries,
    },
    river: input.river === undefined ? DEFAULT_TOWN_GENERATOR_CONFIG.river : input.river,
  };

  validateTownGeneratorConfig(resolved);
  return resolved;
}

export function validateTownGeneratorConfig(config: TownGeneratorConfig): void {
  if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 0xffffffff) {
    throw new Error('Seed must be an unsigned 32-bit integer.');
  }
  if (!POPULATION_BANDS.includes(config.populationBand)) {
    throw new Error('Population band must be 50k, 100k, or 200k.');
  }
  if (!ENGLISH_REGIONS.includes(config.region)) {
    throw new Error('Broad modelling profile must be a supported English regional profile.');
  }
  if (!Number.isFinite(config.sizeKm) || config.sizeKm < 20 || config.sizeKm > 60) {
    throw new Error('Study-area side length must be between 20 and 60 km.');
  }
  if (!Number.isInteger(config.gridSize) || config.gridSize < 32 || config.gridSize > 72) {
    throw new Error('Grid size must be an integer between 32 and 72 cells per side.');
  }
  if (config.mainSettlementName !== null && !/^[A-Za-z][A-Za-z' -]{1,59}$/.test(config.mainSettlementName)) {
    throw new Error('Main settlement name must contain 2–60 Latin letters, spaces, apostrophes, or hyphens.');
  }

  const seaSides = MAP_SIDES.filter((side) => config.boundaries[side] === 'sea');
  if (seaSides.length > 2 || (seaSides.length === 2 && !areAdjacent(seaSides[0], seaSides[1]))) {
    throw new Error('A mainland English study area may have at most two adjacent sea edges.');
  }
  for (const side of MAP_SIDES) {
    if (!EDGE_CHARACTERS.includes(config.boundaries[side])) {
      throw new Error(`Invalid boundary character for ${side}.`);
    }
  }
  if (config.river !== null) {
    if (!MAP_SIDES.includes(config.river.sourceSide) || !MAP_SIDES.includes(config.river.outletSide)) {
      throw new Error('River source and outlet must use valid map sides.');
    }
    if (config.river.sourceSide === config.river.outletSide) {
      throw new Error('River source and outlet sides must be different.');
    }
    if (config.boundaries[config.river.sourceSide] === 'sea') {
      throw new Error('A major river cannot enter the study area from a sea boundary.');
    }
  }
}

export function populationBandMidpoint(band: PopulationBand): number {
  if (band === '50k') return 50_000;
  if (band === '100k') return 100_000;
  return 200_000;
}
