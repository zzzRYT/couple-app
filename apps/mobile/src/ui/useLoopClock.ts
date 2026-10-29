import { useEffect } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
/** UI-thread clock that counts 0..period in ms. Pausing keeps the phase, so a paused loop resumes where it stopped. */
export function useLoopClock(period: number, running: boolean): SharedValue<number> {
  const clock = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    clock.value = (clock.value + (info.timeSincePreviousFrame ?? 0)) % period;
  }, false);
  useEffect(() => { frame.setActive(running); }, [frame, running]);
  return clock;
}
