// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SignalingGameView } from './SignalingGameView';

function getRoundValue(): number {
  const text = screen.getByTestId('round-value').textContent ?? '0';
  return Number.parseInt(text.replace(/,/g, ''), 10);
}

describe('SignalingGameView', () => {
  it('renders the main view', () => {
    render(React.createElement(SignalingGameView));
    expect(screen.getByText('Classic signaling games')).toBeTruthy();
    expect(screen.getByText('Based on the models in')).toBeTruthy();
    const skyrmsLink = screen.getByRole('link', {
      name: /Brian Skyrms, Signals: Evolution, Learning, and Information \(2010\)\./,
    }) as HTMLAnchorElement;
    expect(skyrmsLink.href).toBe(
      'https://sites.socsci.uci.edu/~bskyrms/bio/books/signals.pdf',
    );
    expect(screen.queryByTestId('seed-input')).toBeNull();
  });

  it('steps, updates charts, and resets the display', async () => {
    render(React.createElement(SignalingGameView));

    fireEvent.click(screen.getByText('Fast'));
    fireEvent.click(screen.getByText('Step'));

    await waitFor(() => {
      expect(getRoundValue()).toBe(1);
    });

    expect(screen.getByTestId('success-chart').getAttribute('data-point-count')).toBe('2');

    fireEvent.click(screen.getByText('Reset'));

    await waitFor(() => {
      expect(getRoundValue()).toBe(0);
    });
  });

  it('keeps seed choice in debug only and draws a fresh random seed on reset', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    render(React.createElement(SignalingGameView));

    fireEvent.click(screen.getByText('Show'));
    const seedInput = screen.getByTestId('seed-input') as HTMLInputElement;
    expect(seedInput.value).toBe('42');

    fireEvent.click(screen.getByText('Reset'));

    await waitFor(() => {
      expect((screen.getByTestId('seed-input') as HTMLInputElement).value).toBe('2147483648');
    });

    randomSpy.mockRestore();
  });

  it('plays and pauses without continuing to step while paused', () => {
    vi.useFakeTimers();
    render(React.createElement(SignalingGameView));

    fireEvent.click(screen.getByText('Fast'));
    fireEvent.click(screen.getByTestId('play-pause-button'));
    expect(screen.getByTestId('play-pause-button').textContent).toBe('Pause');

    act(() => {
      vi.advanceTimersByTime(220);
    });

    const playingRound = getRoundValue();
    expect(playingRound).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId('play-pause-button'));
    expect(screen.getByTestId('play-pause-button').textContent).toBe('Play');

    act(() => {
      vi.advanceTimersByTime(220);
    });

    expect(getRoundValue()).toBe(playingRound);
    vi.useRealTimers();
  });

  it('does not leave a stale animation running after reset', () => {
    vi.useFakeTimers();
    render(React.createElement(SignalingGameView));

    fireEvent.click(screen.getByText('Step'));
    fireEvent.click(screen.getByText('Reset'));

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(getRoundValue()).toBe(0);
    expect(screen.queryByText(/Success:|Failure:/)).toBeNull();
    vi.useRealTimers();
  });
});
