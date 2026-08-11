import { SeededPrng } from '../model/prng';
import type { Facility, HistoricalEvent, RailLine, RoadLink, Settlement } from './types';

export function generateHistory(
  settlements: readonly Settlement[],
  roads: readonly RoadLink[],
  railways: readonly RailLine[],
  facilities: readonly Facility[],
  prng: SeededPrng,
): HistoricalEvent[] {
  const main = settlements[0];
  const events: HistoricalEvent[] = [];
  const roman = main.foundedEra.toLowerCase().includes('roman');
  const medieval = main.foundedEra.toLowerCase().includes('medieval');
  events.push({
    year: roman ? 120 + prng.nextInt(180) : medieval ? 1080 + prng.nextInt(180) : 650 + prng.nextInt(300),
    label: `${main.name} settlement nucleus`,
    consequence: main.historicalDriver,
  });
  events.push({
    year: 1180 + prng.nextInt(170),
    label: 'Market and parish centre consolidate',
    consequence: 'A high street and market place focus roads from the rural hinterland; burgage-like plots shape the core.',
  });
  if (main.kind === 'industrial-town' || main.kind === 'port-town' || main.kind === 'principal-city') {
    events.push({
      year: 1760 + prng.nextInt(80),
      label: main.kind === 'port-town' ? 'Dock and waterfront expansion' : 'Industrial acceleration',
      consequence: main.kind === 'port-town' ? 'Warehouses, yards and workers’ housing spread along the navigable waterfront.' : 'Local minerals, water, labour and turnpike access attract mills, works and dense terraces.',
    });
  }
  if (railways.length > 0) {
    events.push({
      year: 1840 + prng.nextInt(45),
      label: 'Railway arrival',
      consequence: 'The station sits outside the old core; industry and terraces grow along the rail corridor while radial roads are bridged or diverted.',
    });
  }
  events.push({
    year: 1920 + prng.nextInt(20),
    label: 'Inter-war suburban expansion',
    consequence: 'Lower-density semi-detached estates follow arterial roads beyond the compact industrial town.',
  });
  events.push({
    year: 1950 + prng.nextInt(22),
    label: 'Post-war reconstruction and housing',
    consequence: 'Municipal estates, distributor roads and new schools expand the urban edge; some central sites are redeveloped.',
  });
  if (roads.some((road) => road.roadClass === 'motorway')) {
    events.push({
      year: 1964 + prng.nextInt(30),
      label: 'Strategic motorway opens',
      consequence: 'Long-distance traffic shifts to the bypass; logistics and retail land later cluster near junction access.',
    });
  }
  const university = facilities.find((facility) => facility.kind === 'university');
  if (university) {
    events.push({
      year: university.establishedEra.includes('19th') ? 1890 : university.establishedEra.includes('1960') ? 1966 : 1992,
      label: `${university.name} established`,
      consequence: 'Student housing, knowledge-sector employment and bus demand become locally concentrated around the campus and centre.',
    });
  }
  events.push({
    year: 2012 + prng.nextInt(13),
    label: 'Recent edge growth and brownfield reuse',
    consequence: 'New estates occupy lower-risk sites at the urban edge while selected industrial or railway land is converted to mixed use.',
  });
  return events.sort((left, right) => left.year - right.year);
}
