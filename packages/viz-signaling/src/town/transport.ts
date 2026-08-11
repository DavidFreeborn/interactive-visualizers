import { SeededPrng } from '../model/prng';
import { clamp, distance, distanceToPolyline, lerp, polylineLength } from './math';
import type { RegionProfile } from './regionalProfiles';
import type {
  MapSide,
  Point,
  RailLine,
  RoadClass,
  RoadLink,
  Settlement,
  TerrainCell,
  TownCell,
  TownGeneratorConfig,
} from './types';

function boundaryPoint(side: MapSide, prng: SeededPrng): Point {
  const along = 0.12 + prng.nextFloat() * 0.76;
  if (side === 'north') return { x: along, y: 0.01 };
  if (side === 'east') return { x: 0.99, y: along };
  if (side === 'south') return { x: along, y: 0.99 };
  return { x: 0.01, y: along };
}

function routeThrough(points: readonly Point[], prng: SeededPrng, pointsPerLeg = 9): Point[] {
  const path: Point[] = [];
  for (let leg = 1; leg < points.length; leg += 1) {
    const start = points[leg - 1];
    const end = points[leg];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.max(0.001, Math.hypot(dx, dy));
    const normal = { x: -dy / length, y: dx / length };
    const bend = (prng.nextFloat() - 0.5) * Math.min(0.055, length * 0.12);
    for (let index = leg === 1 ? 0 : 1; index <= pointsPerLeg; index += 1) {
      const t = index / pointsPerLeg;
      const envelope = Math.sin(Math.PI * t);
      path.push({
        x: clamp(lerp(start.x, end.x, t) + normal.x * bend * envelope, 0.006, 0.994),
        y: clamp(lerp(start.y, end.y, t) + normal.y * bend * envelope, 0.006, 0.994),
      });
    }
  }
  return path;
}

function roadNumberPrefix(region: TownGeneratorConfig['region']): number[] {
  if (region === 'south-east' || region === 'london-fringe') return [2, 3];
  if (region === 'south-west') return [3, 4];
  if (region === 'west-midlands') return [4, 5];
  if (region === 'north-west') return [5, 6];
  if (region === 'north-east' || region === 'yorkshire-humber') return [1, 6];
  if (region === 'east-midlands') return [5, 6];
  return [1, 4];
}

function makeRoadName(config: TownGeneratorConfig, prng: SeededPrng, used: Set<string>, roadClass: RoadClass): string {
  const prefixes = roadNumberPrefix(config.region);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const prefix = prefixes[prng.nextInt(prefixes.length)];
    const number = roadClass === 'motorway'
      ? 10 + prng.nextInt(80)
      : prefix * 100 + 10 + prng.nextInt(89);
    const name = `${roadClass === 'motorway' ? 'M' : roadClass === 'b-road' ? 'B' : 'A'}${number}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `${roadClass === 'b-road' ? 'B' : 'A'}${700 + used.size}`;
  used.add(fallback);
  return fallback;
}

function roadPerformance(
  roadClass: RoadClass,
  lengthKm: number,
  principalPopulation: number,
  routeIndex: number,
  prng: SeededPrng,
): Omit<RoadLink, 'id' | 'name' | 'roadClass' | 'builtEra' | 'path' | 'lengthKm'> {
  const parameters: Record<RoadClass, { speed: number; capacity: number; base: number; share: number }> = {
    motorway: { speed: 100, capacity: 3_600, base: 1_500, share: 0.012 },
    'primary-a': { speed: 72, capacity: 1_800, base: 350, share: 0.01 },
    'secondary-a': { speed: 58, capacity: 1_450, base: 220, share: 0.0065 },
    'b-road': { speed: 46, capacity: 900, base: 120, share: 0.0028 },
  };
  const parameter = parameters[roadClass];
  const freeFlowMinutes = (lengthKm / parameter.speed) * 60;
  const radialFactor = 1 / Math.sqrt(routeIndex + 1);
  const amPeakVehicles = Math.round(parameter.base + principalPopulation * parameter.share * radialFactor * (0.82 + prng.nextFloat() * 0.36));
  const volumeCapacityRatio = clamp(amPeakVehicles / parameter.capacity, 0.08, 1.45);
  const congestedMinutes = freeFlowMinutes * (1 + 0.15 * volumeCapacityRatio ** 4);
  return {
    freeFlowMinutes: Math.round(freeFlowMinutes * 10) / 10,
    amPeakVehicles,
    hourlyCapacity: parameter.capacity,
    volumeCapacityRatio: Math.round(volumeCapacityRatio * 100) / 100,
    congestionState: classifyCongestion(volumeCapacityRatio),
    congestedMinutes: Math.round(congestedMinutes * 10) / 10,
    meanSpeedKph: Math.round((lengthKm / (congestedMinutes / 60)) * 10) / 10,
  };
}

function classifyCongestion(volumeCapacityRatio: number): RoadLink['congestionState'] {
  if (volumeCapacityRatio < 0.7) return 'free-flow';
  if (volumeCapacityRatio < 0.95) return 'busy';
  if (volumeCapacityRatio <= 1.2) return 'congested';
  return 'oversaturated';
}

function availableBoundarySides(config: TownGeneratorConfig): MapSide[] {
  const sides: MapSide[] = ['north', 'east', 'south', 'west'];
  const land = sides.filter((side) => config.boundaries[side] !== 'sea');
  return land.length >= 2 ? land : sides;
}

export interface TransportResult {
  roads: RoadLink[];
  railways: RailLine[];
  modeShares: { carDriver: number; rail: number } | null;
}

export function generateTransport(
  config: TownGeneratorConfig,
  profile: RegionProfile,
  _terrain: readonly TerrainCell[],
  settlements: readonly Settlement[],
  prng: SeededPrng,
): TransportResult {
  const main = settlements[0];
  const sides = availableBoundarySides(config);
  const usedRoadNames = new Set<string>();
  const roads: RoadLink[] = [];

  const firstStart = boundaryPoint(sides[0], prng);
  const firstEnd = boundaryPoint(sides[Math.floor(sides.length / 2)], prng);
  const firstPath = routeThrough([firstStart, main.centre, firstEnd], prng);
  const firstClass: RoadClass = 'primary-a';
  const firstLength = polylineLength(firstPath, config.sizeKm);
  roads.push({
    id: 'road-primary-1',
    name: makeRoadName(config, prng, usedRoadNames, firstClass),
    roadClass: firstClass,
    builtEra: 'pre-industrial route; turnpike and 20th-century improvement',
    path: firstPath,
    lengthKm: firstLength,
    ...roadPerformance(firstClass, firstLength, main.population, 0, prng),
  });

  if (sides.length >= 3) {
    const secondStart = boundaryPoint(sides[1], prng);
    const secondEnd = boundaryPoint(sides[sides.length - 1], prng);
    const secondPath = routeThrough([secondStart, main.centre, secondEnd], prng);
    const secondClass: RoadClass = main.population >= 90_000 ? 'primary-a' : 'secondary-a';
    const secondLength = polylineLength(secondPath, config.sizeKm);
    roads.push({
      id: 'road-primary-2',
      name: makeRoadName(config, prng, usedRoadNames, secondClass),
      roadClass: secondClass,
      builtEra: 'historic radial route; reconstructed in stages after 1920',
      path: secondPath,
      lengthKm: secondLength,
      ...roadPerformance(secondClass, secondLength, main.population, 1, prng),
    });
  }

  const independentSettlements = settlements.slice(1).filter((settlement) => !settlement.absorbedIntoMainUrbanArea);
  independentSettlements.slice(0, 5).forEach((settlement, index) => {
    const roadClass: RoadClass = settlement.population >= 5_000 ? 'secondary-a' : 'b-road';
    const path = routeThrough([settlement.centre, main.centre], prng, 8);
    const lengthKm = polylineLength(path, config.sizeKm);
    roads.push({
      id: `road-radial-${index + 1}`,
      name: makeRoadName(config, prng, usedRoadNames, roadClass),
      roadClass,
      builtEra: roadClass === 'b-road' ? 'historic local road with 20th-century surfacing' : '18th–19th-century inter-town route',
      path,
      lengthKm,
      ...roadPerformance(roadClass, lengthKm, main.population, index + 2, prng),
    });
  });

  const motorwayProbability = main.population >= 175_000 ? 0.88 : main.population >= 90_000 ? 0.52 : 0.16;
  if (sides.length >= 2 && prng.nextFloat() < motorwayProbability) {
    const start = boundaryPoint(sides[0], prng);
    const end = boundaryPoint(sides[Math.floor(sides.length / 2)], prng);
    const offsetDirection = prng.nextFloat() < 0.5 ? -1 : 1;
    const bypass = {
      x: clamp(main.centre.x + offsetDirection * (0.11 + prng.nextFloat() * 0.05), 0.12, 0.88),
      y: clamp(main.centre.y - offsetDirection * (0.09 + prng.nextFloat() * 0.04), 0.12, 0.88),
    };
    const path = routeThrough([start, bypass, end], prng, 10);
    const lengthKm = polylineLength(path, config.sizeKm);
    roads.push({
      id: 'road-motorway',
      name: makeRoadName(config, prng, usedRoadNames, 'motorway'),
      roadClass: 'motorway',
      builtEra: prng.nextFloat() < 0.65 ? '1960s–1970s strategic motorway' : '1980s–1990s strategic route',
      path,
      lengthKm,
      ...roadPerformance('motorway', lengthKm, main.population, 0, prng),
    });
  }

  const railways: RailLine[] = [];
  const railProbability = main.population >= 90_000 ? 0.98 : 0.86;
  if (prng.nextFloat() < railProbability) {
    const railStart = boundaryPoint(sides[0], prng);
    const railEnd = boundaryPoint(sides[Math.floor(sides.length / 2)], prng);
    const path = routeThrough([railStart, main.centre, railEnd], prng, 12);
    const trainsPerPeakHour = main.population >= 175_000 ? 6 : main.population >= 90_000 ? 4 : 2;
    const seatedCapacityPerTrain = trainsPerPeakHour >= 6 ? 420 : 270;
    const regionalRailFactor = config.region === 'london-fringe' ? 0.09 : profile.universityPropensity > 0.6 ? 0.065 : 0.048;
    const peakDirectionPassengers = Math.round(main.population * regionalRailFactor / 2.5 * (0.82 + prng.nextFloat() * 0.3));
    railways.push({
      id: 'rail-main',
      name: `${main.name} main line`,
      kind: 'main-line',
      path,
      stations: [`${main.name} Central`],
      trainsPerPeakHour,
      seatedCapacityPerTrain,
      peakDirectionPassengers,
      loadFactor: Math.round((peakDirectionPassengers / (trainsPerPeakHour * seatedCapacityPerTrain)) * 100) / 100,
    });

    if (independentSettlements.length >= 2 && prng.nextFloat() < 0.62) {
      const branchStops = independentSettlements.slice(0, Math.min(3, independentSettlements.length));
      const branchPath = routeThrough([main.centre, ...branchStops.map((settlement) => settlement.centre)], prng, 9);
      const branchPassengers = Math.round(branchStops.reduce((sum, settlement) => sum + settlement.population, 0) * 0.035);
      railways.push({
        id: 'rail-secondary',
        name: `${main.name} branch`,
        kind: 'secondary-line',
        path: branchPath,
        stations: [`${main.name} Central`, ...branchStops.map((settlement) => settlement.name)],
        trainsPerPeakHour: 2,
        seatedCapacityPerTrain: 170,
        peakDirectionPassengers: branchPassengers,
        loadFactor: Math.round((branchPassengers / 340) * 100) / 100,
      });
    }
  }

  return { roads, railways, modeShares: null };
}

/**
 * Assign a reproducible AM-peak travel demand matrix to the generated network.
 *
 * This is deliberately a strategic, zone-based assignment rather than a
 * junction microsimulation. Residential cells supply employed travellers;
 * employment cells attract them through a singly constrained gravity model.
 * Rail choice responds to trip length and line access, while car trips are
 * loaded onto the corridor closest to both origin and destination. The method
 * is simple enough to audit and materially stronger than scaling every road by
 * city population alone.
 */
export function assignPeakTravelDemand(
  config: TownGeneratorConfig,
  profile: RegionProfile,
  cells: readonly TownCell[],
  roads: readonly RoadLink[],
  railways: readonly RailLine[],
  settlements: readonly Settlement[],
): TransportResult {
  if (roads.length === 0 && railways.length === 0) return { roads: [], railways: [], modeShares: { carDriver: 0, rail: 0 } };

  const originCells = cells.filter((cell) => !cell.isSea && cell.population > 0);
  const destinationCells = cells.filter((cell) => !cell.isSea && cell.jobs > 0);
  const stationPointsByLine = railways.map((line) => {
    const stationSettlements = settlements.filter((settlement) =>
      line.stations.some((stationName) => stationName === settlement.name || stationName.startsWith(`${settlement.name} `)),
    );
    return (stationSettlements.length > 0 ? stationSettlements : settlements.slice(0, 1)).map((settlement) => settlement.centre);
  });
  const roadDistances = new Map<number, number[]>();
  const railDistances = new Map<number, number[]>();
  for (const cell of cells) {
    if (cell.isSea || (cell.population <= 0 && cell.jobs <= 0)) continue;
    roadDistances.set(cell.id, roads.map((road) => distanceToPolyline(cell.centre, road.path).distance * config.sizeKm));
    railDistances.set(cell.id, stationPointsByLine.map((stationPoints) =>
      stationPoints.reduce((nearest, point) => Math.min(nearest, distance(cell.centre, point) * config.sizeKm), Number.POSITIVE_INFINITY),
    ));
  }

  const baseRoadFlows: Record<RoadClass, number> = {
    motorway: 780,
    'primary-a': 150,
    'secondary-a': 75,
    'b-road': 32,
  };
  const roadFlows = roads.map((road) => baseRoadFlows[road.roadClass]);
  const totalPopulation = cells.reduce((sum, cell) => sum + cell.population, 0);
  const railPassengers = railways.map((line) =>
    line.kind === 'main-line' ? totalPopulation * 0.0018 : line.kind === 'secondary-line' ? totalPopulation * 0.0005 : 0,
  );
  let assignedPersonTrips = 0;
  let assignedCarDriverTrips = 0;
  let assignedRailTrips = 0;

  const workFromHomeShare = config.region === 'london-fringe' || config.region === 'south-east' ? 0.19 : 0.14;
  const carCommuteShare = config.region === 'london-fringe'
    ? 0.48
    : config.region === 'south-east' || config.region === 'east-of-england'
      ? 0.63
      : config.region === 'north-east' || config.region === 'north-west'
        ? 0.61
        : 0.59;
  const baseRailShare = config.region === 'london-fringe'
    ? 0.29
    : config.region === 'south-east' || config.region === 'east-of-england'
      ? 0.13
      : 0.075 + profile.universityPropensity * 0.025;
  const gravityScaleKm = config.region === 'london-fringe' ? 15 : totalPopulation >= 200_000 ? 12 : 9;

  for (const origin of originCells) {
    // Employment rate, home working and one-hour peak concentration are
    // explicit behavioural assumptions, not Census-calibrated local values.
    const peakTrips = origin.population * 0.47 * (1 - workFromHomeShare) * 0.34;
    if (peakTrips <= 0) continue;
    const attractions = destinationCells.map((destination) => {
      const separationKm = distance(origin.centre, destination.centre) * config.sizeKm;
      const intrazonalPenalty = separationKm < config.sizeKm / config.gridSize ? 0.42 : 1;
      return {
        destination,
        separationKm,
        weight: destination.jobs * Math.exp(-separationKm / gravityScaleKm) * intrazonalPenalty,
      };
    });
    const totalAttraction = attractions.reduce((sum, item) => sum + item.weight, 0);
    if (totalAttraction <= 0) continue;

    for (const attraction of attractions) {
      if (attraction.weight <= 0) continue;
      const personTrips = peakTrips * attraction.weight / totalAttraction;
      assignedPersonTrips += personTrips;
      const originRailDistances = railDistances.get(origin.id) ?? [];
      const destinationRailDistances = railDistances.get(attraction.destination.id) ?? [];
      let selectedRail = -1;
      let railAccessKm = Number.POSITIVE_INFINITY;
      for (let index = 0; index < railways.length; index += 1) {
        const access = (originRailDistances[index] ?? 99) + (destinationRailDistances[index] ?? 99);
        if (access < railAccessKm) {
          railAccessKm = access;
          selectedRail = index;
        }
      }
      const railLengthFactor = clamp((attraction.separationKm - 3) / 11, 0, 1);
      const railAccessFactor = Math.exp(-railAccessKm / 3.2);
      const railShare = selectedRail >= 0
        ? clamp(baseRailShare * railLengthFactor * railAccessFactor, 0, 0.36)
        : 0;
      if (selectedRail >= 0) {
        const nextRailTrips = personTrips * railShare;
        railPassengers[selectedRail] += nextRailTrips;
        assignedRailTrips += nextRailTrips;
      }

      const shortTripCarFactor = clamp((attraction.separationKm + 1.5) / 5.5, 0.32, 1);
      const carShare = clamp(carCommuteShare * shortTripCarFactor * (1 - railShare), 0.16, 0.78);
      assignedCarDriverTrips += personTrips * carShare / 1.14;
      const vehicles = personTrips * carShare / 1.14 * 1.16;
      if (roads.length === 0 || vehicles <= 0) continue;
      const originRoadDistances = roadDistances.get(origin.id) ?? [];
      const destinationRoadDistances = roadDistances.get(attraction.destination.id) ?? [];
      const alternatives = roads.map((road, index) => {
        const accessKm = (originRoadDistances[index] ?? 99) + (destinationRoadDistances[index] ?? 99);
        const strategicPenalty = attraction.separationKm < 5 && road.roadClass === 'motorway' ? 1.6 : 0;
        const localPenalty = attraction.separationKm > 12 && road.roadClass === 'b-road' ? 1.2 : 0;
        const classPenalty = road.roadClass === 'b-road' ? 0.35 : road.roadClass === 'secondary-a' ? 0.12 : 0;
        const currentVcr = roadFlows[index] / Math.max(1, road.hourlyCapacity);
        const congestionFeedback = Math.max(0, currentVcr - 0.55) * 4.2;
        return { index, score: accessKm + strategicPenalty + localPenalty + classPenalty + congestionFeedback + road.lengthKm * 0.018 };
      }).sort((left, right) => left.score - right.score).slice(0, Math.min(4, roads.length));
      const bestScore = alternatives[0].score;
      const routeWeights = alternatives.map((alternative) => Math.exp(-(alternative.score - bestScore) / 2.1));
      const totalRouteWeight = routeWeights.reduce((sum, weight) => sum + weight, 0);
      alternatives.forEach((alternative, index) => {
        roadFlows[alternative.index] += vehicles * routeWeights[index] / totalRouteWeight;
      });
    }
  }

  const assignedRoads = roads.map((road, index) => {
    const amPeakVehicles = Math.max(0, Math.round(roadFlows[index]));
    const volumeCapacityRatio = amPeakVehicles / Math.max(1, road.hourlyCapacity);
    const delayRatio = 1 + 0.15 * Math.min(2, volumeCapacityRatio) ** 4;
    const congestedMinutes = road.freeFlowMinutes * delayRatio;
    return {
      ...road,
      amPeakVehicles,
      volumeCapacityRatio: Math.round(volumeCapacityRatio * 100) / 100,
      congestionState: classifyCongestion(volumeCapacityRatio),
      congestedMinutes: Math.round(Math.max(road.freeFlowMinutes, congestedMinutes) * 10) / 10,
      meanSpeedKph: Math.round((road.lengthKm / (Math.max(0.1, congestedMinutes) / 60)) * 10) / 10,
    };
  });
  const assignedRailways = railways.map((line, index) => {
    const peakDirectionPassengers = Math.max(0, Math.round(railPassengers[index]));
    const capacity = line.trainsPerPeakHour * line.seatedCapacityPerTrain;
    return {
      ...line,
      peakDirectionPassengers,
      loadFactor: Math.round((peakDirectionPassengers / Math.max(1, capacity)) * 100) / 100,
    };
  });
  return {
    roads: assignedRoads,
    railways: assignedRailways,
    modeShares: {
      carDriver: assignedCarDriverTrips / Math.max(1, assignedPersonTrips),
      rail: assignedRailTrips / Math.max(1, assignedPersonTrips),
    },
  };
}
