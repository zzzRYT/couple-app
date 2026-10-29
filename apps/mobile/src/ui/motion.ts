import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useIsFocused } from 'expo-router';
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => subscription.remove();
  }, []);
  return reduced;
}
export function useAppForeground(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => setActive(next === 'active'));
    return () => subscription.remove();
  }, []);
  return active;
}
/** Outside a route tree (tests, the root loader before navigation mounts) there is no focus context, so the view counts as focused. */
export function useScreenFocused(): boolean {
  try { return useIsFocused(); } catch { return true; }
}
/** Looping decoration runs only while its screen is focused and the app is in the foreground. */
export function useLoopActive(): boolean {
  const focused = useScreenFocused();
  const foreground = useAppForeground();
  return focused && foreground;
}
