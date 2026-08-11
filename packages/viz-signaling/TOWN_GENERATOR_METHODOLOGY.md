# Synthetic English Town-Region Generator: Methodology and Validation

## Scientific status and intended use

The generator is a **standard toy model** and, more specifically, a reproducible synthetic-scenario generator. It produces fictional but internally coupled English town-regions for teaching, exploration, interface prototyping and comparative scenario work. It is not a digital twin, a reconstruction of a real place, a forecast, or evidence for a planning decision.

The model’s goal is conditional plausibility rather than photorealistic imitation. Geology affects relief, permeability, soils, land use and industrial legacy; terrain and water constrain settlement sites; settlement history influences roads, railways, urban form and facilities; population and jobs drive strategic peak demand; those dependencies then inform small-area demographic and environmental estimates. Outputs that cannot be defended as measurements are labelled as estimates, indices or proxies.

Every generated place is fictional. A generated name can accidentally resemble a real place, but no real town boundary, household, person, census record or address is used.

## Reproducibility and units

- A resolved configuration and 32-bit integer seed determine the complete output.
- Equal configurations and seeds produce structurally equal JavaScript objects.
- Spatial coordinates are normalised to a square study area: `(0, 0)` is north-west and `(1, 1)` is south-east.
- Distances are reported in kilometres or metres, elevation in metres above modelled mean sea level, population and jobs as integer counts, and demographic compositions as shares summing to one.
- The default 48 × 48 grid is a strategic spatial discretisation. It does not imply 1-cell observational accuracy.

## Inputs and constraints

The public input is `TownGeneratorConfigInput`:

| Input | Allowed/default values | Interpretation |
|---|---|---|
| `seed` | unsigned 32-bit integer; default `20250717` | Reproducible scenario variation |
| `region` | nine broad modelling profiles | Environmental, built-form and demographic prior; `london-fringe` is not an official region |
| `populationBand` | `50k`, `100k`, `200k` | Approximate principal-settlement scale |
| `mainSettlementName` | text or `null` | Optional name; otherwise conditionally generated |
| `sizeKm` | 20–60 km | Width and height of square study area |
| `gridSize` | 32–72 | Cells on each side |
| four boundaries | sea, uplands, rolling, lowland | Structural edge conditions for relief and coast |
| `river` | source/outlet sides or `null` | Optional major river topology |

Validation rejects identical river source and outlet sides, implausible opposing sea edges for this mainland-oriented model, invalid ranges and malformed names. These are model-domain constraints, not claims that equivalent configurations cannot exist in reality.

## Dependency-ordered generation pipeline

1. Resolve and validate configuration.
2. Select a regional landscape archetype and regional geology mixture.
3. Generate structural relief, coherent coastline, lithology, superficial deposits, soils, runoff, habitats and flood-risk bands.
4. Route a constrained-profile major river and incise its valley; add schematic tributary connectors when requested.
5. Site the principal settlement and outlying settlements from water, slope, flood, route and resource suitability.
6. Generate region- and history-conditioned names and schematic etymologies.
7. Build historic radial roads, possible strategic routes, railways and branches.
8. Allocate urban eras, land uses, housing types, facilities, population and jobs.
9. Generate local street geometry conditioned on dominant development era.
10. Assign AM-peak commuting demand through a gravity model with mode and route choice.
11. Construct compact synthetic analytical wards and aggregate demographic, economic and environmental outputs.
12. Generate a historical sequence, diagnostics, assumptions and source registry.

Later stages do not retroactively redraw earlier physical geography. This makes causal dependencies inspectable and prevents demographic or traffic outputs from silently determining the terrain.

## Physical geography

### Regional profiles and geology

The nine regional profiles are broad priors rather than administrative averages. Each supplies plausible landscape archetypes, base elevation, relief, rainfall, woodland and moorland tendencies, industrial legacy, and a weighted set of rock units. Rock units carry lithological family, geological period, relative hardness, permeability, fertility and possible mineral resource.

Bedrock is allocated as a spatially coherent field, not independently cell by cell. Its hardness contributes to residual relief; permeability and separately generated superficial deposits influence runoff; fertility and drainage influence soil and agricultural grade; coal, clay, stone and aggregate resources condition selected historical settlement types. The geology lens is explicitly synthetic and must not be read as a British Geological Survey site map.

### Relief and coast

Terrain begins from structural contributions implied by the four boundaries. Upland edges raise and dissect adjacent land; lowland and rolling edges impose gentler gradients; sea edges create a coherent, irregular coastline and an elevation transition to sea level. Regional relief and lithological resistance modulate this field. Low-amplitude coherent residual noise is added last, so generic fractal noise is not the primary terrain mechanism.

The model does not solve crustal deformation, glacial chronology, coastal erosion or sediment budgets. It instead encodes auditable geomorphological relationships at the scale required by the town-region model.

### Hydrology, soils and habitats

When requested, a major river connects the selected sides through a stored, strictly non-rising channel-bed profile. That profile controls valley incision; schematic tributaries begin on higher surrounding cells and join the main channel. Channel distance informs superficial alluvium, terrace gravel, flood-risk bands, wetness and settlement suitability. Downstream utilities preferentially occupy low-lying non-residential land. The runtime downhill diagnostic checks every stored channel-bed step.

This is not a rainfall–runoff, groundwater, drainage-network, flood-frequency, hydraulic or sediment-transport simulation. Tributaries are schematic connectors, and flood labels are relative scenario bands rather than Environment Agency flood zones.

Soils and habitats depend on lithology, permeability, slope, wetness, altitude, coast and development. Agricultural grades are qualitative scenario classifications, not Agricultural Land Classification survey results. Biodiversity is a habitat-value index and not a statutory biodiversity-unit calculation or species survey.

## Settlement system, names and history

Candidate settlement sites are scored for moderate slope, access to water without high flood exposure, route convergence, coast/port opportunity and geological-resource legacy. The principal settlement is chosen first. Outlying market towns, industrial towns, port towns, villages, mining villages and suburbs are placed with minimum separation and population rules. Some become absorbed into the main urban area; independent settlements retain their own allocations.

Names draw from conditional linguistic strata—Old English, Old Norse, Brittonic, Latin/Old English, Middle English and modern formations—with regional weights. Name elements such as ford, bridge, borough, enclosure, farmstead, harbour or topographic terms are selected because of generated site context and regional history. Displayed etymologies are marked **schematic**: they are generated explanations, never attested derivations.

The historical sequence is a compact explanatory chronology. It may include early settlement, market or ecclesiastical institutions, turnpike improvement, canal/rail/industrial growth, inter-war expansion, post-war estates, strategic roads, retail decentralisation, university growth and recent development. Institutions remain contingent: for example, cathedral status is not inferred from city size.

## Transport and urban form

### Network chronology

Historic roads connect boundary approaches, settlement centres and market/industrial destinations. Their alignments tolerate more curvature and topographic constraint than later strategic routes. A motorway or later bypass is probabilistic and generally skirts the continuous centre. Railway lines connect boundary approaches through the historic city edge and may serve independent settlements; a branch can survive where the generated settlement pattern supports it.

### AM-peak strategic demand

Traffic is a static strategic assignment, not a microsimulation. Residential cells supply employed travellers; job cells attract them through a singly constrained gravity model with exponential distance decay. Explicit assumptions cover employment, home working and peak-hour concentration. Rail share responds to trip length, regional prior and access to generated station locations. Car share responds to regional prior and trip length. Car occupancy converts person trips to vehicles.

Road choice uses generalised corridor access, road class, trip length and incremental congestion feedback. Demand is split across up to four good alternatives with a logit rule rather than loaded all-or-nothing onto one link. Link delay uses a standard capacity-delay form. The results support comparative questions—where congestion is likely and how scenarios differ—but do not represent junction queues, signal timing, incidents, day-to-day equilibrium or calibrated observed counts.

Rail load factor is peak-direction passengers divided by scheduled seated capacity. Standing capacity and individual train variation are not modelled.

### Development eras, streets and uses

Urban extent follows settlement population, gross density, terrain, flood risk and proximity to routes. Dominant development eras run from pre-1800 cores through Victorian/Edwardian growth, inter-war suburbs, post-war estates, late-20th-century development and recent estates. Housing types are conditional on era and region, including northern red-brick or stone terraces, inter-war semis, post-war council/private estates, bungalows, flats and modern estates.

Local streets are schematic but historically conditioned: irregular historic lanes, terrace grids, inter-war avenues, post-war distributor/cul-de-sac forms and contemporary blocks. They are not routable individual street centre-lines. Major employment uses follow centre, rail, river and strategic-road accessibility; flood-prone land is more likely to remain park or wetland.

Facilities include central retail and bus functions, a railway station where service survives, a hospital, college or possible university, probabilistic cathedral/abbey history, edge-of-town retail, industrial estates, sewage works, grid infrastructure, cemetery and occasional energy recovery. Each facility records a siting rationale.

## Synthetic analytical wards and demographics

The map’s small-area units are **synthetic analytical wards**. They are compact aggregations of cells with a target population scale suitable for readable drill-down. They are not electoral wards and do not reproduce Output Areas, LSOAs or MSOAs. The label “ward” is used for recognisability and is qualified throughout the interface.

Ward populations and jobs are exact aggregations of cell allocations. Age, high-level ethnic group, qualification, occupation and tenure compositions begin with broad regional priors and are adjusted by development era, housing, density, deprivation context, university presence, industrial legacy and settlement scale. Every composition is normalised and tested to sum to one. The model generates aggregates only; it does not generate individuals or infer protected characteristics about real people.

The economic field is a low-certainty **GVA per resident estimate**, not ward GDP. Deprivation is a relative multidimensional scenario index, not an English Indices of Deprivation score or decile. Life expectancy is a contextual low-certainty estimate. Displayed ranges are hand-set sensitivity reminders, not confidence or prediction intervals.

## Map lenses

Sixteen selectable lenses expose town fabric, elevation, geology, land use, development era, population density, relative deprivation, GVA per resident, road traffic, rail loading, PM2.5, noise, life expectancy, biodiversity, age structure and ethnic-group diversity. Each lens carries an interpretation caveat. Selecting a synthetic ward shows exact model aggregates, generated prior compositions, hand-set sensitivity ranges, dominant form and local facilities.

Air pollution combines regional background with road and industrial proximity as a screening proxy. Noise combines indicative road, rail and industrial source levels energetically in decibels, but does not model day/evening/night exposure and is not Lden. Neither is a regulatory model. Ethnic-group diversity is a Simpson diversity measure over the displayed high-level categories; full composition remains available in the ward panel so a diversity scalar is never the only representation.

## Validation and diagnostics

Automated tests cover:

- exact determinism for a fixed seed and structural change across seeds;
- configuration and topology rejection;
- population and job conservation across cells, settlements and wards;
- complete non-sea ward assignment;
- composition normalisation and interval containment;
- coastal and river boundary behaviour;
- region-constrained geology;
- road and rail arithmetic;
- existence and geometry of local streets;
- scientific-status, provenance and fictional-place warnings;
- React rendering, lens switching, regeneration, ward drill-down and invalid-input handling.

Runtime diagnostics report population-balance error, maximum composition-sum error, unassigned land cells, river-profile behaviour and warnings. A passing diagnostic demonstrates internal consistency, not empirical accuracy.

## Evidence base

The implementation records source metadata in every generated output. Principal sources are Natural England National Character Areas; British Geological Survey regional summaries; Environment Agency catchment guidance; ONS Census 2021 built-up-area, geography and ethnicity publications; the English Indices of Deprivation technical report; Department for Transport National Travel Survey and TAG demand guidance; Defra air and noise products; Natural England’s statutory biodiversity metric guidance; the University of Nottingham Key to English Place-Names; and Historic England suburban research.

Sources constrain concepts, categories, reference envelopes and dependency structure. They do not turn synthetic cell values into observations, and the interface never claims otherwise.

### Parameter provenance classification

| Parameter family | External basis | Transformation in this implementation | Status |
|---|---|---|---|
| Regional lithology and landscape | BGS regional summaries; Natural England NCAs | Hand-authored mixtures and dimensionless hardness/permeability/fertility scores | Judgmental scenario parameters, not fitted BGS attributes |
| Relief, coast and river incision | NCA/BGS/EA process framing | Deterministic structural functions plus low-amplitude residual fields | Bespoke and uncalibrated |
| ALC, soils and habitat | Natural England ALC/biodiversity guidance | Rule-based classification from lithology, slope, wetness and land use | Qualitative scenario classification |
| Age, ethnicity, qualifications, occupation and tenure | ONS Census 2021 categories and regional reference distributions | Broad priors with explicit housing, centrality, scale and legacy adjustments | Partly source-anchored; local coefficients judgmental |
| Employment, home working, trip concentration, occupancy and mode priors | ONS economic activity; DfT NTS/TAG | Gravity deterrence, station access, regional priors and logit corridor split | Strategic scenario assumptions, not locally calibrated |
| Road capacities and delay | DfT TAG assignment concepts | Road-class capacities and capacity-delay function | Illustrative; oversaturated links are labelled unstable |
| GVA and life expectancy | ONS subregional productivity; OHID mortality profiles | Reference baselines plus imposed ecological scenario relationships | Low-certainty screening estimates |
| PM2.5 and noise | Defra background/noise products | Background plus proximity terms; acoustic source levels combined energetically | Screening proxies, not dispersion/statutory mapping |
| Sensitivity ranges | No sampling distribution | Fixed, hand-set spreads by outcome family | Not statistical uncertainty intervals |

Numerical constants are kept in readable source modules so their judgmental status is inspectable. No coefficient should be described as estimated or calibrated unless a future calibration dataset and procedure are added.

## Known limitations

1. Regional profiles are deliberately broad; sub-regional character can vary more than the profile captures.
2. Terrain is process-informed but not a calibrated landscape-evolution model.
3. Rivers do not solve discharge, flood frequency or channel hydraulics.
4. Strategic roads and railways are polylines, not surveyed alignments or full graphs.
5. Local streets are visual fabric rather than routable links.
6. Traffic has no junction model, public-bus network, time-of-day dynamics or observed calibration.
7. Urban planning, land ownership, conservation designations and political decisions are simplified.
8. Demographic relationships are ecological scenario priors and must not be interpreted causally or individually.
9. Environmental and health layers are screening estimates.
10. A single seed is one scenario, not a statistical confidence sample.

## Public API

```ts
import {
  EnglishTownGeneratorApp,
  generateEnglishTownRegion,
} from '@viz/signaling';

const region = generateEnglishTownRegion({
  seed: 42,
  region: 'yorkshire-humber',
  populationBand: '100k',
  sizeKm: 40,
  boundaries: {
    north: 'uplands',
    east: 'sea',
    south: 'lowland',
    west: 'rolling',
  },
  river: { sourceSide: 'north', outletSide: 'east' },
});
```

The showcase route is `/#english-town-generator`.
