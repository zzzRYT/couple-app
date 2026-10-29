import { useRef, type ComponentRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAppColor } from '../theme/useAppColor';
import { useType } from '../theme/typography';
import { tokens } from '../theme/tokens';

/** Invite code as 4 + 4 boxes (components.md §2.3). Read as one string, never box by box; wraps to two rows with large text. */
function Boxes({ chars, error, cursor }: { chars: string; error?: boolean; cursor?: number }) {
  const color = useAppColor();
  const { type } = useType();
  const box = (index: number) => (
    <View key={index} style={{ width: 30, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: tokens.border.outline.normal, borderColor: error ? color.danger : index === cursor ? color.focus : color.border, backgroundColor: color.surface }}>
      <Text style={[type('heading'), { color: color.text }]}>{chars[index] ?? ''}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: tokens.spacing[1], columnGap: tokens.spacing[3] }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>{[0, 1, 2, 3].map(box)}</View>
      <View style={{ flexDirection: 'row', gap: 4 }}>{[4, 5, 6, 7].map(box)}</View>
    </View>
  );
}
export function CodeBoxes({ code, label }: { code: string; label: string }) {
  return <View accessible accessibilityRole="text" accessibilityLabel={label}><Boxes chars={code.replace(/[^0-9a-z]/gi, '').toUpperCase()} /></View>;
}
/** Typing field drawn as boxes: a transparent input over the boxes keeps the system keyboard, paste and the one accessible name. */
export function CodeInput({ value, onChangeText, label, error }: { value: string; onChangeText: (value: string) => void; label: string; error?: boolean }) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const chars = value.replace(/[^0-9a-z]/gi, '').toUpperCase();
  return (
    <Pressable accessible={false} onPress={() => input.current?.focus()}>
      <Boxes chars={chars} error={error} cursor={Math.min(chars.length, 7)} />
      <TextInput ref={input} accessibilityLabel={label} value={value} onChangeText={onChangeText} autoCapitalize="characters" autoCorrect={false} autoComplete="off" maxLength={9} caretHidden
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, color: 'transparent', opacity: 0.02 }} />
    </Pressable>
  );
}
