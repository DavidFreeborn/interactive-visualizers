import { useEffect, useRef, useState } from 'react';

/**
 * Options for the deterministic playback controller.
 */
export interface UsePlaybackOptions {
  intervalMs: number;
  isBlocked: boolean;
  onTick: () => void;
}

/**
 * Return value for the deterministic playback controller.
 */
export interface UsePlaybackReturn {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

/**
 * Manages a single repeating playback timer with pause/block semantics.
 */
export function usePlayback({
  intervalMs,
  isBlocked,
  onTick,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!isPlaying || isBlocked) {
      return undefined;
    }

    let timerId = 0;
    let cancelled = false;

    const scheduleTick = () => {
      timerId = window.setTimeout(() => {
        onTickRef.current();
        if (!cancelled) {
          scheduleTick();
        }
      }, intervalMs);
    };

    scheduleTick();

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [intervalMs, isBlocked, isPlaying]);

  return {
    isPlaying,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    toggle: () => setIsPlaying((currentValue) => !currentValue),
  };
}
