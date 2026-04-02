// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlayback } from './usePlayback';

function Harness({
  blocked = false,
  intervalMs = 100,
  onTick,
}: {
  blocked?: boolean;
  intervalMs?: number;
  onTick: () => void;
}): React.ReactElement {
  const playback = usePlayback({
    intervalMs,
    isBlocked: blocked,
    onTick,
  });

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'button',
      { type: 'button', onClick: playback.play },
      'play'
    ),
    React.createElement(
      'button',
      { type: 'button', onClick: playback.pause },
      'pause'
    ),
    React.createElement('span', { 'data-testid': 'playing' }, String(playback.isPlaying))
  );
}

describe('usePlayback', () => {
  it('repeats ticks while playing and does not leak timers after pause', () => {
    vi.useFakeTimers();
    const onTick = vi.fn();

    const view = render(React.createElement(Harness, { onTick }));

    fireEvent.click(screen.getByText('play'));
    expect(screen.getByTestId('playing').textContent).toBe('true');
    expect(vi.getTimerCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onTick).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(1);

    fireEvent.click(screen.getByText('pause'));
    expect(vi.getTimerCount()).toBe(0);

    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});
