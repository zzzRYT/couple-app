import { useEffect } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { catalogArt } from '../scene/catalog';
import { useLoopActive, useReducedMotion } from './motion';

type Piece = { source: ImageSourcePropType; x: number; y: number; size: number; float?: boolean };
/** Small spot illustrations built from catalog object sketches (components.md §9), 150 × 120pt, hidden from screen readers. */
const spots = {
  waiting: [{ source: catalogArt('obj_shape_sparkle'), x: 6, y: 6, size: 30 }, { source: catalogArt('obj_sky_cloud'), x: 92, y: 0, size: 50 }, { source: catalogArt('obj_keep_letter'), x: 36, y: 30, size: 76, float: true }],
  gift: [{ source: catalogArt('obj_shape_sparkle'), x: 92, y: 4, size: 28 }, { source: catalogArt('obj_shape_dots'), x: 6, y: 66, size: 32 }, { source: catalogArt('obj_keep_gift'), x: 38, y: 26, size: 74 }],
  celebrate: [{ source: catalogArt('obj_shape_sparkle'), x: 8, y: 14, size: 30 }, { source: catalogArt('obj_party_ribbon'), x: 96, y: 62, size: 44 }, { source: catalogArt('obj_party_balloon'), x: 44, y: 6, size: 80 }],
  rest: [{ source: catalogArt('obj_sky_star'), x: 100, y: 6, size: 26 }, { source: catalogArt('obj_sky_cloud'), x: 6, y: 18, size: 54 }, { source: catalogArt('obj_sky_moon'), x: 52, y: 32, size: 66 }],
  books: [{ source: catalogArt('obj_shape_sparkle'), x: 100, y: 10, size: 26 }, { source: catalogArt('obj_plant_potted'), x: 8, y: 40, size: 56 }, { source: catalogArt('obj_decor_books'), x: 54, y: 30, size: 78 }],
} satisfies Record<string, Piece[]>;
export type SpotKind = keyof typeof spots;
/** interaction-notes.md §10.1: 6pt up and back, 3.2 s each way, ease-in-out; still with reduced motion, paused off screen. */
export const FLOAT_LIFT = 6;
export const FLOAT_MS = 3200;
function Floating({ piece, running }: { piece: Piece; running: boolean }) {
  const lift = useSharedValue(0);
  useEffect(() => {
    if (!running) { cancelAnimation(lift); return; }
    lift.value = withRepeat(withTiming(-FLOAT_LIFT, { duration: FLOAT_MS, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(lift);
  }, [lift, running]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  return <Animated.Image testID="spot-floating" source={piece.source} resizeMode="contain" style={[{ position: 'absolute', left: piece.x, top: piece.y, width: piece.size, height: piece.size }, style]} />;
}
export function Spot({ kind, reducedMotion, scale = 1 }: { kind: SpotKind; reducedMotion?: boolean; scale?: number }) {
  const systemReduced = useReducedMotion();
  const active = useLoopActive();
  const still = reducedMotion ?? systemReduced;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 150 * scale, height: 120 * scale, alignSelf: 'center' }}>
      <View style={{ width: 150, height: 120, transform: [{ scale }], transformOrigin: 'top left' }}>
        {spots[kind].map((piece: Piece, index) => piece.float && !still
          ? <Floating key={index} piece={piece} running={active} />
          : <Image key={index} testID={piece.float ? 'spot-still' : undefined} source={piece.source} resizeMode="contain" style={{ position: 'absolute', left: piece.x, top: piece.y, width: piece.size, height: piece.size }} />)}
      </View>
    </View>
  );
}
