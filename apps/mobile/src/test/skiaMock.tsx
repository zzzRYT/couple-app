import type { ReactNode } from 'react';
import { View } from 'react-native';
/** Minimal stand-in for Skia in Jest: draws nothing, but keeps the element tree so tests can inspect what the scene would draw. */
export const Canvas = ({ children, ...props }: { children?: ReactNode }) => <View testID="skia-canvas" {...props}>{children}</View>;
export const Group = ({ children, ...props }: { children?: ReactNode }) => <View testID="skia-group" {...props}>{children}</View>;
export const Image = (props: Record<string, unknown>) => <View testID="skia-image" {...props} />;
export const Rect = (props: Record<string, unknown>) => <View testID="skia-rect" {...props} />;
export const useImage = (source: unknown) => source ?? null;
