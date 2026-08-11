import React, { useMemo, useState } from 'react';
import { resolveTownGeneratorConfig } from '../config';
import { generateEnglishTownRegion } from '../generateTown';
import { distance } from '../math';
import { ENGLISH_REGION_OPTIONS } from '../regionalProfiles';
import type { EdgeCharacter, GeneratedTownRegion, MapLens, MapSide, TownGeneratorConfig, TownGeneratorConfigInput } from '../types';
import { LENS_DEFINITIONS, TownMap } from './TownMap';
import { WardPanel } from './WardPanel';
import './town.css';

export interface EnglishTownGeneratorAppProps { initialConfig?: TownGeneratorConfigInput; }

const LENS_GROUPS: { label: string; lenses: MapLens[] }[] = [
  { label: 'Place', lenses: ['overview', 'elevation', 'geology', 'land-use', 'development-era'] },
  { label: 'People & economy', lenses: ['population-density', 'deprivation', 'gva', 'age', 'ethnicity', 'life-expectancy'] },
  { label: 'Movement & environment', lenses: ['road-traffic', 'rail-loading', 'air-pollution', 'noise', 'biodiversity'] },
];

const SIDES: MapSide[] = ['north', 'east', 'south', 'west'];
const EDGE_OPTIONS: { value: EdgeCharacter; label: string }[] = [
  { value: 'sea', label: 'Sea' }, { value: 'uplands', label: 'Uplands' },
  { value: 'rolling', label: 'Rolling land' }, { value: 'lowland', label: 'Lowland' },
];

function nearestWardToMain(region: GeneratedTownRegion): string {
  const main = region.settlements[0];
  return region.wards.reduce((nearest, ward) => distance(ward.centroid, main.centre) < distance(nearest.centroid, main.centre) ? ward : nearest, region.wards[0]).id;
}

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

export function EnglishTownGeneratorApp({ initialConfig = {} }: EnglishTownGeneratorAppProps): React.ReactElement {
  const initialResolved = useMemo(() => resolveTownGeneratorConfig(initialConfig), []);
  const [draft, setDraft] = useState<TownGeneratorConfig>(initialResolved);
  const [region, setRegion] = useState(() => generateEnglishTownRegion(initialResolved));
  const [lens, setLens] = useState<MapLens>('overview');
  const [selectedWardId, setSelectedWardId] = useState(() => nearestWardToMain(region));
  const [error, setError] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 820);
  const selectedWard = region.wards.find((ward) => ward.id === selectedWardId) ?? region.wards[0];
  const hasUnappliedChanges = JSON.stringify(draft) !== JSON.stringify(region.config);

  function updateBoundary(side: MapSide, value: EdgeCharacter): void {
    setDraft((current) => ({ ...current, boundaries: { ...current.boundaries, [side]: value } }));
  }

  function generate(): void {
    try {
      const next = generateEnglishTownRegion(draft);
      setRegion(next);
      setDraft(next.config);
      setSelectedWardId(nearestWardToMain(next));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to generate this scenario.');
    }
  }

  function randomiseSeed(): void {
    setDraft((current) => ({ ...current, seed: Math.floor(Math.random() * 0x100000000) }));
  }

  return (
    <main className="town-generator">
      <header className="town-header">
        <div>
          <span className="town-kicker">Procedural English town-region model</span>
          <h1>{region.settlements[0].name}</h1>
          <p>{region.landscapeArchetype} · {region.config.sizeKm} × {region.config.sizeKm} km · seed {region.config.seed}</p>
        </div>
        <div className="town-status"><strong>Standard toy model</strong><span>Bespoke, uncalibrated synthetic scenario · not a digital twin</span></div>
      </header>

      <details className="town-controls" aria-label="Generator inputs" open={controlsOpen} onToggle={(event) => setControlsOpen(event.currentTarget.open)}>
        <summary className="town-controls-summary">Generator inputs <span>{hasUnappliedChanges ? 'Changes waiting' : 'Current scenario'}</span></summary>
        <div className="town-controls-primary">
          <label className="town-field"><span>Broad modelling profile</span><select value={draft.region} onChange={(event) => setDraft((current) => ({ ...current, region: event.target.value as TownGeneratorConfig['region'] }))}>{ENGLISH_REGION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="town-field"><span>Main settlement</span><select value={draft.populationBand} onChange={(event) => setDraft((current) => ({ ...current, populationBand: event.target.value as TownGeneratorConfig['populationBand'] }))}><option value="50k">Town · about 50,000</option><option value="100k">Large town · about 100,000</option><option value="200k">Small city · about 200,000</option></select></label>
          <label className="town-field"><span>Name (optional)</span><input value={draft.mainSettlementName ?? ''} placeholder="Autogenerate" onChange={(event) => setDraft((current) => ({ ...current, mainSettlementName: event.target.value || null }))} /></label>
          <label className="town-field"><span>Study area</span><select value={draft.sizeKm} onChange={(event) => setDraft((current) => ({ ...current, sizeKm: Number(event.target.value) }))}><option value={28}>28 × 28 km</option><option value={36}>36 × 36 km</option><option value={40}>40 × 40 km</option><option value={48}>48 × 48 km</option><option value={56}>56 × 56 km</option></select></label>
          <label className="town-field"><span>Seed</span><input type="number" min="0" max="4294967295" value={draft.seed} onChange={(event) => setDraft((current) => ({ ...current, seed: Number(event.target.value) }))} /></label>
          <button type="button" className="town-button secondary" onClick={randomiseSeed}>Randomise seed</button>
        </div>
        <div className="town-controls-secondary">
          <fieldset><legend>Boundary character</legend><div className="town-edge-grid">
            {SIDES.map((side) => <label className="town-field compact" key={side}><span>{side}</span><select value={draft.boundaries[side]} onChange={(event) => updateBoundary(side, event.target.value as EdgeCharacter)}>{EDGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
          </div></fieldset>
          <fieldset><legend>Major river</legend><div className="town-river-controls">
            <label className="town-check"><input type="checkbox" checked={draft.river !== null} onChange={(event) => setDraft((current) => ({ ...current, river: event.target.checked ? { sourceSide: 'west', outletSide: 'east' } : null }))} /><span>Present</span></label>
            <label className="town-field compact"><span>Enters</span><select disabled={draft.river === null} value={draft.river?.sourceSide ?? 'west'} onChange={(event) => setDraft((current) => ({ ...current, river: current.river ? { ...current.river, sourceSide: event.target.value as MapSide } : null }))}>{SIDES.map((side) => <option key={side} value={side}>{side}</option>)}</select></label>
            <label className="town-field compact"><span>Leaves</span><select disabled={draft.river === null} value={draft.river?.outletSide ?? 'east'} onChange={(event) => setDraft((current) => ({ ...current, river: current.river ? { ...current.river, outletSide: event.target.value as MapSide } : null }))}>{SIDES.map((side) => <option key={side} value={side}>{side}</option>)}</select></label>
          </div></fieldset>
          <button type="button" className="town-button primary" onClick={generate}>Generate town-region</button>
        </div>
        {error && <p className="town-error" role="alert">{error}</p>}
        {hasUnappliedChanges && <p className="town-draft-note" role="status">Inputs changed — generate to apply them to the visible scenario.</p>}
      </details>

      <nav className="town-lenses" aria-label="Map lenses">
        {LENS_GROUPS.map((group) => <div key={group.label}><span>{group.label}</span><div>{group.lenses.map((candidate) => <button key={candidate} type="button" aria-pressed={lens === candidate} onClick={() => setLens(candidate)}>{LENS_DEFINITIONS[candidate].label}</button>)}</div></div>)}
      </nav>

      <section className="town-main-grid">
        <div className="town-map-column">
          <TownMap region={region} lens={lens} selectedWardId={selectedWard.id} onSelectWard={setSelectedWardId} />
          <div className="town-summary-strip">
            <div><span>Study-area population</span><strong>{region.summary.totalPopulation.toLocaleString()}</strong></div>
            <div><span>Principal settlement</span><strong>{region.summary.principalSettlementPopulation.toLocaleString()}</strong></div>
            <div><span>Jobs</span><strong>{region.summary.totalJobs.toLocaleString()}</strong></div>
            <div><span>Urbanised land</span><strong>{percent(region.summary.urbanisedShare)}</strong></div>
            <div><span>Rail mode share</span><strong>{percent(region.summary.railModeShare)}</strong></div>
            <div><span>Mean road V/C</span><strong>{region.summary.meanAmPeakRoadVcr.toFixed(1)}</strong></div>
          </div>
        </div>
        <WardPanel ward={selectedWard} region={region} onSelectWard={setSelectedWardId} />
      </section>

      <section className="town-evidence-grid">
        <details open><summary>What this shows</summary><p>A reproducible fictional English town-region whose physical geography, settlement history, infrastructure, urban form and ward aggregates are generated in dependency order. Change inputs or seed to explore plausible scenario variation while holding the modelling rules fixed.</p></details>
        <details open><summary>What this does not show</summary><p>It is not a reconstruction, forecast, planning appraisal, hydrological model, transport microsimulation, pollution dispersion model, health model or demographic prediction. Displayed ranges are hand-set reminders of structural sensitivity, not statistical bounds.</p></details>
        <details><summary>Historical development sequence</summary><ol className="town-history">{region.history.map((event) => <li key={`${event.year}-${event.label}`}><time>{event.year}</time><div><strong>{event.label}</strong><p>{event.consequence}</p></div></li>)}</ol></details>
        <details><summary>Generated settlements and etymology</summary><div className="town-settlement-table">{region.settlements.map((settlement) => <div key={settlement.id}><strong>{settlement.name}</strong><span>{settlement.kind.replace(/-/g, ' ')} · {settlement.population.toLocaleString()}</span><p>{settlement.etymology ? `${settlement.etymology.language}: ${settlement.etymology.gloss} (schematic, not an attested derivation).` : 'User-supplied name; no derivation inferred.'}</p></div>)}</div></details>
        <details><summary>Assumptions, warnings and diagnostics</summary><ul>{region.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul><h3>Generation warnings</h3><ul>{region.diagnostics.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul><div className="town-diagnostics"><span>Population balance error: {region.diagnostics.populationBalanceError}</span><span>Composition sum error: {region.diagnostics.demographicMaximumSumError.toExponential(1)}</span><span>Unassigned land cells: {region.diagnostics.cellsWithoutWard}</span><span>Sampled downhill river steps: {region.diagnostics.riverDownhillShare === null ? 'not applicable' : percent(region.diagnostics.riverDownhillShare)}</span></div></details>
        <details><summary>Evidence base and provenance</summary><ul className="town-sources">{region.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.organisation}: {source.title}</a><span>{source.usedFor}</span></li>)}</ul></details>
      </section>
    </main>
  );
}
