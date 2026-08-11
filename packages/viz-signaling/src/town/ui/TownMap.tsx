import React, { useMemo } from 'react';
import { clamp } from '../math';
import type {
  GeneratedTownRegion,
  LandUse,
  MapLens,
  Point,
  TownCell,
  Ward,
} from '../types';

interface TownMapProps {
  region: GeneratedTownRegion;
  lens: MapLens;
  selectedWardId: string | null;
  onSelectWard: (wardId: string) => void;
}

interface LensDefinition {
  label: string;
  legendLow: string;
  legendHigh: string;
  caveat: string;
}

export const LENS_DEFINITIONS: Record<MapLens, LensDefinition> = {
  overview: { label: 'Town fabric', legendLow: 'Open land', legendHigh: 'Urban uses', caveat: 'Land use, historically conditioned local street patterns and major infrastructure.' },
  elevation: { label: 'Elevation', legendLow: 'Low', legendHigh: 'High', caveat: 'Metres above modelled mean sea level; regional form plus geology, valley incision and residual relief.' },
  geology: { label: 'Bedrock geology', legendLow: 'Unit', legendHigh: 'Unit', caveat: 'Synthetic regional lithology pattern, not a BGS site map.' },
  'land-use': { label: 'Land use', legendLow: 'Rural/semi-natural', legendHigh: 'Developed', caveat: 'Generalised dominant use per grid cell.' },
  'development-era': { label: 'Development era', legendLow: 'Pre-1800', legendHigh: '2010–present', caveat: 'Dominant built-form period, not the construction date of every building.' },
  'population-density': { label: 'Population density', legendLow: 'Lower', legendHigh: 'Higher', caveat: 'Residents per km² of the whole synthetic ward, including open land.' },
  deprivation: { label: 'Relative deprivation', legendLow: 'Lower', legendHigh: 'Higher', caveat: 'Synthetic multidimensional index; not an IMD score or decile.' },
  gva: { label: 'GVA per resident estimate', legendLow: '£20k', legendHigh: '£45k', caveat: 'Low-certainty screening estimate with a hand-set range; ward GDP is not claimed.' },
  'road-traffic': { label: 'AM road congestion', legendLow: '0.0 V/C', legendHigh: '1.3+ V/C', caveat: 'Link colour is peak-hour volume/capacity; junction queues are not microsimulated.' },
  'rail-loading': { label: 'Rail load factor', legendLow: '0%', legendHigh: '120% seats', caveat: 'Rail-line colour is peak-direction passengers divided by scheduled seated capacity.' },
  'air-pollution': { label: 'PM₂.₅ annual mean', legendLow: '5 µg/m³', legendHigh: '15 µg/m³', caveat: 'Screening proxy using background, roads and industry; not a dispersion model.' },
  noise: { label: 'Noise screening level', legendLow: '35 dB', legendHigh: '65 dB', caveat: 'Indicative energetic combination of road, rail and industry sources; not Lden or a statutory noise map.' },
  'life-expectancy': { label: 'Life expectancy estimate', legendLow: '75 years', legendHigh: '85 years', caveat: 'Low-certainty contextual estimate with a hand-set range; not observed or forecast.' },
  biodiversity: { label: 'Habitat-value index', legendLow: 'Lower', legendHigh: 'Higher', caveat: 'Scenario habitat index; not statutory biodiversity units or a species survey.' },
  age: { label: 'Population aged 65+', legendLow: '12%', legendHigh: '35%', caveat: 'Aggregate ward composition derived from regional and housing-context priors.' },
  ethnicity: { label: 'Ethnic-group diversity', legendLow: 'Lower', legendHigh: 'Higher', caveat: 'Simpson diversity of Census high-level self-identification categories; full composition is in the ward panel.' },
};

const LAND_USE_COLOURS: Record<LandUse, string> = {
  sea: '#c4d7df',
  river: '#9fc2d1',
  agriculture: '#e4e2c5',
  woodland: '#9eb493',
  moorland: '#b3a99a',
  wetland: '#b7cbbb',
  park: '#b9cba5',
  'historic-core': '#8c6d5a',
  'town-centre': '#9a716d',
  'local-centre': '#b08a79',
  residential: '#d4b7a6',
  'mixed-use': '#bd9b8e',
  industry: '#8b8e92',
  logistics: '#9ca0a4',
  'retail-park': '#b9a9ae',
  education: '#9d9ab4',
  healthcare: '#b78f91',
  utilities: '#7d8487',
  transport: '#6d7378',
};

const ERA_COLOURS: Record<TownCell['developmentEra'], string> = {
  undeveloped: '#dfe1d5',
  'pre-1800': '#6f5547',
  '1800-1918': '#956d59',
  '1919-1945': '#b28c72',
  '1946-1979': '#c5a996',
  '1980-2009': '#d8c3b4',
  '2010-present': '#b7c4c1',
};

const OVERVIEW_COLOURS = {
  water: '#c4d7df',
  'farming/open': '#e4e2c5',
  'semi-natural/park': '#9eb493',
  housing: '#d4b7a6',
  'centres/mixed': '#9a716d',
  'employment/services': '#8b8e92',
  infrastructure: '#6d7378',
} as const;

function overviewColour(landUse: LandUse): string {
  if (landUse === 'sea' || landUse === 'river') return OVERVIEW_COLOURS.water;
  if (landUse === 'agriculture') return OVERVIEW_COLOURS['farming/open'];
  if (['woodland', 'moorland', 'wetland', 'park'].includes(landUse)) return OVERVIEW_COLOURS['semi-natural/park'];
  if (landUse === 'residential') return OVERVIEW_COLOURS.housing;
  if (['historic-core', 'town-centre', 'local-centre', 'mixed-use'].includes(landUse)) return OVERVIEW_COLOURS['centres/mixed'];
  if (['industry', 'logistics', 'retail-park', 'education', 'healthcare'].includes(landUse)) return OVERVIEW_COLOURS['employment/services'];
  return OVERVIEW_COLOURS.infrastructure;
}

function categoricalLegendItems(lens: MapLens, region: GeneratedTownRegion): { label: string; colour: string }[] | null {
  if (lens === 'geology') return region.geologyUnits.map((unit) => ({ label: unit.name, colour: unit.mapColour }));
  if (lens === 'overview') {
    return Object.entries(OVERVIEW_COLOURS).map(([label, colour]) => ({ label, colour }));
  }
  if (lens === 'land-use') {
    return (Object.entries(LAND_USE_COLOURS) as [LandUse, string][]).map(([label, colour]) => ({ label: label.replace(/-/g, ' '), colour }));
  }
  if (lens === 'development-era') {
    return ['undeveloped', 'pre-1800', '1800-1918', '1919-1945', '1946-1979', '1980-2009', '2010-present'].map((era) => ({ label: era, colour: ERA_COLOURS[era as TownCell['developmentEra']] }));
  }
  return null;
}

function continuousLegendGradient(lens: MapLens): string {
  const endpoints: Partial<Record<MapLens, [string, string]>> = {
    elevation: ['#d8e2c8', '#70645b'],
    'population-density': ['#e6e2d8', '#65556d'],
    deprivation: ['#e1e4d6', '#8a4e45'],
    gva: ['#e3ded3', '#3f7774'],
    'road-traffic': ['#d5c9b6', '#8e3f35'],
    'rail-loading': ['#a9a4ad', '#453b69'],
    'air-pollution': ['#dfe5dc', '#82604f'],
    noise: ['#e2e3da', '#9b5647'],
    'life-expectancy': ['#9c6759', '#6f9b8c'],
    biodiversity: ['#d9d4c9', '#54765b'],
    age: ['#dedfd8', '#5e718d'],
    ethnicity: ['#e0ded7', '#756287'],
  };
  const [start, end] = endpoints[lens] ?? ['#dedfd8', '#6b5e70'];
  return `linear-gradient(90deg, ${start}, ${end})`;
}

function parseHex(hex: string): [number, number, number] {
  return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)];
}

function mixColour(start: string, end: string, amount: number): string {
  const left = parseHex(start);
  const right = parseHex(end);
  const t = clamp(amount, 0, 1);
  return `rgb(${left.map((value, index) => Math.round(value + (right[index] - value) * t)).join(',')})`;
}

function simpsonDiversity(composition: Ward['ethnicity']): number {
  return 1 - Object.values(composition).reduce((sum, share) => sum + share ** 2, 0);
}

function numericWardValue(lens: MapLens, ward: Ward): number {
  if (lens === 'population-density') return ward.populationDensityPerKm2;
  if (lens === 'deprivation') return ward.metrics.relativeDeprivationIndex;
  if (lens === 'gva') return ward.metrics.gvaPerResidentGbp.estimate;
  if (lens === 'road-traffic') return ward.metrics.trafficExposureIndex;
  if (lens === 'air-pollution') return ward.metrics.pm25AnnualMeanUgM3.estimate;
  if (lens === 'noise') return ward.metrics.noiseScreeningDb.estimate;
  if (lens === 'life-expectancy') return ward.metrics.lifeExpectancyYears.estimate;
  if (lens === 'biodiversity') return ward.metrics.biodiversityIndex;
  if (lens === 'age') return ward.age['65+'] ?? 0;
  if (lens === 'ethnicity') return simpsonDiversity(ward.ethnicity);
  return 0;
}

function fixedRange(lens: MapLens, region: GeneratedTownRegion): [number, number] {
  if (lens === 'elevation') {
    const landElevations = region.cells.filter((cell) => !cell.isSea).map((cell) => cell.elevationM);
    return [Math.min(...landElevations), Math.max(...landElevations)];
  }
  if (lens === 'population-density') return [0, 6_500];
  if (lens === 'deprivation') return [10, 90];
  if (lens === 'gva') return [20_000, 45_000];
  if (lens === 'road-traffic') return [0, 100];
  if (lens === 'rail-loading') return [0, 1.2];
  if (lens === 'air-pollution') return [5, 15];
  if (lens === 'noise') return [35, 65];
  if (lens === 'life-expectancy') return [75, 85];
  if (lens === 'biodiversity') return [0, 100];
  if (lens === 'age') return [0.12, 0.35];
  if (lens === 'ethnicity') return [0, 0.62];
  return [0, 1];
}

function cellFill(cell: TownCell, ward: Ward | undefined, lens: MapLens, region: GeneratedTownRegion): string {
  if (cell.isSea) return LAND_USE_COLOURS.sea;
  if (lens === 'overview') return overviewColour(cell.landUse);
  if (lens === 'land-use') return LAND_USE_COLOURS[cell.landUse];
  if (lens === 'geology') return region.geologyUnits.find((unit) => unit.id === cell.bedrockUnitId)?.mapColour ?? '#c7c1b5';
  if (lens === 'development-era') return ERA_COLOURS[cell.developmentEra];
  if (lens === 'road-traffic' || lens === 'rail-loading') return '#e7e6e0';
  const [minimum, maximum] = fixedRange(lens, region);
  let value = cell.elevationM;
  if (ward) value = numericWardValue(lens, ward);
  const amount = (value - minimum) / Math.max(1e-9, maximum - minimum);
  if (lens === 'elevation') return mixColour('#d8e2c8', '#70645b', amount);
  if (lens === 'population-density') return mixColour('#e6e2d8', '#65556d', amount);
  if (lens === 'deprivation') return mixColour('#e1e4d6', '#8a4e45', amount);
  if (lens === 'gva') return mixColour('#e3ded3', '#3f7774', amount);
  if (lens === 'air-pollution') return mixColour('#dfe5dc', '#82604f', amount);
  if (lens === 'noise') return mixColour('#e2e3da', '#9b5647', amount);
  if (lens === 'life-expectancy') return mixColour('#9c6759', '#6f9b8c', amount);
  if (lens === 'biodiversity') return mixColour('#d9d4c9', '#54765b', amount);
  if (lens === 'age') return mixColour('#dedfd8', '#5e718d', amount);
  if (lens === 'ethnicity') return mixColour('#e0ded7', '#756287', amount);
  return '#d8d6cf';
}

function legendLabels(lens: MapLens, region: GeneratedTownRegion, definition: LensDefinition): [string, string] {
  const [minimum, maximum] = fixedRange(lens, region);
  if (lens === 'elevation') return [`${Math.round(minimum)} m`, `${Math.round(maximum)} m`];
  if (lens === 'population-density') return ['0 /km²', '6,500 /km²'];
  if (lens === 'deprivation') return ['10 /100', '90 /100'];
  if (lens === 'biodiversity') return ['0 /100', '100 /100'];
  if (lens === 'age') return ['12%', '35% aged 65+'];
  if (lens === 'ethnicity') return ['0.00', '0.62 diversity'];
  return [definition.legendLow, definition.legendHigh];
}

function cellDescription(cell: TownCell, ward: Ward | undefined, lens: MapLens, region: GeneratedTownRegion): string {
  if (cell.isSea) return 'Sea';
  if (!ward) return 'Unassigned land cell';
  const prefix = `${ward.name}`;
  if (lens === 'overview' || lens === 'land-use') return `${prefix}: ${cell.landUse.replace(/-/g, ' ')}`;
  if (lens === 'elevation') return `${prefix}: ${cell.elevationM.toFixed(0)} m elevation`;
  if (lens === 'geology') return `${prefix}: ${region.geologyUnits.find((unit) => unit.id === cell.bedrockUnitId)?.name ?? cell.bedrockUnitId}`;
  if (lens === 'development-era') return `${prefix}: ${cell.developmentEra}`;
  if (lens === 'population-density') return `${prefix}: ${ward.populationDensityPerKm2.toLocaleString()} residents/km²`;
  if (lens === 'deprivation') return `${prefix}: relative deprivation ${ward.metrics.relativeDeprivationIndex}/100`;
  if (lens === 'gva') return `${prefix}: about £${(Math.round(ward.metrics.gvaPerResidentGbp.estimate / 500) * 500).toLocaleString()} GVA per resident`;
  if (lens === 'road-traffic') return `${prefix}: ward traffic exposure ${ward.metrics.trafficExposureIndex}/100; road V/C is encoded on links`;
  if (lens === 'rail-loading') return `${prefix}: rail load factor is encoded on railway lines`;
  if (lens === 'air-pollution') return `${prefix}: PM2.5 ${ward.metrics.pm25AnnualMeanUgM3.estimate.toFixed(1)} µg/m³`;
  if (lens === 'noise') return `${prefix}: noise screening level ${ward.metrics.noiseScreeningDb.estimate.toFixed(0)} dB`;
  if (lens === 'life-expectancy') return `${prefix}: life expectancy estimate ${ward.metrics.lifeExpectancyYears.estimate.toFixed(1)} years`;
  if (lens === 'biodiversity') return `${prefix}: habitat-value index ${ward.metrics.biodiversityIndex}/100`;
  if (lens === 'age') return `${prefix}: ${Math.round((ward.age['65+'] ?? 0) * 100)}% aged 65+`;
  return `${prefix}: ethnic-group diversity ${simpsonDiversity(ward.ethnicity).toFixed(2)}`;
}

function pathData(path: readonly Point[]): string {
  return path.map((point, index) => `${index === 0 ? 'M' : 'L'}${(point.x * 1000).toFixed(1)},${(point.y * 1000).toFixed(1)}`).join(' ');
}

function wardBoundaryPath(region: GeneratedTownRegion): string {
  const size = region.config.gridSize;
  const step = 1000 / size;
  const segments: string[] = [];
  const byId = new Map(region.cells.map((cell) => [cell.id, cell]));
  for (const cell of region.cells) {
    if (cell.isSea || cell.wardId === null) continue;
    const x = cell.column * step;
    const y = cell.row * step;
    const north = cell.row > 0 ? byId.get(cell.id - size) : undefined;
    const west = cell.column > 0 ? byId.get(cell.id - 1) : undefined;
    if (!north || north.wardId !== cell.wardId) segments.push(`M${x},${y}h${step}`);
    if (!west || west.wardId !== cell.wardId) segments.push(`M${x},${y}v${step}`);
    if (cell.row === size - 1) segments.push(`M${x},${y + step}h${step}`);
    if (cell.column === size - 1) segments.push(`M${x + step},${y}v${step}`);
  }
  return segments.join(' ');
}

function selectedWardBoundaryPath(region: GeneratedTownRegion, selectedWardId: string | null): string {
  if (selectedWardId === null) return '';
  const size = region.config.gridSize;
  const step = 1000 / size;
  const byId = new Map(region.cells.map((cell) => [cell.id, cell]));
  const segments: string[] = [];
  for (const cell of region.cells) {
    if (cell.wardId !== selectedWardId) continue;
    const x = cell.column * step;
    const y = cell.row * step;
    const north = cell.row > 0 ? byId.get(cell.id - size) : undefined;
    const east = cell.column < size - 1 ? byId.get(cell.id + 1) : undefined;
    const south = cell.row < size - 1 ? byId.get(cell.id + size) : undefined;
    const west = cell.column > 0 ? byId.get(cell.id - 1) : undefined;
    if (north?.wardId !== selectedWardId) segments.push(`M${x},${y}h${step}`);
    if (east?.wardId !== selectedWardId) segments.push(`M${x + step},${y}v${step}`);
    if (south?.wardId !== selectedWardId) segments.push(`M${x},${y + step}h${step}`);
    if (west?.wardId !== selectedWardId) segments.push(`M${x},${y}v${step}`);
  }
  return segments.join(' ');
}

function facilitySymbol(kind: string): string {
  if (kind === 'hospital') return 'H';
  if (kind === 'university' || kind === 'further-education-college') return 'U';
  if (kind === 'rail-station') return 'S';
  if (kind === 'cathedral' || kind === 'abbey-remains') return '†';
  if (kind === 'sewage-works') return 'W';
  if (kind === 'retail-centre' || kind === 'retail-park') return 'R';
  return '•';
}

export function TownMap({ region, lens, selectedWardId, onSelectWard }: TownMapProps): React.ReactElement {
  const wardById = useMemo(() => new Map(region.wards.map((ward) => [ward.id, ward])), [region.wards]);
  const boundaryPath = useMemo(() => wardBoundaryPath(region), [region]);
  const selectedBoundaryPath = useMemo(() => selectedWardBoundaryPath(region, selectedWardId), [region, selectedWardId]);
  const step = 1000 / region.config.gridSize;
  const definition = LENS_DEFINITIONS[lens];
  const [legendLow, legendHigh] = legendLabels(lens, region, definition);
  const discreteLegendItems = categoricalLegendItems(lens, region);
  const scaleBarKm = region.config.sizeKm >= 40 ? 10 : 5;
  const scaleBarWidth = (scaleBarKm / region.config.sizeKm) * 1000;
  return (
    <div className="town-map-wrap">
      <div className="town-map-heading">
        <div>
          <strong>{definition.label}</strong>
          <span>{definition.caveat}</span>
        </div>
        <div className="town-gradient-legend" aria-label={discreteLegendItems ? `${definition.label}: discrete categories` : `${legendLow} to ${legendHigh}`}>
          <span>{legendLow}</span>
          <i className={discreteLegendItems ? 'is-discrete' : undefined} style={discreteLegendItems ? undefined : { background: continuousLegendGradient(lens) }}>
            {discreteLegendItems?.map((item, index) => <b key={`${item.colour}-${index}`} style={{ backgroundColor: item.colour }} />)}
          </i>
          <span>{legendHigh}</span>
        </div>
      </div>
      {discreteLegendItems && <div className="town-category-key" aria-label={`${definition.label} categories`}>{discreteLegendItems.map((item) => <span key={item.label}><i style={{ backgroundColor: item.colour }} />{item.label}</span>)}</div>}
      <svg className="town-map" viewBox="0 0 1000 1000" role="img" aria-labelledby="town-map-title town-map-desc">
        <title id="town-map-title">Synthetic map of {region.settlements[0].name}, {definition.label} lens</title>
        <desc id="town-map-desc">Square {region.config.sizeKm} kilometre study area with pointer-selectable synthetic wards, rivers, roads, railways, settlements and selected facilities. Use the synthetic ward selector beside the map for keyboard selection.</desc>
        <g shapeRendering="crispEdges">
          {region.cells.map((cell) => {
            const ward = cell.wardId ? wardById.get(cell.wardId) : undefined;
            return (
              <rect
                key={cell.id}
                x={cell.column * step}
                y={cell.row * step}
                width={step + 0.35}
                height={step + 0.35}
                fill={cellFill(cell, ward, lens, region)}
                className="town-cell"
                onClick={() => cell.wardId && onSelectWard(cell.wardId)}
              >
                <title>{cellDescription(cell, ward, lens, region)}</title>
              </rect>
            );
          })}
        </g>

        <g className="town-local-street-layer" aria-label="Schematic local street network">
          {region.streets.map((street) => (
            <path key={street.id} d={pathData(street.path)} className={`town-local-street ${street.pattern}`}>
              <title>{street.pattern.replace(/-/g, ' ')} · dominant era {street.developmentEra}</title>
            </path>
          ))}
        </g>

        {region.rivers.map((river) => (
          <path key={river.id} d={pathData(river.path)} className={river.order === 'major' ? 'town-river major' : 'town-river tributary'} />
        ))}

        <g className="town-road-layer">
          {region.roads.map((road) => {
            const traffic = lens === 'road-traffic';
            const stroke = traffic ? mixColour('#d5c9b6', '#8e3f35', road.volumeCapacityRatio / 1.35) : undefined;
            const width = road.roadClass === 'motorway' ? 7 : road.roadClass === 'primary-a' ? 4.8 : road.roadClass === 'secondary-a' ? 3.2 : 2;
            return (
              <g key={road.id}>
                <path d={pathData(road.path)} className="town-road-casing" style={{ strokeWidth: width + 2.4 }} />
                <path d={pathData(road.path)} className={`town-road ${road.roadClass}`} style={{ stroke, strokeWidth: width }}>
                  <title>{road.name}: {road.amPeakVehicles.toLocaleString()} veh/h, V/C {road.volumeCapacityRatio.toFixed(1)} · {road.congestionState}</title>
                </path>
              </g>
            );
          })}
        </g>

        {region.railways.map((railway) => (
          <path
            key={railway.id}
            d={pathData(railway.path)}
            className={lens === 'rail-loading' ? 'town-rail is-active' : 'town-rail'}
            style={lens === 'rail-loading' ? { stroke: mixColour('#a9a4ad', '#453b69', railway.loadFactor / 1.2), strokeWidth: 5 } : undefined}
          >
            <title>{railway.name}: {Math.round(railway.loadFactor * 100)}% of seated peak capacity</title>
          </path>
        ))}

        <path d={boundaryPath} className="town-ward-boundaries" />
        <path d={selectedBoundaryPath} className="town-selected-ward" />

        {(lens === 'overview' || lens === 'land-use') && region.facilities.slice(0, 14).map((facility) => (
          <g key={facility.id} transform={`translate(${facility.location.x * 1000},${facility.location.y * 1000})`} className="town-facility">
            <circle r="9" />
            <text y="4">{facilitySymbol(facility.kind)}</text>
            <title>{facility.name}: {facility.sitingRationale}</title>
          </g>
        ))}

        {region.settlements.map((settlement, index) => (
          <g key={settlement.id} className={index === 0 ? 'town-label main' : 'town-label'} transform={`translate(${settlement.centre.x * 1000},${settlement.centre.y * 1000})`}>
            <circle r={index === 0 ? 5.5 : 3.5} />
            <text x="8" y={index === 0 ? -7 : -5}>{settlement.name}</text>
          </g>
        ))}

        <g className="town-scale" transform="translate(34,950)">
          <path d={`M0,0h${scaleBarWidth}M0,-5v10M${scaleBarWidth},-5v10`} />
          <text x={scaleBarWidth / 2} y="-10" textAnchor="middle">{scaleBarKm} km</text>
        </g>
        <path d="M944,72l12,-26l12,26h-8v20h-8v-20z" className="town-north-arrow" />
        <text x="956" y="36" textAnchor="middle" className="town-north-label">N</text>
      </svg>
      {(lens === 'overview' || lens === 'land-use') && <div className="town-facility-key" aria-label="Facility symbol key"><span><b>S</b> station</span><span><b>H</b> hospital</span><span><b>U</b> education</span><span><b>R</b> retail</span><span><b>W</b> wastewater</span><span><b>†</b> heritage</span><span><b>•</b> other</span></div>}
    </div>
  );
}
