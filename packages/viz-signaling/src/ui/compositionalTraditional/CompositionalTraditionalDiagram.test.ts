// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  createInitialCompositionalTraditionalState,
  deriveCompositionalTraditionalPolicies,
  resolveCompositionalTraditionalConfig,
} from '../../model/compositionalTraditional';
import { CompositionalTraditionalDiagram } from './CompositionalTraditionalDiagram';

describe('CompositionalTraditionalDiagram', () => {
  it('renders the revised conceptual headings', () => {
    const config = resolveCompositionalTraditionalConfig();
    const policies = deriveCompositionalTraditionalPolicies(
      createInitialCompositionalTraditionalState(config)
    );

    render(
      React.createElement(CompositionalTraditionalDiagram, {
        config,
        policies,
        animation: { phase: 'idle', progress: 0, event: null },
        showProbabilityLabels: false,
      })
    );

    expect(screen.getByText('Nature')).toBeTruthy();
    expect(screen.getByText('Senders')).toBeTruthy();
    expect(screen.getByText('Receiver')).toBeTruthy();
    expect(screen.queryByText('States')).toBeNull();
    expect(screen.queryByText('Pair cells')).toBeNull();
    expect(screen.queryByText(/\(A[01], B[01]\)/)).toBeNull();
    expect(screen.getAllByText('red dress').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('choose red dress')).toBeNull();
    expect(screen.queryByTestId('receiver-hub')).toBeNull();
    expect(screen.getByTestId('edge-sender-a-0-to-action-0')).toBeTruthy();
    expect(screen.getByTestId('edge-sender-a-1-to-action-0')).toBeTruthy();
    expect(screen.getByTestId('edge-sender-b-0-to-action-0')).toBeTruthy();
    expect(screen.getByTestId('edge-sender-b-1-to-action-0')).toBeTruthy();
  });

  it('shows exact probabilities for sender and pair-action edges in the hover tooltip', () => {
    const config = resolveCompositionalTraditionalConfig();
    const policies = deriveCompositionalTraditionalPolicies(
      createInitialCompositionalTraditionalState(config)
    );

    render(
      React.createElement(CompositionalTraditionalDiagram, {
        config,
        policies,
        animation: { phase: 'idle', progress: 0, event: null },
        showProbabilityLabels: false,
      })
    );

    fireEvent.mouseEnter(screen.getByTestId('edge-state-0-a-0'));
    expect(screen.getByTestId('compositional-edge-tooltip').textContent).toContain(
      'P_A(A0 | S0) = 0.500'
    );

    fireEvent.mouseEnter(screen.getByTestId('edge-pair-a-0-b-0-to-action-0'));
    expect(screen.getByTestId('compositional-edge-tooltip').textContent).toContain(
      'P_R(a0 | A0, B0) = 0.250'
    );

    fireEvent.mouseEnter(screen.getByTestId('edge-pair-b-0-a-0-to-action-0'));
    expect(screen.getByTestId('compositional-edge-tooltip').textContent).toContain(
      'P_R(a0 | A0, B0) = 0.250'
    );
  });
});
