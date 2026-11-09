import { Text, View } from 'react-native';
import { useAppColor } from '../theme/useAppColor';
import { useType } from '../theme/typography';
import { AppText, WORD_BREAK } from './components';
import { Icon } from './Icon';

/** Field error under a control (V0-01 §2.5): warn triangle and bold danger text, announced when it appears. */
export function InlineError({ text }: { text: string }) {
  const color = useAppColor();
  const { emphasis } = useType();
  return (
    <View accessible accessibilityRole="alert" accessibilityLabel={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name="warn" size={16} color={color.danger} />
      <Text {...WORD_BREAK} style={[emphasis(13), { color: color.danger, flexShrink: 1 }]}>{text}</Text>
    </View>
  );
}
/** A quiet note with an info icon and no box, unlike Banner (V0-01 §2.5). */
export function InlineHint({ text }: { text: string }) {
  const color = useAppColor();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Icon name="info" size={18} color={color.info} />
      <AppText tone="text2" variant="bodySm" style={{ flex: 1 }}>{text}</AppText>
    </View>
  );
}
