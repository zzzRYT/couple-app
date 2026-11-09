import { useRef, type ComponentRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAppColor } from '../theme/useAppColor';
import { useType } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { useLargeText } from './textScale';

/** V0-01 draws the boxes 34 x 44, 5pt apart; the home pending card draws them `compact`, 28 x 38. */
const SIZES = { regular: { width: 34, height: 44, font: 20 }, compact: { width: 28, height: 38, font: 17 } };
const GAP = 5;
/** Invite code as 4 boxes, a dash and 4 boxes. Read as one string, never box by box. Boxes narrow to fit a tight card; with large text they grow and the two groups wrap onto two rows. */
function Boxes({ chars, error, cursor, compact = false }: { chars: string; error?: boolean; cursor?: number; compact?: boolean }) {
  const color = useAppColor();
  const { emphasis } = useType();
  const large = useLargeText();
  const size = compact ? SIZES.compact : SIZES.regular;
  const box = (index: number) => (
    <View key={index} style={{ width: large ? undefined : size.width, minWidth: large ? size.width : undefined, minHeight: size.height, flexShrink: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: large ? 4 : 0, borderRadius: 10, borderWidth: tokens.border.outline.normal, borderColor: error ? color.danger : index === cursor ? color.focus : color.line, backgroundColor: color.surface }}>
      <Text style={[emphasis(size.font), { color: color.text }]}>{chars[index] ?? ''}</Text>
    </View>
  );
  const group = (indexes: number[]) => <View style={{ flexDirection: 'row', flexShrink: 1, gap: GAP }}>{indexes.map(box)}</View>;
  return (
    <View style={{ flexDirection: 'row', flexWrap: large ? 'wrap' : 'nowrap', justifyContent: 'center', alignItems: 'center', rowGap: tokens.spacing[1], columnGap: GAP }}>
      {group([0, 1, 2, 3])}
      <View style={{ width: 8, height: 2, backgroundColor: color.border }} />
      {group([4, 5, 6, 7])}
    </View>
  );
}
export function CodeBoxes({ code, label, compact = false }: { code: string; label: string; compact?: boolean }) {
  return <View accessible accessibilityRole="text" accessibilityLabel={label}><Boxes chars={code.replace(/[^0-9a-z]/gi, '').toUpperCase()} compact={compact} /></View>;
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
