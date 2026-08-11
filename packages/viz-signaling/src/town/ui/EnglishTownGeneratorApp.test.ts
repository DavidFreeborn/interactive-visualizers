// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnglishTownGeneratorApp } from './EnglishTownGeneratorApp';
import { LENS_DEFINITIONS } from './TownMap';

const TEST_CONFIG = { gridSize: 32, sizeKm: 36, seed: 7001 } as const;

describe('EnglishTownGeneratorApp', () => {
  it('renders the generator, scientific status, dominant map and evidence controls', () => {
    render(React.createElement(EnglishTownGeneratorApp, { initialConfig: TEST_CONFIG }));
    expect(screen.getByText('Standard toy model')).toBeTruthy();
    expect(screen.getByRole('img', { name: /Synthetic map of/i })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Map lenses' })).toBeTruthy();
    expect(screen.getByText('Study-area population')).toBeTruthy();
    expect(screen.getByText('What this does not show')).toBeTruthy();
    expect(screen.getByText('Evidence base and provenance')).toBeTruthy();
  });

  it('switches every map lens, exposes its caveat and uses the correct legend form', () => {
    const view = render(React.createElement(EnglishTownGeneratorApp, { initialConfig: TEST_CONFIG }));
    for (const definition of Object.values(LENS_DEFINITIONS)) {
      const button = screen.getByRole('button', { name: definition.label });
      fireEvent.click(button);
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByText(definition.caveat)).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Bedrock geology' }));
    expect(view.container.querySelectorAll('.town-gradient-legend i.is-discrete b').length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole('button', { name: 'Elevation' }));
    const continuousLegend = view.container.querySelector('.town-gradient-legend i:not(.is-discrete)') as HTMLElement;
    expect(continuousLegend.style.background).toMatch(/linear-gradient/);
  });

  it('regenerates reproducibly with a supplied name and supports ward drill-down', () => {
    render(React.createElement(EnglishTownGeneratorApp, { initialConfig: TEST_CONFIG }));
    fireEvent.change(screen.getByLabelText('Name (optional)'), { target: { value: 'Testford' } });
    expect(screen.getByRole('status').textContent).toMatch(/generate to apply/i);
    fireEvent.click(screen.getByRole('button', { name: 'Generate town-region' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Testford' })).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();

    const wardSelect = screen.getByLabelText('Selected synthetic ward') as HTMLSelectElement;
    const options = within(wardSelect).getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    const secondWard = (options[1] as HTMLOptionElement).value;
    const secondWardName = options[1].textContent ?? '';
    fireEvent.change(wardSelect, { target: { value: secondWard } });
    expect(screen.getByRole('heading', { level: 2, name: secondWardName })).toBeTruthy();
  });

  it('reports invalid river topology without replacing the current scenario', () => {
    render(React.createElement(EnglishTownGeneratorApp, { initialConfig: TEST_CONFIG }));
    const originalName = screen.getByRole('heading', { level: 1 }).textContent;
    fireEvent.change(screen.getByLabelText('Enters'), { target: { value: 'east' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate town-region' }));
    expect(screen.getByRole('alert').textContent).toMatch(/sides must be different/i);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(originalName);
    fireEvent.change(screen.getByLabelText('Enters'), { target: { value: 'west' } });
    fireEvent.change(screen.getByLabelText('Leaves'), { target: { value: 'south' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate town-region' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('disables river-side controls when the major river is absent', () => {
    render(React.createElement(EnglishTownGeneratorApp, { initialConfig: TEST_CONFIG }));
    fireEvent.click(screen.getByLabelText('Present'));
    expect((screen.getByLabelText('Enters') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText('Leaves') as HTMLSelectElement).disabled).toBe(true);
  });

  it('starts with generator settings collapsed at narrow viewport widths', () => {
    const previousWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    const view = render(React.createElement(EnglishTownGeneratorApp, { initialConfig: TEST_CONFIG }));
    const controls = view.container.querySelector('details.town-controls') as HTMLDetailsElement;
    expect(controls.open).toBe(false);
    fireEvent.click(view.container.querySelector('.town-controls-summary') as HTMLElement);
    expect(controls.open).toBe(true);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
  });
});
