// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createInitialSignalingGameState, derivePolicies } from '../../index';
import { resolveSignalingGameConfig } from '../../model/validation';
import { SignalDiagram } from './SignalDiagram';

describe('SignalDiagram', () => {
  it('shows the exact edge probability in the hover tooltip', () => {
    const config = resolveSignalingGameConfig();
    const policies = derivePolicies(createInitialSignalingGameState(config));

    render(
      React.createElement(SignalDiagram, {
        config,
        policies,
        animation: { phase: 'idle', progress: 0, event: null },
        showProbabilityLabels: false,
      })
    );

    expect(screen.queryByTestId('edge-tooltip')).toBeNull();

    fireEvent.mouseEnter(screen.getByTestId('edge-state-0-message-0'));

    expect(screen.getByTestId('edge-tooltip').textContent).toContain('P(M0 | S0) = 0.500');
  });
});
