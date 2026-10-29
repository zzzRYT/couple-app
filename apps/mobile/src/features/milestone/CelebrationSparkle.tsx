import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Icon } from '../../ui/Icon';
import { useReducedMotion } from '../../ui/motion';
import { useAppColor } from '../../theme/useAppColor';

export function CelebrationSparkle() {
  const reduced = useReducedMotion();
  const color = useAppColor();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  useEffect(() => {
    cancelAnimation(scale);
    scale.value = reduced ? 1 : withRepeat(withTiming(1.14, { duration: 700 }), 7, true);
    return () => cancelAnimation(scale);
  }, [reduced, scale]);
  return <Animated.View style={style}><View testID="milestone-sparkle"><Icon name="sparkle" size={24} color={color.primary} /></View></Animated.View>;
}
