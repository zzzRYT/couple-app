import { Image, View } from 'react-native';
/** Minimal stand-in for Reanimated in Jest: animated styles are evaluated once from the current shared values, and the UI-thread clock never ticks. */
const Animated = { View, Image };
export default Animated;
export const useSharedValue = <T,>(value: T) => ({ value });
export const useAnimatedStyle = (worklet: () => object) => worklet();
export const useFrameCallback = () => ({ setActive: () => {}, isActive: false, callbackId: -1 });
export const cancelAnimation = () => {};
export const withTiming = <T,>(value: T) => value;
export const withRepeat = <T,>(value: T) => value;
export const Easing = { ease: (t: number) => t, inOut: (easing: (t: number) => number) => easing };
export type SharedValue<T> = { value: T };
