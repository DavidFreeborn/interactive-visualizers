/**
 * Public types for the synthetic English town-region generator.
 *
 * Coordinates are normalised to the square study area: (0, 0) is north-west
 * and (1, 1) is south-east. Distances and areas are reported in SI units.
 */

export type EnglishRegion =
  | 'north-east'
  | 'north-west'
  | 'yorkshire-humber'
  | 'east-midlands'
  | 'west-midlands'
  | 'east-of-england'
  | 'london-fringe'
  | 'south-east'
  | 'south-west';

export type PopulationBand = '50k' | '100k' | '200k';
export type MapSide = 'north' | 'east' | 'south' | 'west';
export type EdgeCharacter = 'sea' | 'uplands' | 'rolling' | 'lowland';

export interface BoundaryConditions {
  north: EdgeCharacter;
  east: EdgeCharacter;
  south: EdgeCharacter;
  west: EdgeCharacter;
}

export interface RiverSpecification {
  sourceSide: MapSide;
  outletSide: MapSide;
}

export interface TownGeneratorConfigInput {
  seed?: number;
  region?: EnglishRegion;
  populationBand?: PopulationBand;
  mainSettlementName?: string | null;
  sizeKm?: number;
  gridSize?: number;
  boundaries?: Partial<BoundaryConditions>;
  river?: RiverSpecification | null;
}

export interface TownGeneratorConfig {
  seed: number;
  region: EnglishRegion;
  populationBand: PopulationBand;
  mainSettlementName: string | null;
  sizeKm: number;
  gridSize: number;
  boundaries: BoundaryConditions;
  river: RiverSpecification | null;
}

export interface Point {
  x: number;
  y: number;
}

export type BedrockFamily =
  | 'chalk'
  | 'limestone'
  | 'sandstone'
  | 'mudstone-clay'
  | 'coal-measures'
  | 'granite'
  | 'slate'
  | 'volcanic'
  | 'metamorphic'
  | 'alluvium';

export interface GeologyUnit {
  id: string;
  name: string;
  period: string;
  family: BedrockFamily;
  share: number;
  hardness: number;
  permeability: number;
  fertility: number;
  resource: 'coal' | 'stone' | 'clay' | 'metal' | 'aggregate' | 'none';
  mapColour: string;
}

export type SuperficialDeposit =
  | 'none/thin'
  | 'glacial till'
  | 'river alluvium'
  | 'river terrace gravel'
  | 'coastal sand and silt'
  | 'peat';

export type SoilGroup =
  | 'brown earth'
  | 'calcareous'
  | 'podzolic'
  | 'slowly permeable seasonally wet'
  | 'alluvial'
  | 'peaty upland'
  | 'sandy acidic';

export type HabitatType =
  | 'urban'
  | 'arable'
  | 'improved grassland'
  | 'semi-natural grassland'
  | 'deciduous woodland'
  | 'conifer plantation'
  | 'heath and moor'
  | 'wetland'
  | 'river'
  | 'coastal';

export type FloodRiskBand = 'sea' | 'high' | 'medium' | 'low' | 'very-low';

export interface TerrainCell {
  id: number;
  row: number;
  column: number;
  centre: Point;
  elevationM: number;
  slope: number;
  bedrockUnitId: string;
  superficialDeposit: SuperficialDeposit;
  soil: SoilGroup;
  habitat: HabitatType;
  agriculturalGrade: '1' | '2' | '3a' | '3b' | '4' | '5' | 'non-agricultural';
  riverDistanceKm: number;
  coastDistanceKm: number;
  floodRisk: FloodRiskBand;
  runoffIndex: number;
  isSea: boolean;
}

export type DevelopmentEra =
  | 'undeveloped'
  | 'pre-1800'
  | '1800-1918'
  | '1919-1945'
  | '1946-1979'
  | '1980-2009'
  | '2010-present';

export type LandUse =
  | 'sea'
  | 'river'
  | 'agriculture'
  | 'woodland'
  | 'moorland'
  | 'wetland'
  | 'park'
  | 'historic-core'
  | 'town-centre'
  | 'local-centre'
  | 'residential'
  | 'mixed-use'
  | 'industry'
  | 'logistics'
  | 'retail-park'
  | 'education'
  | 'healthcare'
  | 'utilities'
  | 'transport';

export type HousingType =
  | 'none'
  | 'historic mixed frontage'
  | 'stone terrace'
  | 'red-brick terrace'
  | 'inter-war semi-detached'
  | 'post-war council estate'
  | 'post-war private suburb'
  | 'bungalows'
  | 'modern estate'
  | 'urban flats';

export interface TownCell extends TerrainCell {
  landUse: LandUse;
  developmentEra: DevelopmentEra;
  housingType: HousingType;
  population: number;
  jobs: number;
  residentialCapacity: number;
  wardId: string | null;
}

export type SettlementKind =
  | 'principal-city'
  | 'principal-town'
  | 'market-town'
  | 'industrial-town'
  | 'port-town'
  | 'suburb'
  | 'village'
  | 'mining-village';

export interface NameEtymology {
  language: 'Old English' | 'Old Norse' | 'Brittonic' | 'Latin/Old English' | 'Middle English' | 'Modern';
  elements: string[];
  gloss: string;
  confidence: 'schematic';
}

export interface Settlement {
  id: string;
  name: string;
  kind: SettlementKind;
  centre: Point;
  population: number;
  foundedEra: string;
  historicalDriver: string;
  etymology: NameEtymology | null;
  absorbedIntoMainUrbanArea: boolean;
}

export interface RiverFeature {
  id: string;
  name: string;
  order: 'major' | 'tributary';
  path: Point[];
  bedElevationM: number[] | null;
  meanWidthM: number;
  navigableReachKm: number;
}

export type RoadClass = 'motorway' | 'primary-a' | 'secondary-a' | 'b-road';

export interface RoadLink {
  id: string;
  name: string;
  roadClass: RoadClass;
  builtEra: string;
  path: Point[];
  lengthKm: number;
  freeFlowMinutes: number;
  amPeakVehicles: number;
  hourlyCapacity: number;
  volumeCapacityRatio: number;
  congestionState: 'free-flow' | 'busy' | 'congested' | 'oversaturated';
  congestedMinutes: number;
  meanSpeedKph: number;
}

export type LocalStreetPattern =
  | 'historic-irregular'
  | 'terrace-grid'
  | 'inter-war-avenue'
  | 'post-war-distributor'
  | 'contemporary-block';

export interface LocalStreet {
  id: string;
  pattern: LocalStreetPattern;
  developmentEra: DevelopmentEra;
  path: Point[];
}

export interface RailLine {
  id: string;
  name: string;
  kind: 'main-line' | 'secondary-line' | 'freight-branch';
  path: Point[];
  stations: string[];
  trainsPerPeakHour: number;
  seatedCapacityPerTrain: number;
  peakDirectionPassengers: number;
  loadFactor: number;
}

export type FacilityKind =
  | 'rail-station'
  | 'bus-station'
  | 'university'
  | 'further-education-college'
  | 'hospital'
  | 'cathedral'
  | 'abbey-remains'
  | 'sewage-works'
  | 'electricity-substation'
  | 'energy-from-waste'
  | 'retail-centre'
  | 'retail-park'
  | 'industrial-estate'
  | 'cemetery'
  | 'country-park';

export interface Facility {
  id: string;
  name: string;
  kind: FacilityKind;
  location: Point;
  establishedEra: string;
  sitingRationale: string;
}

export interface Composition {
  [category: string]: number;
}

export interface EstimateInterval {
  estimate: number;
  lower: number;
  upper: number;
  rangeBasis: 'hand-set-sensitivity';
}

export interface WardMetrics {
  relativeDeprivationIndex: number;
  gvaPerResidentGbp: EstimateInterval;
  lifeExpectancyYears: EstimateInterval;
  pm25AnnualMeanUgM3: EstimateInterval;
  noiseScreeningDb: EstimateInterval;
  biodiversityIndex: number;
  trafficExposureIndex: number;
}

export interface Ward {
  id: string;
  name: string;
  cellIds: number[];
  centroid: Point;
  areaKm2: number;
  population: number;
  households: number;
  jobs: number;
  populationDensityPerKm2: number;
  dominantLandUse: LandUse;
  dominantHousingType: HousingType;
  age: Composition;
  ethnicity: Composition;
  qualifications: Composition;
  occupations: Composition;
  tenure: Composition;
  metrics: WardMetrics;
  interpretationNotes: string[];
}

export interface HistoricalEvent {
  year: number;
  label: string;
  consequence: string;
}

export interface RegionSummary {
  studyAreaKm2: number;
  principalSettlementPopulation: number;
  totalPopulation: number;
  totalJobs: number;
  urbanisedShare: number;
  semiNaturalHabitatShare: number;
  railModeShare: number;
  carDriverModeShare: number;
  meanAmPeakRoadVcr: number;
}

export interface GenerationDiagnostics {
  populationBalanceError: number;
  demographicMaximumSumError: number;
  cellsWithoutWard: number;
  riverDownhillShare: number | null;
  warnings: string[];
}

export interface ModelSource {
  id: string;
  organisation: string;
  title: string;
  url: string;
  usedFor: string;
}

export interface GeneratedTownRegion {
  modelVersion: string;
  scientificStatus: 'standard-toy-model';
  modelKind: 'synthetic-scenario-generator';
  config: TownGeneratorConfig;
  landscapeArchetype: string;
  geologyUnits: GeologyUnit[];
  cells: TownCell[];
  rivers: RiverFeature[];
  settlements: Settlement[];
  roads: RoadLink[];
  streets: LocalStreet[];
  railways: RailLine[];
  facilities: Facility[];
  wards: Ward[];
  history: HistoricalEvent[];
  summary: RegionSummary;
  diagnostics: GenerationDiagnostics;
  assumptions: string[];
  sources: ModelSource[];
}

export type MapLens =
  | 'overview'
  | 'elevation'
  | 'geology'
  | 'land-use'
  | 'development-era'
  | 'population-density'
  | 'deprivation'
  | 'gva'
  | 'road-traffic'
  | 'rail-loading'
  | 'air-pollution'
  | 'noise'
  | 'life-expectancy'
  | 'biodiversity'
  | 'age'
  | 'ethnicity';
