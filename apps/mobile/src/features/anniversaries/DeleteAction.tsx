import { Pressable } from 'react-native';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText } from '../../ui/components';
import { Icon } from '../../ui/Icon';
/** "이 기념일 삭제" at the foot of the custom detail and the edit sheet: a danger text button with a trash icon. */
export function DeleteAction({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  const color = useAppColor(); const { emphasis } = useType();
  const ink = disabled ? color.text2 : color.danger;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}>
    <Icon name="trash" size={20} color={ink} /><AppText style={[emphasis(16), { color: ink, flexShrink: 1 }]}>{label}</AppText>
  </Pressable>;
}
