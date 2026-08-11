import { SeededPrng } from '../model/prng';
import { clamp, distance, distanceToPolyline } from './math';
import type { RegionProfile } from './regionalProfiles';
import type {
  DevelopmentEra,
  Facility,
  FacilityKind,
  HousingType,
  LandUse,
  LocalStreet,
  LocalStreetPattern,
  RailLine,
  RiverFeature,
  RoadLink,
  Settlement,
  TerrainCell,
  TownCell,
  TownGeneratorConfig,
} from './types';

function builtRadiusKm(population: number, main: boolean): number {
  const grossDensity = main ? 3_250 : 2_350;
  return Math.sqrt((population / grossDensity) / Math.PI) * (main ? 1.08 : 1);
}

function nearestRoadDistanceKm(point: TerrainCell['centre'], roads: readonly RoadLink[], sizeKm: number): number {
  return roads.reduce((nearest, road) => Math.min(nearest, distanceToPolyline(point, road.path).distance * sizeKm), Number.POSITIVE_INFINITY);
}

function nearestRailDistanceKm(point: TerrainCell['centre'], railways: readonly RailLine[], sizeKm: number): number {
  return railways.reduce((nearest, line) => Math.min(nearest, distanceToPolyline(point, line.path).distance * sizeKm), Number.POSITIVE_INFINITY);
}

function developmentEra(distanceRatio: number, prng: SeededPrng): DevelopmentEra {
  const adjusted = distanceRatio + (prng.nextFloat() - 0.5) * 0.12;
  if (adjusted < 0.17) return 'pre-1800';
  if (adjusted < 0.42) return '1800-1918';
  if (adjusted < 0.62) return '1919-1945';
  if (adjusted < 0.8) return '1946-1979';
  if (adjusted < 0.96) return '1980-2009';
  return '2010-present';
}

function housingFor(era: DevelopmentEra, profile: RegionProfile, prng: SeededPrng): HousingType {
  if (era === 'pre-1800') return 'historic mixed frontage';
  if (era === '1800-1918') return prng.nextFloat() < profile.terraceBias ? profile.vernacularTerrace : 'historic mixed frontage';
  if (era === '1919-1945') return 'inter-war semi-detached';
  if (era === '1946-1979') return prng.nextFloat() < 0.48 ? 'post-war council estate' : 'post-war private suburb';
  if (era === '1980-2009') return prng.nextFloat() < 0.12 ? 'bungalows' : 'post-war private suburb';
  return 'modern estate';
}

function densityFor(landUse: LandUse, housing: HousingType): number {
  if (landUse === 'historic-core' || landUse === 'town-centre' || housing === 'urban flats') return 7_800;
  if (housing === 'red-brick terrace' || housing === 'stone terrace') return 6_200;
  if (housing === 'post-war council estate') return 4_500;
  if (housing === 'inter-war semi-detached') return 3_050;
  if (housing === 'modern estate') return 3_650;
  if (housing === 'bungalows') return 2_050;
  if (landUse === 'mixed-use' || landUse === 'local-centre') return 4_800;
  return landUse === 'residential' ? 2_750 : 0;
}

function baseRuralLandUse(cell: TerrainCell): LandUse {
  if (cell.isSea) return 'sea';
  if (cell.habitat === 'river') return 'river';
  if (cell.habitat === 'deciduous woodland' || cell.habitat === 'conifer plantation') return 'woodland';
  if (cell.habitat === 'heath and moor') return 'moorland';
  if (cell.habitat === 'wetland' || cell.habitat === 'coastal') return 'wetland';
  return 'agriculture';
}

function allocateIntegerTotal(weights: readonly number[], target: number): number[] {
  const totalWeight = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (target <= 0 || totalWeight <= 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (Math.max(0, weight) / totalWeight) * target);
  const allocated = exact.map(Math.floor);
  const remaining = target - allocated.reduce((sum, value) => sum + value, 0);
  const order = exact.map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (let index = 0; index < remaining; index += 1) {
    allocated[order[index % order.length].index] += 1;
  }
  return allocated;
}

function closestCellIndex(cells: readonly TownCell[], location: { x: number; y: number }, predicate?: (cell: TownCell) => boolean): number {
  let selected = -1;
  let selectedDistance = Number.POSITIVE_INFINITY;
  cells.forEach((cell, index) => {
    if (cell.isSea || (predicate && !predicate(cell))) return;
    const nextDistance = distance(cell.centre, location);
    if (nextDistance < selectedDistance) {
      selected = index;
      selectedDistance = nextDistance;
    }
  });
  return selected;
}

function addFacility(
  cells: TownCell[],
  facilities: Facility[],
  kind: FacilityKind,
  name: string,
  location: { x: number; y: number },
  establishedEra: string,
  sitingRationale: string,
  landUse: LandUse,
  predicate?: (cell: TownCell) => boolean,
): void {
  const index = closestCellIndex(cells, location, predicate);
  if (index < 0) return;
  const cell = cells[index];
  cells[index] = {
    ...cell,
    landUse,
    residentialCapacity: landUse === 'education' || landUse === 'healthcare' || landUse === 'utilities' || landUse === 'transport' ? 0 : cell.residentialCapacity,
    housingType: landUse === 'residential' || landUse === 'mixed-use' ? cell.housingType : 'none',
  };
  facilities.push({
    id: `facility-${facilities.length + 1}`,
    name,
    kind,
    location: cell.centre,
    establishedEra,
    sitingRationale,
  });
}

export interface UrbanFormResult {
  cells: TownCell[];
  facilities: Facility[];
  streets: LocalStreet[];
}

function streetPatternFor(era: DevelopmentEra): LocalStreetPattern {
  if (era === 'pre-1800') return 'historic-irregular';
  if (era === '1800-1918') return 'terrace-grid';
  if (era === '1919-1945') return 'inter-war-avenue';
  if (era === '1946-1979') return 'post-war-distributor';
  return 'contemporary-block';
}

function makeLocalStreet(cell: TownCell, config: TownGeneratorConfig, prng: SeededPrng, index: number): LocalStreet {
  const half = 0.43 / config.gridSize;
  const centre = cell.centre;
  const jitter = () => (prng.nextFloat() - 0.5) * half * 0.28;
  const pattern = streetPatternFor(cell.developmentEra);
  let path: LocalStreet['path'];
  if (pattern === 'historic-irregular') {
    path = [
      { x: centre.x - half, y: centre.y + jitter() },
      { x: centre.x - half * 0.28, y: centre.y - half * 0.18 + jitter() },
      { x: centre.x + half * 0.22, y: centre.y + half * 0.16 + jitter() },
      { x: centre.x + half, y: centre.y + jitter() },
    ];
  } else if (pattern === 'terrace-grid') {
    const vertical = (cell.row + cell.column) % 2 === 0;
    path = vertical
      ? [{ x: centre.x + jitter(), y: centre.y - half }, { x: centre.x + jitter(), y: centre.y + half }]
      : [{ x: centre.x - half, y: centre.y + jitter() }, { x: centre.x + half, y: centre.y + jitter() }];
  } else if (pattern === 'inter-war-avenue') {
    path = [
      { x: centre.x - half, y: centre.y + half * 0.35 },
      { x: centre.x - half * 0.35, y: centre.y - half * 0.18 },
      { x: centre.x + half * 0.35, y: centre.y - half * 0.32 },
      { x: centre.x + half, y: centre.y + half * 0.12 },
    ];
  } else if (pattern === 'post-war-distributor') {
    const flip = (cell.id + index) % 2 === 0 ? 1 : -1;
    path = [
      { x: centre.x - half, y: centre.y - half * 0.55 * flip },
      { x: centre.x - half * 0.12, y: centre.y - half * 0.2 * flip },
      { x: centre.x + half * 0.48, y: centre.y + half * 0.22 * flip },
      { x: centre.x + half * 0.14, y: centre.y + half * 0.56 * flip },
    ];
  } else {
    path = [
      { x: centre.x - half, y: centre.y - half * 0.45 },
      { x: centre.x - half * 0.2, y: centre.y - half * 0.45 },
      { x: centre.x + half * 0.45, y: centre.y - half * 0.12 },
      { x: centre.x + half * 0.28, y: centre.y + half * 0.48 },
      { x: centre.x - half * 0.55, y: centre.y + half * 0.3 },
    ];
  }
  return { id: `street-${index + 1}`, pattern, developmentEra: cell.developmentEra, path };
}

export function generateUrbanForm(
  config: TownGeneratorConfig,
  profile: RegionProfile,
  terrain: readonly TerrainCell[],
  settlements: readonly Settlement[],
  rivers: readonly RiverFeature[],
  roads: readonly RoadLink[],
  railways: readonly RailLine[],
  prng: SeededPrng,
): UrbanFormResult {
  const main = settlements[0];
  const allocationSettlements = settlements.filter((settlement, index) => index === 0 || !settlement.absorbedIntoMainUrbanArea);
  const mainRadius = builtRadiusKm(main.population, true);
  const cellAreaKm2 = (config.sizeKm / config.gridSize) ** 2;
  const cells: TownCell[] = terrain.map((cell) => {
    const defaultLandUse = baseRuralLandUse(cell);
    if (cell.isSea || defaultLandUse === 'river') {
      return { ...cell, landUse: defaultLandUse, developmentEra: 'undeveloped', housingType: 'none', population: 0, jobs: 0, residentialCapacity: 0, wardId: null };
    }

    let closest = settlements[0];
    let closestRatio = Number.POSITIVE_INFINITY;
    let closestDistanceKm = Number.POSITIVE_INFINITY;
    settlements.forEach((settlement, index) => {
      const distanceKm = distance(cell.centre, settlement.centre) * config.sizeKm;
      const radius = builtRadiusKm(settlement.population, index === 0 || settlement.absorbedIntoMainUrbanArea);
      const ratio = distanceKm / Math.max(0.65, radius);
      if (ratio < closestRatio) {
        closest = settlement;
        closestRatio = ratio;
        closestDistanceKm = distanceKm;
      }
    });

    const roadDistanceKm = nearestRoadDistanceKm(cell.centre, roads, config.sizeKm);
    const corridorBonus = roadDistanceKm < 0.55 ? 0.13 * (1 - roadDistanceKm / 0.55) : 0;
    const absorbedBonus = closest.absorbedIntoMainUrbanArea ? 0.16 : 0;
    const terrainPenalty = cell.slope * 3.2 + (cell.floodRisk === 'high' ? 0.5 : cell.floodRisk === 'medium' ? 0.16 : 0);
    const builtScore = closestRatio - corridorBonus - absorbedBonus + terrainPenalty + (prng.nextFloat() - 0.5) * 0.1;
    if (builtScore >= 1.03) {
      const parkNearTown = closestDistanceKm < mainRadius * 1.2 && cell.floodRisk !== 'very-low' && prng.nextFloat() < 0.18;
      return { ...cell, landUse: parkNearTown ? 'park' : defaultLandUse, developmentEra: 'undeveloped', housingType: 'none', population: 0, jobs: 0, residentialCapacity: 0, wardId: null };
    }

    const era = developmentEra(clamp(closestRatio, 0, 1.1), prng);
    let landUse: LandUse = 'residential';
    let housingType = housingFor(era, profile, prng);
    const mainDistanceKm = distance(cell.centre, main.centre) * config.sizeKm;
    const mainRatio = mainDistanceKm / mainRadius;
    if (closest.id === main.id || closest.absorbedIntoMainUrbanArea) {
      if (mainRatio < 0.13) {
        landUse = 'historic-core';
        housingType = 'historic mixed frontage';
      } else if (mainRatio < 0.24) {
        landUse = 'town-centre';
        housingType = prng.nextFloat() < 0.5 ? 'urban flats' : 'historic mixed frontage';
      } else if (mainRatio < 0.38 && prng.nextFloat() < 0.38) {
        landUse = 'mixed-use';
      }
      const angle = Math.atan2(cell.centre.y - main.centre.y, cell.centre.x - main.centre.x);
      const railDistanceKm = nearestRailDistanceKm(cell.centre, railways, config.sizeKm);
      const industrialSector = angle > -0.75 && angle < 1.35;
      if (mainRatio > 0.28 && mainRatio < 0.82 && industrialSector && (railDistanceKm < 0.75 || cell.riverDistanceKm < 0.85) && prng.nextFloat() < 0.68) {
        landUse = 'industry';
        housingType = 'none';
      }
      const motorwayDistance = roads.filter((road) => road.roadClass === 'motorway')
        .reduce((nearest, road) => Math.min(nearest, distanceToPolyline(cell.centre, road.path).distance * config.sizeKm), Number.POSITIVE_INFINITY);
      if (mainRatio > 0.72 && motorwayDistance < 0.75 && prng.nextFloat() < 0.38) {
        landUse = 'logistics';
        housingType = 'none';
      }
      if (cell.floodRisk === 'high' && landUse === 'residential') {
        landUse = 'park';
        housingType = 'none';
      }
    } else if (closestRatio < 0.22) {
      landUse = 'local-centre';
      housingType = 'historic mixed frontage';
    }
    const density = densityFor(landUse, housingType);
    return {
      ...cell,
      landUse,
      developmentEra: era,
      housingType,
      population: 0,
      jobs: 0,
      residentialCapacity: Math.round(density * cellAreaKm2),
      wardId: null,
    };
  });

  const facilities: Facility[] = [];
  if (railways.length > 0) {
    const centralRail = distanceToPolyline(main.centre, railways[0].path);
    const stationPoint = railways[0].path[Math.round(centralRail.progress * (railways[0].path.length - 1))];
    addFacility(cells, facilities, 'rail-station', `${main.name} Central`, stationPoint, '1840–1900', 'main station placed at the edge of the pre-rail core on the through line', 'transport');
  }
  addFacility(cells, facilities, 'bus-station', `${main.name} Bus Station`, main.centre, '1950–1980', 'central interchange adjoining the primary retail core', 'transport');
  addFacility(cells, facilities, 'retail-centre', `${main.name} Market and High Street`, main.centre, 'medieval origins; repeatedly rebuilt', 'historic route junction and market focus', 'town-centre');

  const hospitalPoint = { x: clamp(main.centre.x - 0.055, 0.05, 0.95), y: clamp(main.centre.y + 0.06, 0.05, 0.95) };
  addFacility(cells, facilities, 'hospital', `${main.name} General Hospital`, hospitalPoint, main.population >= 175_000 ? '1890s institution with post-war campus' : 'post-war district general hospital', 'large edge-of-centre site with road and bus access', 'healthcare');

  const universityDraw = prng.nextFloat();
  const universityThreshold = profile.universityPropensity * (main.population >= 175_000 ? 1 : main.population >= 90_000 ? 0.78 : 0.42);
  if (universityDraw < universityThreshold) {
    const universityPoint = { x: clamp(main.centre.x + 0.07, 0.05, 0.95), y: clamp(main.centre.y - 0.065, 0.05, 0.95) };
    const redbrick = main.population >= 175_000 && profile.industrialLegacy > 0.65 && prng.nextFloat() < 0.38;
    addFacility(
      cells,
      facilities,
      'university',
      redbrick ? `University of ${main.name}` : `${main.name} Metropolitan University`,
      universityPoint,
      redbrick ? 'late-19th-century civic college; university status in the 20th century' : prng.nextFloat() < 0.55 ? '1960s expansion institution; later university status' : 'post-1992 university',
      redbrick ? 'civic campus between the centre and affluent expansion districts' : 'large redevelopment or edge-of-centre campus with public transport access',
      'education',
    );
  } else {
    addFacility(cells, facilities, 'further-education-college', `${main.name} College`, hospitalPoint, '1950–1980', 'serves the town and surrounding labour market', 'education');
  }

  if (prng.nextFloat() < 0.055) {
    addFacility(cells, facilities, 'cathedral', `${main.name} Cathedral`, main.centre, 'medieval foundation', 'cathedral status is a contingent historical institution, not a consequence of population size', 'historic-core');
  } else if (prng.nextFloat() < 0.3) {
    addFacility(cells, facilities, 'abbey-remains', `${main.name} Abbey`, { x: main.centre.x + 0.025, y: main.centre.y + 0.02 }, 'medieval; dissolved in the 16th century', 'religious house beside the historic settlement and water supply', 'park');
  }

  const outward = { x: main.centre.x < 0.5 ? -1 : 1, y: main.centre.y < 0.5 ? -0.6 : 0.6 };
  const retailPoint = { x: clamp(main.centre.x + outward.x * mainRadius / config.sizeKm * 0.9, 0.04, 0.96), y: clamp(main.centre.y + outward.y * mainRadius / config.sizeKm * 0.9, 0.04, 0.96) };
  addFacility(cells, facilities, 'retail-park', `${main.name} Gate Retail Park`, retailPoint, '1985–2005', 'outer distributor-road site with large floorplates and surface parking', 'retail-park');
  addFacility(cells, facilities, 'industrial-estate', `${main.name} Industrial Estate`, { x: main.centre.x + 0.09, y: main.centre.y + 0.05 }, '1950–1980', 'rail/river corridor and separation from dense housing', 'industry');

  const sewageLocation = rivers.length > 0
    ? rivers[0].path[Math.min(rivers[0].path.length - 2, Math.round(rivers[0].path.length * 0.78))]
    : { x: clamp(main.centre.x + 0.18, 0.04, 0.96), y: clamp(main.centre.y + 0.14, 0.04, 0.96) };
  addFacility(cells, facilities, 'sewage-works', `${main.name} Wastewater Treatment Works`, sewageLocation, '20th-century works with later upgrades', 'low-lying downstream site outside the continuous residential area; gravity sewers and river discharge constraints', 'utilities', (cell) => cell.floodRisk !== 'sea');
  addFacility(cells, facilities, 'electricity-substation', `${main.name} Grid Substation`, { x: main.centre.x + 0.13, y: main.centre.y - 0.08 }, '1950–1980', 'edge-of-town transmission connection and industrial access', 'utilities');
  if (main.population >= 175_000 && prng.nextFloat() < 0.38) {
    addFacility(cells, facilities, 'energy-from-waste', `${main.name} Energy Recovery Facility`, { x: main.centre.x + 0.16, y: main.centre.y + 0.09 }, '2000–present', 'industrial land with strategic road access; presence is probabilistic rather than assumed', 'utilities');
  }
  addFacility(cells, facilities, 'cemetery', `${main.name} Cemetery`, { x: main.centre.x - 0.11, y: main.centre.y + 0.09 }, '1850–1914', 'then-edge-of-town sanitary reform cemetery', 'park');

  // Allocate each settlement's stated population across its residential capacity.
  allocationSettlements.forEach((settlement, settlementIndex) => {
    const target = settlementIndex === 0 ? main.population : settlement.population;
    let eligibleIndices = cells
      .map((cell, index) => ({ cell, index }))
      .filter(({ cell }) => {
        if (cell.residentialCapacity <= 0) return false;
        let closestAllocation = allocationSettlements[0];
        let closestDistance = Number.POSITIVE_INFINITY;
        allocationSettlements.forEach((candidate) => {
          const nextDistance = distance(cell.centre, candidate.centre);
          if (nextDistance < closestDistance) {
            closestAllocation = candidate;
            closestDistance = nextDistance;
          }
        });
        return closestAllocation.id === settlement.id;
      })
      .map(({ index }) => index);
    if (eligibleIndices.length === 0) {
      // A coarse grid plus a later facility siting can consume the only cell of
      // a small settlement. Restore the nearest safe cell in that settlement's
      // own catchment so stated population is never silently dropped.
      const fallbackIndex = closestCellIndex(cells, settlement.centre, (cell) => {
        if (cell.floodRisk === 'high' || ['utilities', 'education', 'healthcare', 'transport'].includes(cell.landUse)) return false;
        const nearestAllocation = allocationSettlements.reduce((nearest, candidate) =>
          distance(cell.centre, candidate.centre) < distance(cell.centre, nearest.centre) ? candidate : nearest,
        allocationSettlements[0]);
        return nearestAllocation.id === settlement.id;
      });
      if (fallbackIndex < 0) throw new Error(`Unable to allocate a safe residential cell for ${settlement.name}.`);
      cells[fallbackIndex] = {
        ...cells[fallbackIndex],
        landUse: 'local-centre',
        developmentEra: 'pre-1800',
        housingType: 'historic mixed frontage',
        residentialCapacity: Math.max(1, Math.round(4_800 * cellAreaKm2)),
      };
      eligibleIndices = [fallbackIndex];
    }
    const allocation = allocateIntegerTotal(eligibleIndices.map((index) => cells[index].residentialCapacity), target);
    eligibleIndices.forEach((cellIndex, index) => {
      cells[cellIndex] = { ...cells[cellIndex], population: allocation[index] };
    });
  });

  const totalPopulation = cells.reduce((sum, cell) => sum + cell.population, 0);
  const jobsTarget = Math.round(totalPopulation * (0.43 + profile.universityPropensity * 0.045));
  const jobWeights = cells.map((cell) => {
    if (cell.landUse === 'town-centre') return 12;
    if (cell.landUse === 'historic-core' || cell.landUse === 'mixed-use') return 7;
    if (cell.landUse === 'industry' || cell.landUse === 'logistics') return 10;
    if (cell.landUse === 'retail-park') return 8;
    if (cell.landUse === 'education' || cell.landUse === 'healthcare') return 9;
    if (cell.landUse === 'local-centre') return 4;
    if (cell.landUse === 'utilities' || cell.landUse === 'transport') return 3;
    return cell.population > 0 ? 0.32 : cell.landUse === 'agriculture' ? 0.08 : 0;
  });
  const jobAllocation = allocateIntegerTotal(jobWeights, jobsTarget);
  cells.forEach((cell, index) => {
    cells[index] = { ...cell, jobs: jobAllocation[index] };
  });

  const streetLandUses = new Set<LandUse>(['historic-core', 'town-centre', 'local-centre', 'residential', 'mixed-use']);
  const streets = cells
    .filter((cell) => streetLandUses.has(cell.landUse) && cell.developmentEra !== 'undeveloped' && (cell.population > 0 || cell.jobs > 20))
    .map((cell, index) => makeLocalStreet(cell, config, prng, index));

  return { cells, facilities, streets };
}
