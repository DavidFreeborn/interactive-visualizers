/**
 * Hook for managing playback state.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { PlaybackState } from '../types';

export interface UsePlaybackOptions {
  onStep: () => void;
  initialSpeed?: number;
  initialStepsPerFrame?: number;
}

export interface UsePlaybackReturn extends PlaybackState {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setSpeed: (speed: number) => void;
  setStepsPerFrame: (steps: number) => void;
}

/**
 * Manages play/pause state and animation loop for simulations.
 */
export function usePlayback({
  onStep,
  initialSpeed = 1,
  initialStepsPerFrame = 10,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [stepsPerFrame, setStepsPerFrame] = useState(initialStepsPerFrame);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const onStepRef = useRef(onStep);

  // Keep callback ref updated
  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const interval = 1000 / (speed * 60); // Target interval in ms

    const animate = (time: number) => {
      if (time - lastTimeRef.current >= interval) {
        onStepRef.current();
        lastTimeRef.current = time;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, speed]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);

  return {
    isPlaying,
    speed,
    stepsPerFrame,
    play,
    pause,
    toggle,
    setSpeed,
    setStepsPerFrame,
  };
}
