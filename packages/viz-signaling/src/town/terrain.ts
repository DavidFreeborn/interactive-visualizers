import { SeededPrng } from '../model/prng';
import { clamp, distance, distanceToPolyline, lerp, smoothstep, valueNoise } from './math';
import type { RegionProfile } from './regionalProfiles';
import type {
  AgriculturalGrade,
} from './terrainInternalTypes';
import type {
  GeologyUnit,
  HabitatType,
  MapSide,
  Point,
  RiverFeature,
  SoilGroup,
  SuperficialDeposit,
  TerrainCell,
  TownGeneratorConfig,
} from './types';

export interface TerrainResult {
  cells: TerrainCell[];
  rivers: RiverFeature[];
  downhillShare: number | null;
}

function sidePoint(side: MapSide, along: number): Point {
  if (side === 'north') return { x: along, y: 0.006 };
  if (side === 'east') return { x: 0.994, y: along };
  if (side === 'south') return { x: along, y: 0.994 };
  return { x: 0.006, y: along };
}

function generateRiverPath(config: TownGeneratorConfig, prng: SeededPrng): Point[] | null {
  if (config.river === null) return null;
  const start = sidePoint(config.river.sourceSide, 0.18 + prng.nextFloat() * 0.64);
  const end = sidePoint(config.river.outletSide, 0.18 + prng.nextFloat() * 0.64);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(0.4, Math.hypot(dx, dy));
  const normal = { x: -dy / length, y: dx / length };
  const cycles = 1.4 + prng.nextFloat() * 1.6;
  const phase = prng.nextFloat() * Math.PI * 2;
  const amplitude = 0.035 + prng.nextFloat() * 0.03;
  const path: Point[] = [];
  for (let index = 0; index <= 56; index += 1) {
    const t = index / 56;
    const envelope = Math.sin(Math.PI * t);
    const meander = Math.sin(t * Math.PI * 2 * cycles + phase) * amplitude * envelope;
    const residual = valueNoise(config.seed ^ 0x73a4, t, 0.5, 5) * 0.018 * envelope;
    path.push({
      x: clamp(lerp(start.x, end.x, t) + normal.x * (meander + residual), 0.004, 0.996),
      y: clamp(lerp(start.y, end.y, t) + normal.y * (meander + residual), 0.004, 0.996),
    });
  }
  return path;
}

function mainChannelBedProfile(config: TownGeneratorConfig, profile: RegionProfile, path: readonly Point[]): number[] {
  const sourceFloor = Math.max(48, profile.baseElevationM + profile.reliefM * 0.24);
  const outletIsSea = config.river !== null && config.boundaries[config.river.outletSide] === 'sea';
  const outletFloor = outletIsSea ? 0.5 : Math.max(8, profile.baseElevationM * 0.18);
  return path.map((_point, index) => Math.round(lerp(sourceFloor, outletFloor, index / Math.max(1, path.length - 1)) * 10) / 10);
}

function buildTributary(
  prng: SeededPrng,
  mainPath: Point[],
  index: number,
  cells: readonly TerrainCell[],
): Point[] {
  const joinProgress = 0.24 + ((index + 1) / 5) * 0.5 + (prng.nextFloat() - 0.5) * 0.08;
  const joinIndex = Math.round(clamp(joinProgress, 0.18, 0.82) * (mainPath.length - 1));
  const join = mainPath[joinIndex];
  const land = cells.filter((cell) => !cell.isSea);
  const sortedElevations = land.map((cell) => cell.elevationM).sort((left, right) => left - right);
  const highThreshold = sortedElevations[Math.floor(sortedElevations.length * 0.68)] ?? 0;
  const candidates = land.filter((cell) => {
    const separation = distance(cell.centre, join);
    return cell.elevationM >= highThreshold && separation >= 0.13 && separation <= 0.52 && distanceToPolyline(cell.centre, mainPath).distance > 0.065;
  });
  const fallback = land.reduce((highest, cell) => cell.elevationM > highest.elevationM ? cell : highest, land[0]);
  const start = (candidates.length > 0 ? candidates[prng.nextInt(candidates.length)] : fallback).centre;
  const bendDirection = prng.nextFloat() - 0.5;
  const path: Point[] = [];
  for (let pointIndex = 0; pointIndex <= 20; pointIndex += 1) {
    const t = pointIndex / 20;
    const bend = Math.sin(Math.PI * t) * bendDirection * 0.055;
    path.push({
      x: clamp(lerp(start.x, join.x, t) + bend, 0.006, 0.994),
      y: clamp(lerp(start.y, join.y, t) - bend, 0.006, 0.994),
    });
  }
  return path;
}

function channelBedDownhillShare(bedElevationM: readonly number[]): number {
  let downhill = 0;
  for (let index = 1; index < bedElevationM.length; index += 1) {
    if (bedElevationM[index] <= bedElevationM[index - 1]) downhill += 1;
  }
  return bedElevationM.length <= 1 ? 1 : downhill / (bedElevationM.length - 1);
}

function selectGeologyUnit(profile: RegionProfile, seed: number, x: number, y: number, angle: number): GeologyUnit {
  const oriented = (x - 0.5) * Math.cos(angle) + (y - 0.5) * Math.sin(angle) + 0.5;
  const folded = clamp(oriented + valueNoise(seed ^ 0x92ab, x, y, 3) * 0.13, 0, 0.999999);
  let cumulative = 0;
  for (const geologyUnit of profile.geology) {
    cumulative += geologyUnit.share;
    if (folded <= cumulative) return geologyUnit;
  }
  return profile.geology[profile.geology.length - 1];
}

function distanceToSide(side: MapSide, x: number, y: number): number {
  if (side === 'north') return y;
  if (side === 'east') return 1 - x;
  if (side === 'south') return 1 - y;
  return x;
}

function alongSide(side: MapSide, x: number, y: number): number {
  return side === 'north' || side === 'south' ? x : y;
}

function isSeaCell(config: TownGeneratorConfig, x: number, y: number): boolean {
  const sides: MapSide[] = ['north', 'east', 'south', 'west'];
  return sides.some((side) => {
    if (config.boundaries[side] !== 'sea') return false;
    const along = alongSide(side, x, y);
    const depth = 0.055 + 0.02 * Math.sin(along * Math.PI * 4 + side.length) + valueNoise(config.seed ^ 0x513, along, side.length, 4) * 0.014;
    return distanceToSide(side, x, y) < depth;
  });
}

function coastDistance(config: TownGeneratorConfig, x: number, y: number): number {
  const sides: MapSide[] = ['north', 'east', 'south', 'west'];
  let nearest = Number.POSITIVE_INFINITY;
  for (const side of sides) {
    if (config.boundaries[side] === 'sea') {
      nearest = Math.min(nearest, distanceToSide(side, x, y));
    }
  }
  return nearest * config.sizeKm;
}

function edgeRelief(config: TownGeneratorConfig, profile: RegionProfile, x: number, y: number): number {
  const sides: MapSide[] = ['north', 'east', 'south', 'west'];
  let relief = 0;
  for (const side of sides) {
    const distance = distanceToSide(side, x, y);
    const influence = (1 - smoothstep(clamp(distance / 0.55, 0, 1))) ** 2;
    const character = config.boundaries[side];
    if (character === 'uplands') relief += profile.reliefM * 0.72 * influence;
    if (character === 'rolling') relief += profile.reliefM * 0.16 * influence;
    if (character === 'lowland') relief -= profile.baseElevationM * 0.34 * influence;
    if (character === 'sea') relief -= profile.baseElevationM * 0.5 * influence;
  }
  return relief;
}

function soilFor(unit: GeologyUnit, deposit: SuperficialDeposit, elevation: number, profile: RegionProfile): SoilGroup {
  if (deposit === 'peat') return 'peaty upland';
  if (deposit === 'river alluvium' || deposit === 'coastal sand and silt') return 'alluvial';
  if (unit.family === 'chalk' || unit.family === 'limestone') return 'calcareous';
  if (unit.family === 'mudstone-clay' || deposit === 'glacial till') return 'slowly permeable seasonally wet';
  if (unit.family === 'sandstone' && unit.permeability > 0.7) return 'sandy acidic';
  if (elevation > profile.baseElevationM + profile.reliefM * 0.45) return 'podzolic';
  return 'brown earth';
}

function agriculturalGrade(
  unit: GeologyUnit,
  slope: number,
  elevation: number,
  floodRisk: TerrainCell['floodRisk'],
  profile: RegionProfile,
): AgriculturalGrade {
  if (floodRisk === 'sea') return 'non-agricultural';
  let score = unit.fertility * 0.55 + (1 - clamp(slope / 0.22, 0, 1)) * 0.25 + (1 / profile.rainfallFactor) * 0.12;
  if (floodRisk === 'high') score -= 0.16;
  if (elevation > profile.baseElevationM + profile.reliefM * 0.55) score -= 0.22;
  if (score > 0.82) return '1';
  if (score > 0.72) return '2';
  if (score > 0.61) return '3a';
  if (score > 0.49) return '3b';
  if (score > 0.34) return '4';
  return '5';
}

function habitatFor(
  config: TownGeneratorConfig,
  profile: RegionProfile,
  cell: Omit<TerrainCell, 'habitat' | 'agriculturalGrade'>,
): HabitatType {
  if (cell.isSea || cell.coastDistanceKm < 0.18) return 'coastal';
  if (cell.riverDistanceKm < config.sizeKm / config.gridSize * 0.55) return 'river';
  if (cell.floodRisk === 'high') return 'wetland';
  if (cell.elevationM > profile.baseElevationM + profile.reliefM * 0.58 && profile.moorlandShare > 0.04) return 'heath and moor';
  const woodlandField = valueNoise(config.seed ^ 0x99b1, cell.centre.x, cell.centre.y, 7) * 0.5 + 0.5;
  if (woodlandField > 1 - profile.woodlandShare * 1.75 && cell.slope > 0.035) return 'deciduous woodland';
  if (cell.elevationM > profile.baseElevationM + profile.reliefM * 0.4 && woodlandField > 0.68) return 'conifer plantation';
  return cell.soil === 'calcareous' && woodlandField > 0.5 ? 'semi-natural grassland' : cell.soil === 'slowly permeable seasonally wet' ? 'improved grassland' : 'arable';
}

export function generateTerrain(
  config: TownGeneratorConfig,
  profile: RegionProfile,
  prng: SeededPrng,
  riverName: string,
): TerrainResult {
  const gridSize = config.gridSize;
  const cellSizeKm = config.sizeKm / gridSize;
  const geologyAngle = prng.nextFloat() * Math.PI;
  const mainPath = generateRiverPath(config, prng);
  const mainBedElevationM = mainPath === null ? null : mainChannelBedProfile(config, profile, mainPath);
  const rawElevation: number[] = [];
  const unitByCell: GeologyUnit[] = [];
  const seaByCell: boolean[] = [];

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const x = (column + 0.5) / gridSize;
      const y = (row + 0.5) / gridSize;
      const geologyUnit = selectGeologyUnit(profile, config.seed, x, y, geologyAngle);
      const isSea = isSeaCell(config, x, y);
      const residual = profile.reliefM * 0.075 * (
        valueNoise(config.seed ^ 0x18f3, x, y, 2.2) * 0.72 +
        valueNoise(config.seed ^ 0x271d, x, y, 7.5) * 0.28
      );
      const basinAdjustment = ['east-of-england', 'london-fringe', 'south-east'].includes(config.region)
        ? -profile.reliefM * 0.09 * (1 - clamp(Math.hypot(x - 0.5, y - 0.5) / 0.7, 0, 1))
        : 0;
      let elevation = profile.baseElevationM + edgeRelief(config, profile, x, y) +
        (geologyUnit.hardness - 0.5) * profile.reliefM * 0.24 + residual + basinAdjustment;
      if (mainPath !== null && !isSea) {
        const river = distanceToPolyline({ x, y }, mainPath);
        const bedIndex = Math.round(river.progress * (mainBedElevationM!.length - 1));
        const riverFloor = mainBedElevationM![bedIndex];
        const valleyWidth = 0.022 + profile.rainfallFactor * 0.012;
        if (river.distance < valleyWidth * 2.8) {
          const shoulder = smoothstep(clamp(river.distance / (valleyWidth * 2.8), 0, 1));
          const valleySurface = riverFloor + shoulder * profile.reliefM * 0.22;
          elevation = Math.min(elevation, valleySurface);
        }
      }
      if (isSea) elevation = -4 - Math.abs(valueNoise(config.seed ^ 0xadc, x, y, 5)) * 12;
      rawElevation.push(Math.round(elevation * 10) / 10);
      unitByCell.push(geologyUnit);
      seaByCell.push(isSea);
    }
  }

  const cells: TerrainCell[] = [];
  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const id = row * gridSize + column;
      const centre = { x: (column + 0.5) / gridSize, y: (row + 0.5) / gridSize };
      const left = rawElevation[row * gridSize + Math.max(0, column - 1)];
      const right = rawElevation[row * gridSize + Math.min(gridSize - 1, column + 1)];
      const north = rawElevation[Math.max(0, row - 1) * gridSize + column];
      const south = rawElevation[Math.min(gridSize - 1, row + 1) * gridSize + column];
      const slope = clamp(Math.hypot(right - left, south - north) / (cellSizeKm * 2000), 0, 1);
      const river = mainPath === null
        ? { distance: Number.POSITIVE_INFINITY, progress: 0 }
        : distanceToPolyline(centre, mainPath);
      const riverDistanceKm = river.distance * config.sizeKm;
      const coastDistanceKm = coastDistance(config, centre.x, centre.y);
      const isSea = seaByCell[id];
      const floodRisk: TerrainCell['floodRisk'] = isSea
        ? 'sea'
        : riverDistanceKm < Math.max(0.28, cellSizeKm * 0.65) || coastDistanceKm < 0.28
          ? 'high'
          : riverDistanceKm < 0.9 || coastDistanceKm < 0.75
            ? 'medium'
            : riverDistanceKm < 1.8 || coastDistanceKm < 1.6
              ? 'low'
              : 'very-low';
      let superficialDeposit: SuperficialDeposit = 'none/thin';
      if (floodRisk === 'high' && riverDistanceKm < 1) superficialDeposit = 'river alluvium';
      else if (floodRisk === 'medium' && riverDistanceKm < 2) superficialDeposit = 'river terrace gravel';
      else if (coastDistanceKm < 0.8) superficialDeposit = 'coastal sand and silt';
      else if (rawElevation[id] > profile.baseElevationM + profile.reliefM * 0.53 && profile.rainfallFactor > 1.05) superficialDeposit = 'peat';
      else if (['north-east', 'north-west', 'yorkshire-humber', 'east-of-england'].includes(config.region) && valueNoise(config.seed ^ 0x3ca, centre.x, centre.y, 5) > -0.12) superficialDeposit = 'glacial till';
      const soil = soilFor(unitByCell[id], superficialDeposit, rawElevation[id], profile);
      const partial = {
        id,
        row,
        column,
        centre,
        elevationM: rawElevation[id],
        slope,
        bedrockUnitId: unitByCell[id].id,
        superficialDeposit,
        soil,
        riverDistanceKm,
        coastDistanceKm,
        floodRisk,
        runoffIndex: clamp(profile.rainfallFactor * 0.28 + slope * 1.4 + (1 - unitByCell[id].permeability) * 0.36, 0, 1),
        isSea,
      };
      const habitat = habitatFor(config, profile, partial);
      cells.push({
        ...partial,
        habitat,
        agriculturalGrade: agriculturalGrade(unitByCell[id], slope, rawElevation[id], floodRisk, profile),
      });
    }
  }

  const rivers: RiverFeature[] = [];
  if (mainPath !== null) {
    rivers.push({
      id: 'river-main',
      name: riverName,
      order: 'major',
      path: mainPath,
      bedElevationM: mainBedElevationM,
      meanWidthM: Math.round(28 + profile.rainfallFactor * 24 + prng.nextFloat() * 18),
      navigableReachKm: config.boundaries[config.river!.outletSide] === 'sea' ? Math.round(config.sizeKm * (0.16 + prng.nextFloat() * 0.2)) : 0,
    });
    const tributaryCount = 2 + prng.nextInt(3);
    for (let index = 0; index < tributaryCount; index += 1) {
      rivers.push({
        id: `river-tributary-${index + 1}`,
        name: `${riverName.replace(/^River /, '')} ${index + 1} tributary`,
        order: 'tributary',
        path: buildTributary(prng, mainPath, index, cells),
        bedElevationM: null,
        meanWidthM: 5 + prng.nextInt(8),
        navigableReachKm: 0,
      });
    }
  }

  return { cells, rivers, downhillShare: mainBedElevationM === null ? null : channelBedDownhillShare(mainBedElevationM) };
}
