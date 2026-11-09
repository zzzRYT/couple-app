import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * V0-12 warm start: coming back after this long in the background shows the splash again. Shorter trips (copying an
 * invite code, answering a message) are left alone, and an inactive app (Control Center, a system sheet) never counts.
 */
export const RESUME_SPLASH_AFTER_MS = 30_000;
export function resumeShowsSplash(backgroundedAt: number | null, now: number, after = RESUME_SPLASH_AFTER_MS): boolean {
  return backgroundedAt !== null && now - backgroundedAt >= after;
}
/** Counts the returns that show the splash; each new count asks the splash to show once more. */
export function useResumeSplash(after = RESUME_SPLASH_AFTER_MS, clock: () => number = Date.now): number {
  const [returns, setReturns] = useState(0);
  const backgroundedAt = useRef<number | null>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background') backgroundedAt.current = clock();
      else if (next === 'active') {
        if (resumeShowsSplash(backgroundedAt.current, clock(), after)) setReturns((count) => count + 1);
        backgroundedAt.current = null;
      }
    });
    return () => subscription.remove();
  }, [after, clock]);
  return returns;
}
