import { SeededPrng } from '../model/prng';
import { clamp, distance, distanceToPolyline, mode, normalizeComposition, roundComposition, valueNoise } from './math';
import { generateWardName } from './names';
import type { RegionProfile } from './regionalProfiles';
import type {
  Composition,
  EstimateInterval,
  Facility,
  HabitatType,
  HousingType,
  LandUse,
  Point,
  RailLine,
  RoadLink,
  Settlement,
  TownCell,
  TownGeneratorConfig,
  Ward,
} from './types';

interface WeightedCentroid extends Point {
  population: number;
}

function initialiseCentroids(cells: readonly TownCell[], count: number): WeightedCentroid[] {
  const populated = cells.filter((cell) => cell.population > 0);
  const first = populated.reduce((best, cell) => cell.population > best.population ? cell : best, populated[0]);
  const centroids: WeightedCentroid[] = [{ ...first.centre, population: 0 }];
  while (centroids.length < count && centroids.length < populated.length) {
    let selected = populated[0];
    let selectedScore = Number.NEGATIVE_INFINITY;
    const maxPopulation = Math.max(...populated.map((cell) => cell.population));
    for (const cell of populated) {
      const nearest = Math.min(...centroids.map((centroid) => distance(cell.centre, centroid)));
      const score = nearest ** 1.4 * (0.25 + Math.sqrt(cell.population / maxPopulation));
      if (score > selectedScore && !centroids.some((centroid) => distance(cell.centre, centroid) < 1e-8)) {
        selected = cell;
        selectedScore = score;
      }
    }
    centroids.push({ ...selected.centre, population: 0 });
  }
  return centroids;
}

function refineCentroids(cells: readonly TownCell[], centroids: WeightedCentroid[], totalPopulation: number): WeightedCentroid[] {
  const target = totalPopulation / centroids.length;
  let current = centroids;
  for (let iteration = 0; iteration < 7; iteration += 1) {
    const clusters = current.map(() => ({ x: 0, y: 0, population: 0 }));
    const orderedCells = cells.filter((cell) => cell.population > 0).sort((left, right) => right.population - left.population);
    for (const cell of orderedCells) {
      let selected = 0;
      let selectedScore = Number.POSITIVE_INFINITY;
      current.forEach((centroid, index) => {
        const balancePenalty = 1 + Math.max(0, clusters[index].population / target - 0.72) * 1.4;
        const score = distance(cell.centre, centroid) * balancePenalty;
        if (score < selectedScore) {
          selected = index;
          selectedScore = score;
        }
      });
      const cluster = clusters[selected];
      cluster.x += cell.centre.x * cell.population;
      cluster.y += cell.centre.y * cell.population;
      cluster.population += cell.population;
    }
    current = clusters.map((cluster, index) => cluster.population > 0
      ? { x: cluster.x / cluster.population, y: cluster.y / cluster.population, population: cluster.population }
      : current[index]);
  }
  return current;
}

function assignCellsToCentroids(cells: readonly TownCell[], centroids: readonly WeightedCentroid[]): number[] {
  return cells.map((cell) => {
    if (cell.isSea) return -1;
    let selected = 0;
    let selectedDistance = Number.POSITIVE_INFINITY;
    centroids.forEach((centroid, index) => {
      const nextDistance = distance(cell.centre, centroid);
      if (nextDistance < selectedDistance) {
        selected = index;
        selectedDistance = nextDistance;
      }
    });
    return selected;
  });
}

function interval(
  estimate: number,
  spread: number,
  decimals: number,
): EstimateInterval {
  const factor = 10 ** decimals;
  return {
    estimate: Math.round(estimate * factor) / factor,
    lower: Math.round((estimate - spread) * factor) / factor,
    upper: Math.round((estimate + spread) * factor) / factor,
    rangeBasis: 'hand-set-sensitivity',
  };
}

function habitatValue(habitat: HabitatType): number {
  if (habitat === 'deciduous woodland') return 0.88;
  if (habitat === 'wetland' || habitat === 'river') return 0.84;
  if (habitat === 'heath and moor' || habitat === 'semi-natural grassland') return 0.76;
  if (habitat === 'conifer plantation') return 0.58;
  if (habitat === 'improved grassland') return 0.43;
  if (habitat === 'arable') return 0.34;
  if (habitat === 'coastal') return 0.7;
  return 0.16;
}

function shareOfCells(cells: readonly TownCell[], predicate: (cell: TownCell) => boolean): number {
  if (cells.length === 0) return 0;
  return cells.filter(predicate).length / cells.length;
}

function trafficExposure(
  centroid: Point,
  roads: readonly RoadLink[],
  railways: readonly RailLine[],
  sizeKm: number,
): { road: number; rail: number } {
  let roadExposure = 0;
  for (const road of roads) {
    const distanceKm = distanceToPolyline(centroid, road.path).distance * sizeKm;
    const classFactor = road.roadClass === 'motorway' ? 1.15 : road.roadClass === 'primary-a' ? 0.9 : road.roadClass === 'secondary-a' ? 0.62 : 0.34;
    roadExposure = Math.max(roadExposure, classFactor * road.volumeCapacityRatio * Math.exp(-distanceKm / 0.82));
  }
  let railExposure = 0;
  for (const railway of railways) {
    const distanceKm = distanceToPolyline(centroid, railway.path).distance * sizeKm;
    railExposure = Math.max(railExposure, Math.min(1.25, railway.trainsPerPeakHour / 6) * Math.exp(-distanceKm / 0.55));
  }
  return { road: clamp(roadExposure / 1.15, 0, 1), rail: clamp(railExposure, 0, 1) };
}

function ageComposition(
  profile: RegionProfile,
  modernShare: number,
  bungalowShare: number,
  studentEffect: number,
  deprivation: number,
): Composition {
  const values = { ...profile.agePrior };
  values['0-15'] *= 1 + modernShare * 0.2 + deprivation * 0.04;
  values['16-24'] *= 1 + studentEffect * 1.35;
  values['25-44'] *= 1 + modernShare * 0.18 + studentEffect * 0.22;
  values['45-64'] *= 1 + bungalowShare * 0.08;
  values['65+'] *= 1 + bungalowShare * 0.5 - studentEffect * 0.18;
  return roundComposition(values);
}

function ethnicityComposition(
  config: TownGeneratorConfig,
  profile: RegionProfile,
  centroid: Point,
  centrality: number,
  studentEffect: number,
): Composition {
  const scale = config.populationBand === '50k' ? 0.72 : config.populationBand === '100k' ? 0.9 : 1.08;
  const urbanFactor = scale * (0.84 + centrality * 0.28 + studentEffect * 0.18);
  const values: Record<string, number> = {};
  let nonWhite = 0;
  for (const [category, prior] of Object.entries(profile.ethnicityPrior)) {
    if (category === 'White') continue;
    const categorySeed = category.split('').reduce((sum, letter) => sum + letter.charCodeAt(0), config.seed);
    const spatialCluster = 0.88 + (valueNoise(categorySeed, centroid.x, centroid.y, 3.2) + 1) * 0.12;
    values[category] = prior * urbanFactor * spatialCluster;
    nonWhite += values[category];
  }
  values.White = Math.max(0.08, 1 - nonWhite);
  return roundComposition(values);
}

function qualificationComposition(profile: RegionProfile, deprivation: number, centrality: number, studentEffect: number): Composition {
  const level4 = clamp(profile.level4QualificationShare + centrality * 0.055 + studentEffect * 0.12 - (deprivation - 0.45) * 0.13, 0.14, 0.68);
  const noQualifications = clamp(0.135 + deprivation * 0.13 - studentEffect * 0.025, 0.07, 0.31);
  return roundComposition({
    'No qualifications': noQualifications,
    'Level 1': 0.095 + deprivation * 0.025,
    'Level 2': 0.175,
    'Apprenticeship': 0.052 + profile.industrialLegacy * 0.025,
    'Level 3': 0.15 + studentEffect * 0.018,
    'Level 4+': level4,
    Other: 0.025,
  });
}

function occupationComposition(profile: RegionProfile, industrialShare: number, centrality: number): Composition {
  return roundComposition({
    'Manufacturing and skilled trades': profile.employmentPrior.manufacturing * (1 + industrialShare * 1.7),
    'Logistics and transport': profile.employmentPrior.logistics * (1 + industrialShare * 0.8),
    'Public services': profile.employmentPrior.public,
    'Knowledge and professional': profile.employmentPrior.knowledge * (0.86 + centrality * 0.35),
    'Retail and hospitality': profile.employmentPrior.retailHospitality * (0.9 + centrality * 0.25),
    'Primary industries': profile.employmentPrior.primary * (1.15 - centrality * 0.75),
  });
}

function tenureComposition(deprivation: number, centrality: number, councilShare: number, modernShare: number, studentEffect: number): Composition {
  const social = clamp(0.085 + councilShare * 0.58 + deprivation * 0.09, 0.05, 0.44);
  const privateRent = clamp(0.12 + centrality * 0.12 + studentEffect * 0.17, 0.08, 0.42);
  const outright = clamp(0.22 + (1 - centrality) * 0.08 - deprivation * 0.06, 0.1, 0.36);
  const mortgage = clamp(0.39 + modernShare * 0.12 - deprivation * 0.11 - studentEffect * 0.08, 0.18, 0.55);
  return roundComposition({ 'Owned outright': outright, 'Owned with mortgage': mortgage, 'Social rent': social, 'Private rent': privateRent, Other: 0.015 });
}

function maximumCompositionError(compositions: readonly Composition[]): number {
  return compositions.reduce((maximum, composition) => {
    const total = Object.values(composition).reduce((sum, value) => sum + value, 0);
    return Math.max(maximum, Math.abs(total - 1));
  }, 0);
}

export interface WardResult {
  cells: TownCell[];
  wards: Ward[];
  maximumCompositionSumError: number;
}

export function generateWards(
  config: TownGeneratorConfig,
  profile: RegionProfile,
  sourceCells: readonly TownCell[],
  settlements: readonly Settlement[],
  facilities: readonly Facility[],
  roads: readonly RoadLink[],
  railways: readonly RailLine[],
  prng: SeededPrng,
): WardResult {
  const totalPopulation = sourceCells.reduce((sum, cell) => sum + cell.population, 0);
  const populatedCellCount = sourceCells.filter((cell) => cell.population > 0).length;
  const desiredCount = Math.max(4, Math.min(40, populatedCellCount, Math.round(totalPopulation / 6_000)));
  if (desiredCount === 0) throw new Error('Ward generation requires at least one populated cell.');
  const centroids = refineCentroids(sourceCells, initialiseCentroids(sourceCells, desiredCount), totalPopulation);
  const assignments = assignCellsToCentroids(sourceCells, centroids);
  const cells = sourceCells.map((cell, index) => ({ ...cell, wardId: assignments[index] < 0 ? null : `ward-${assignments[index] + 1}` }));
  const usedWardNames = new Set<string>();
  const main = settlements[0];
  const cellAreaKm2 = (config.sizeKm / config.gridSize) ** 2;
  const allCompositions: Composition[] = [];
  const wards: Ward[] = centroids.map((centroid, wardIndex) => {
    const id = `ward-${wardIndex + 1}`;
    const wardCells = cells.filter((cell) => cell.wardId === id);
    const populatedWardCells = wardCells.filter((cell) => cell.population > 0);
    const population = wardCells.reduce((sum, cell) => sum + cell.population, 0);
    const jobs = wardCells.reduce((sum, cell) => sum + cell.jobs, 0);
    const weightedCentroid = population > 0 ? {
      x: populatedWardCells.reduce((sum, cell) => sum + cell.centre.x * cell.population, 0) / population,
      y: populatedWardCells.reduce((sum, cell) => sum + cell.centre.y * cell.population, 0) / population,
    } : centroid;
    const nearestSettlement = settlements.reduce((nearest, settlement) =>
      distance(weightedCentroid, settlement.centre) < distance(weightedCentroid, nearest.centre) ? settlement : nearest, settlements[0]);
    const name = generateWardName(prng, nearestSettlement.name, usedWardNames);
    const dominantLandUse = mode(wardCells.map((cell) => cell.landUse), 'agriculture' as LandUse);
    const housingCells = populatedWardCells.map((cell) => cell.housingType).filter((housing) => housing !== 'none');
    const dominantHousingType = mode(housingCells, 'none' as HousingType);
    const centrality = clamp(1 - distance(weightedCentroid, main.centre) / 0.36, 0, 1);
    const industryShare = shareOfCells(wardCells, (cell) => cell.landUse === 'industry' || cell.landUse === 'logistics');
    const councilShare = shareOfCells(populatedWardCells, (cell) => cell.housingType === 'post-war council estate');
    const modernShare = shareOfCells(populatedWardCells, (cell) => cell.developmentEra === '2010-present' || cell.housingType === 'modern estate');
    const bungalowShare = shareOfCells(populatedWardCells, (cell) => cell.housingType === 'bungalows');
    const terraceShare = shareOfCells(populatedWardCells, (cell) => cell.housingType === 'red-brick terrace' || cell.housingType === 'stone terrace');
    const universityDistance = facilities.filter((facility) => facility.kind === 'university')
      .reduce((nearest, facility) => Math.min(nearest, distance(weightedCentroid, facility.location) * config.sizeKm), Number.POSITIVE_INFINITY);
    const studentEffect = Number.isFinite(universityDistance) ? Math.exp(-universityDistance / 1.8) : 0;
    const spatialPerturbation = valueNoise(config.seed ^ 0xc41, weightedCentroid.x, weightedCentroid.y, 4) * 0.055;
    const deprivation = clamp(
      0.38 + profile.industrialLegacy * 0.1 + industryShare * 0.2 + councilShare * 0.25 + terraceShare * 0.06 -
      modernShare * 0.09 - centrality * 0.025 + spatialPerturbation,
      0.08,
      0.9,
    );
    const age = ageComposition(profile, modernShare, bungalowShare, studentEffect, deprivation);
    const ethnicity = ethnicityComposition(config, profile, weightedCentroid, centrality, studentEffect);
    const qualifications = qualificationComposition(profile, deprivation, centrality, studentEffect);
    const occupations = occupationComposition(profile, industryShare, centrality);
    const tenure = tenureComposition(deprivation, centrality, councilShare, modernShare, studentEffect);
    allCompositions.push(age, ethnicity, qualifications, occupations, tenure);
    const exposure = trafficExposure(weightedCentroid, roads, railways, config.sizeKm);
    const urbanShare = shareOfCells(wardCells, (cell) => !['agriculture', 'woodland', 'moorland', 'wetland', 'sea', 'river'].includes(cell.landUse));
    const coastReduction = Math.min(...wardCells.map((cell) => cell.coastDistanceKm)) < 1.5 ? 0.45 : 0;
    const pm25 = profile.pm25BackgroundUgM3 + exposure.road * 2.35 + industryShare * 1.4 + urbanShare * 0.45 - coastReduction;
    // Combine screening source levels energetically: decibels themselves are
    // logarithmic and must not be added as ordinary linear quantities.
    const screeningLevelsDb = [
      36,
      exposure.road > 0 ? 56 + 20 * Math.log10(Math.max(0.025, exposure.road)) : Number.NEGATIVE_INFINITY,
      exposure.rail > 0 ? 52 + 20 * Math.log10(Math.max(0.025, exposure.rail)) : Number.NEGATIVE_INFINITY,
      industryShare > 0 ? 49 + 10 * Math.log10(Math.max(0.02, industryShare)) : Number.NEGATIVE_INFINITY,
    ];
    const noise = 10 * Math.log10(screeningLevelsDb.reduce((sum, level) => sum + (Number.isFinite(level) ? 10 ** (level / 10) : 0), 0));
    const biodiversity = wardCells.length === 0 ? 0 : clamp(
      wardCells.reduce((sum, cell) => sum + habitatValue(cell.habitat), 0) / wardCells.length * 100 - urbanShare * 14,
      4,
      94,
    );
    const level4 = qualifications['Level 4+'] ?? profile.level4QualificationShare;
    const productiveJobShare = (occupations['Knowledge and professional'] ?? 0) + (occupations['Manufacturing and skilled trades'] ?? 0) * 0.42;
    const gva = 22_500 + level4 * 20_000 + productiveJobShare * 8_500 + centrality * 1_800;
    const lifeExpectancy = profile.lifeExpectancyBaselineYears - (deprivation - 0.42) * 5.2 - (pm25 - profile.pm25BackgroundUgM3) * 0.18 - Math.max(0, noise - 55) * 0.035;
    const households = Math.max(1, Math.round(population / (2.15 + modernShare * 0.22 - studentEffect * 0.25)));
    return {
      id,
      name,
      cellIds: wardCells.map((cell) => cell.id),
      centroid: weightedCentroid,
      areaKm2: Math.round(wardCells.length * cellAreaKm2 * 10) / 10,
      population,
      households,
      jobs,
      populationDensityPerKm2: Math.round(population / Math.max(cellAreaKm2, wardCells.length * cellAreaKm2)),
      dominantLandUse,
      dominantHousingType,
      age,
      ethnicity,
      qualifications,
      occupations,
      tenure,
      metrics: {
        relativeDeprivationIndex: Math.round(deprivation * 100),
        gvaPerResidentGbp: interval(Math.round(gva / 100) * 100, gva * 0.24, 0),
        lifeExpectancyYears: interval(lifeExpectancy, 1.9, 1),
        pm25AnnualMeanUgM3: interval(pm25, 1.7, 1),
        noiseScreeningDb: interval(noise, 4.5, 0),
        biodiversityIndex: Math.round(biodiversity),
        trafficExposureIndex: Math.round(exposure.road * 100),
      },
      interpretationNotes: [
        'All values describe a synthetic aggregate zone, not observed residents.',
        'Ethnic-group categories follow the Census 2021 high-level self-identification categories; no individual attribute is inferred.',
        'GVA, life expectancy, pollution and noise are low-certainty scenario estimates with hand-set ranges and should not be used for real decisions.',
        'Housing, industrial legacy, deprivation, qualifications and health are linked by imposed ecological correlations; the model does not claim these relationships are causal.',
      ],
    };
  });

  return { cells, wards, maximumCompositionSumError: maximumCompositionError(allCompositions) };
}
