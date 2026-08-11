import { SeededPrng } from '../model/prng';
import { weightedChoice } from './math';
import type { EnglishRegion, NameEtymology } from './types';

interface NameElement {
  text: string;
  language: NameEtymology['language'];
  gloss: string;
}

export interface SettlementNameContext {
  region: EnglishRegion;
  nearRiver: boolean;
  nearCoast: boolean;
  wooded: boolean;
  valley: boolean;
  upland: boolean;
  romanOrigin: boolean;
  isSecondary: boolean;
}

const STEMS: Record<EnglishRegion, string[]> = {
  'north-east': ['Ald', 'Aln', 'Bram', 'Cor', 'Elden', 'Hed', 'Keld', 'Roth', 'Wark', 'Wear', 'Broom', 'Raven'],
  'north-west': ['Alder', 'Bram', 'Calder', 'Cart', 'Dun', 'Eller', 'Haver', 'Kirk', 'Ribble', 'Skel', 'Tor', 'Wyre'],
  'yorkshire-humber': ['Alder', 'Bever', 'Bram', 'Caw', 'Der', 'Easing', 'Hamble', 'Keld', 'Raven', 'Skel', 'Spen', 'Wether'],
  'east-midlands': ['Ash', 'Bel', 'Bram', 'Col', 'Eden', 'Elms', 'Kirk', 'Lang', 'Mel', 'Sax', 'Welling', 'Wither'],
  'west-midlands': ['Alve', 'Brom', 'Clent', 'Dud', 'Eard', 'Hales', 'Kin', 'Leom', 'Mal', 'Severn', 'Wen', 'Wyre'],
  'east-of-england': ['Alder', 'Bec', 'Blyth', 'Cley', 'Dun', 'Elm', 'Hox', 'Laken', 'Milden', 'Reed', 'Swaff', 'Waven'],
  'london-fringe': ['Ash', 'Brent', 'Colne', 'Epping', 'Harrow', 'Lea', 'Marden', 'Ruis', 'Stan', 'Waltham', 'Wend', 'Wye'],
  'south-east': ['Arun', 'Ash', 'Bex', 'Bram', 'Cran', 'Dart', 'Hors', 'Ock', 'Rother', 'Stour', 'Tenter', 'Wye'],
  'south-west': ['Avon', 'Bod', 'Brid', 'Cad', 'Dart', 'Exe', 'Frome', 'Lyd', 'Mere', 'Otter', 'Tamar', 'Torr'],
};

const GENERAL_SUFFIXES: NameElement[] = [
  { text: 'ton', language: 'Old English', gloss: 'farmstead or settlement' },
  { text: 'ham', language: 'Old English', gloss: 'homestead' },
  { text: 'worth', language: 'Old English', gloss: 'enclosure' },
  { text: 'field', language: 'Old English', gloss: 'open land' },
  { text: 'wick', language: 'Old English', gloss: 'specialised farm or settlement' },
];

const RIVER_SUFFIXES: NameElement[] = [
  { text: 'ford', language: 'Old English', gloss: 'river crossing' },
  { text: 'bridge', language: 'Middle English', gloss: 'settlement at a bridge' },
  { text: 'bourne', language: 'Old English', gloss: 'stream' },
];

const COAST_SUFFIXES: NameElement[] = [
  { text: 'mouth', language: 'Old English', gloss: 'river mouth' },
  { text: 'haven', language: 'Old English', gloss: 'harbour or sheltered inlet' },
  { text: 'port', language: 'Latin/Old English', gloss: 'harbour or market town' },
];

const WOOD_SUFFIXES: NameElement[] = [
  { text: 'ley', language: 'Old English', gloss: 'woodland clearing' },
  { text: 'hurst', language: 'Old English', gloss: 'wooded hill' },
  { text: 'holt', language: 'Old English', gloss: 'wood' },
];

const UPLAND_SUFFIXES: NameElement[] = [
  { text: 'don', language: 'Old English', gloss: 'hill' },
  { text: 'edge', language: 'Old English', gloss: 'ridge or escarpment' },
  { text: 'moor', language: 'Old English', gloss: 'open upland' },
];

const REGION_SUFFIXES: Partial<Record<EnglishRegion, NameElement[]>> = {
  'north-east': [
    { text: 'dene', language: 'Old English', gloss: 'valley' },
    { text: 'burn', language: 'Old English', gloss: 'stream' },
  ],
  'north-west': [
    { text: 'dale', language: 'Old Norse', gloss: 'valley' },
    { text: 'thwaite', language: 'Old Norse', gloss: 'clearing' },
  ],
  'yorkshire-humber': [
    { text: 'by', language: 'Old Norse', gloss: 'farmstead or village' },
    { text: 'thorpe', language: 'Old Norse', gloss: 'secondary settlement' },
    { text: 'dale', language: 'Old Norse', gloss: 'valley' },
  ],
  'east-midlands': [
    { text: 'by', language: 'Old Norse', gloss: 'farmstead or village' },
    { text: 'thorpe', language: 'Old Norse', gloss: 'secondary settlement' },
  ],
  'east-of-england': [
    { text: 'toft', language: 'Old Norse', gloss: 'house plot or farmstead' },
    { text: 'ey', language: 'Old English', gloss: 'island or dry ground in marsh' },
  ],
  'south-east': [
    { text: 'den', language: 'Old English', gloss: 'woodland pasture' },
    { text: 'hurst', language: 'Old English', gloss: 'wooded hill' },
  ],
  'south-west': [
    { text: 'combe', language: 'Brittonic', gloss: 'short valley' },
    { text: 'worthy', language: 'Old English', gloss: 'enclosure' },
  ],
};

function joinName(stem: string, suffix: string): string {
  let joined = `${stem}${suffix}`;
  joined = joined.replace(/([a-z])\1{2}/gi, '$1$1');
  joined = joined.replace(/eham$/i, 'ham');
  joined = joined.replace(/dt/gi, 't');
  joined = joined.replace(/nb/gi, 'mb');
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

export function generateRiverName(region: EnglishRegion, prng: SeededPrng): string {
  const stems = STEMS[region];
  const stem = stems[prng.nextInt(stems.length)];
  const endings = ['en', 'er', 'el', 'on', 'a', ''];
  const ending = endings[prng.nextInt(endings.length)];
  const raw = `${stem}${ending}`.replace(/([aeiou])\1/gi, '$1');
  return `River ${raw.charAt(0).toUpperCase()}${raw.slice(1)}`;
}

export function generateSettlementName(
  context: SettlementNameContext,
  prng: SeededPrng,
  usedNames: Set<string>,
): { name: string; etymology: NameEtymology } {
  const choices: { value: NameElement; weight: number }[] = GENERAL_SUFFIXES.map((value) => ({ value, weight: 1 }));
  if (context.nearRiver) {
    choices.push(...RIVER_SUFFIXES.map((value) => ({ value, weight: value.text === 'ford' ? 2.8 : 1.4 })));
  }
  if (context.nearCoast) {
    choices.push(...COAST_SUFFIXES.map((value) => ({ value, weight: 2.2 })));
  }
  if (context.wooded) {
    choices.push(...WOOD_SUFFIXES.map((value) => ({ value, weight: 1.8 })));
  }
  if (context.upland) {
    choices.push(...UPLAND_SUFFIXES.map((value) => ({ value, weight: 1.5 })));
  }
  const regional = REGION_SUFFIXES[context.region] ?? [];
  choices.push(...regional.map((value) => ({ value, weight: context.valley && ['dale', 'dene', 'combe'].includes(value.text) ? 3 : 1.8 })));
  if (context.romanOrigin) {
    const form = context.region === 'north-west' ? 'caster' : 'chester';
    choices.push({ value: { text: form, language: 'Latin/Old English', gloss: 'Roman fort' }, weight: 4 });
  }

  const stems = STEMS[context.region];
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const stem = stems[prng.nextInt(stems.length)];
    const suffix = weightedChoice(prng, choices);
    let name = joinName(stem, suffix.text);
    if (context.isSecondary && attempt > 12) {
      const qualifier = prng.nextFloat() < 0.5 ? 'Little' : 'Upper';
      name = `${qualifier} ${name}`;
    }
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return {
        name,
        etymology: {
          language: suffix.language,
          elements: [stem, suffix.text],
          gloss: `${stem} + ${suffix.gloss}`,
          confidence: 'schematic',
        },
      };
    }
  }

  const fallback = `New ${joinName(stems[0], 'ton')}`;
  usedNames.add(fallback);
  return {
    name: fallback,
    etymology: {
      language: 'Modern',
      elements: ['New', stems[0], 'ton'],
      gloss: 'modern distinguishing prefix applied to a settlement name',
      confidence: 'schematic',
    },
  };
}

const WARD_FEATURES = [
  'Abbey', 'Castle', 'Hollywell', 'Northfield', 'Westfield', 'Eastgate', 'Riverside', 'Highfield',
  'Park', 'Station', 'Old Town', 'Moor', 'Brookside', 'Oakfield', 'Southgate', 'Market', 'Dock',
  'Hill', 'Priory', 'Millfield', 'Church', 'Common',
];

export function generateWardName(
  prng: SeededPrng,
  settlementName: string,
  usedNames: Set<string>,
): string {
  for (let attempt = 0; attempt < WARD_FEATURES.length * 2; attempt += 1) {
    const feature = WARD_FEATURES[prng.nextInt(WARD_FEATURES.length)];
    const candidate = prng.nextFloat() < 0.22 ? `${settlementName} ${feature}` : feature;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }
  const candidate = `${settlementName} ${usedNames.size + 1}`;
  usedNames.add(candidate);
  return candidate;
}
