import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { tokens } from '../theme/tokens';
import { useReducedMotion } from './motion';

const TRANSITION_MS = tokens.motion.transitionMs;
export const SCRIM = 'rgba(43,35,32,0.5)';

/**
 * Bottom-anchored modal where the scrim stays put and fades while only the sheet slides. The native `slide` animation
 * moves the whole modal, scrim included, so the Modal itself never animates. Reduced motion drops the slide and keeps the fade.
 */
export function SheetModal({ visible, onClose, dismissLabel, scrim = SCRIM, children }: { visible: boolean; onClose: () => void; dismissLabel: string; scrim?: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const [leaving, setLeaving] = useState(false);
  const wasVisible = useRef(false);
  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: TRANSITION_MS });
    const opened = wasVisible.current;
    wasVisible.current = visible;
    if (visible || !opened) return;
    setLeaving(true);
    const timer = setTimeout(() => setLeaving(false), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [visible, progress]);
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => reduced ? { opacity: progress.value } : { transform: [{ translateY: (1 - progress.value) * height }] });
  if (!visible && !leaving) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View testID="sheet-scrim" pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: scrim }, scrimStyle]} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={dismissLabel} style={{ flex: 1 }} onPress={onClose} disabled={!visible} />
        <Animated.View testID="sheet-panel" style={[{ maxHeight: '90%' }, sheetStyle]}>{children}</Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
