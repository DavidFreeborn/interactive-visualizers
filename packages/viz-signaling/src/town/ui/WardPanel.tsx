import React from 'react';
import type { Composition, EstimateInterval, Facility, GeneratedTownRegion, Ward } from '../types';

interface WardPanelProps {
  ward: Ward;
  region: GeneratedTownRegion;
  onSelectWard: (wardId: string) => void;
}

function CompositionRows({ composition }: { composition: Composition }): React.ReactElement {
  const entries = Object.entries(composition).sort((left, right) => right[1] - left[1]);
  return (
    <div className="town-composition">
      {entries.map(([label, share]) => (
        <div className="town-composition-row" key={label}>
          <span>{label}</span>
          <div><i style={{ width: `${Math.max(1, share * 100)}%` }} /></div>
          <strong>{Math.round(share * 100)}%</strong>
        </div>
      ))}
    </div>
  );
}

function Estimate({ label, value, unit, currency = false }: { label: string; value: EstimateInterval; unit: string; currency?: boolean }): React.ReactElement {
  const format = (number: number) => currency ? `£${(Math.round(number / 500) * 500).toLocaleString()}` : `${number.toLocaleString()}${unit}`;
  return (
    <div className="town-estimate">
      <span>{label}</span>
      <strong>{format(value.estimate)}</strong>
      <small>{format(value.lower)}–{format(value.upper)} · hand-set sensitivity range, not a confidence interval</small>
    </div>
  );
}

function wardForFacility(facility: Facility, region: GeneratedTownRegion): string | null {
  const column = Math.max(0, Math.min(region.config.gridSize - 1, Math.floor(facility.location.x * region.config.gridSize)));
  const row = Math.max(0, Math.min(region.config.gridSize - 1, Math.floor(facility.location.y * region.config.gridSize)));
  return region.cells[row * region.config.gridSize + column]?.wardId ?? null;
}

export function WardPanel({ ward, region, onSelectWard }: WardPanelProps): React.ReactElement {
  const localFacilities = region.facilities.filter((facility) => wardForFacility(facility, region) === ward.id);
  return (
    <aside className="town-ward-panel" aria-label="Selected synthetic ward details">
      <label className="town-field">
        <span>Selected synthetic ward</span>
        <select value={ward.id} onChange={(event) => onSelectWard(event.target.value)}>
          {region.wards.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
        </select>
      </label>
      <div className="town-ward-title">
        <h2>{ward.name}</h2>
        <p>{ward.dominantHousingType} · {ward.dominantLandUse.replace(/-/g, ' ')}</p>
      </div>
      <div className="town-stat-grid">
        <div><span>Population</span><strong>{ward.population.toLocaleString()}</strong></div>
        <div><span>Households</span><strong>{ward.households.toLocaleString()}</strong></div>
        <div><span>Area</span><strong>{ward.areaKm2.toFixed(1)} km²</strong></div>
        <div><span>Residents/km²</span><strong>{ward.populationDensityPerKm2.toLocaleString()}</strong></div>
        <div><span>Jobs</span><strong>{ward.jobs.toLocaleString()}</strong></div>
        <div><span>Deprivation</span><strong>{ward.metrics.relativeDeprivationIndex}/100</strong></div>
      </div>
      <section className="town-estimate-grid" aria-label="Modelled ward outcomes">
        <Estimate label="GVA per resident" value={ward.metrics.gvaPerResidentGbp} unit="" currency />
        <Estimate label="Life expectancy" value={ward.metrics.lifeExpectancyYears} unit=" years" />
        <Estimate label="PM₂.₅ annual mean" value={ward.metrics.pm25AnnualMeanUgM3} unit=" µg/m³" />
        <Estimate label="Noise screening level" value={ward.metrics.noiseScreeningDb} unit=" dB" />
        <div className="town-estimate"><span>Habitat-value index</span><strong>{ward.metrics.biodiversityIndex}/100</strong><small>Scenario proxy; not biodiversity units</small></div>
        <div className="town-estimate"><span>Traffic exposure</span><strong>{ward.metrics.trafficExposureIndex}/100</strong><small>AM peak screening index</small></div>
      </section>
      {localFacilities.length > 0 && (
        <section className="town-local-facilities">
          <h3>Facilities in this zone</h3>
          <ul>{localFacilities.map((facility) => <li key={facility.id}><strong>{facility.name}</strong><span>{facility.establishedEra}</span></li>)}</ul>
        </section>
      )}
      <div className="town-demography-warning">
        <strong>Generated prior compositions</strong>
        <p>{ward.interpretationNotes[1]} {ward.interpretationNotes[3]}</p>
      </div>
      <details open><summary>Age</summary><CompositionRows composition={ward.age} /></details>
      <details><summary>Ethnic group (self-identified)</summary><CompositionRows composition={ward.ethnicity} /></details>
      <details><summary>Highest qualification</summary><CompositionRows composition={ward.qualifications} /></details>
      <details><summary>Occupation mix</summary><CompositionRows composition={ward.occupations} /></details>
      <details><summary>Housing tenure</summary><CompositionRows composition={ward.tenure} /></details>
      <div className="town-ward-warning">
        <strong>Synthetic aggregate</strong>
        <p>{ward.interpretationNotes[0]} Values are internally coupled but are not observations or forecasts.</p>
      </div>
    </aside>
  );
}
