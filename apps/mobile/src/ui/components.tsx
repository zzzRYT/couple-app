import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, useColorScheme, type TextInputProps } from 'react-native';
import { tokens } from '../theme/tokens';
function useColor() { return tokens.color.app[useColorScheme() === 'dark' ? 'dark' : 'light'].normal; }
type ActionProps = { label: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string; testID?: string };
export function Button({ label, onPress, disabled = false, variant = 'primary', accessibilityLabel, testID }: ActionProps & { variant?: 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost' }) {
  const color = useColor();
  const backgroundColor = variant === 'primary' ? color.primary : variant === 'danger' ? color.danger : 'transparent';
  const foreground = variant === 'primary' || variant === 'danger' ? color.onPrimary : variant === 'dangerOutline' ? color.danger : color.text;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={{ minHeight: tokens.touch.minimum, minWidth: tokens.touch.minimum, paddingHorizontal: tokens.spacing[3], paddingVertical: tokens.spacing[1], justifyContent: 'center', alignItems: 'center', backgroundColor, borderRadius: tokens.radius.input, borderWidth: variant === 'secondary' || variant === 'dangerOutline' ? 1 : 0, borderColor: foreground, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: foreground, textAlign: 'center', fontSize: tokens.typography.scale.label.size }}>{label}</Text></Pressable>;
}
export function TextField({ label, ...props }: TextInputProps & { label: string }) {
  const color = useColor();
  return <TextInput {...props} accessibilityLabel={label} style={[{ minHeight: 44, borderWidth: 1, borderColor: color.border, color: color.text, padding: tokens.spacing[2], borderRadius: tokens.radius.input }, props.style]} />;
}
export function Chip({ label }: { label: string }) { const color = useColor(); return <View accessibilityLabel={label} style={{ minHeight: tokens.touch.minimum, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: tokens.spacing[2], borderRadius: tokens.radius.pill, backgroundColor: color.surface2 }}><Text style={{ color: color.text }}>{label}</Text></View>; }
export function OccupancyChip({ label }: { label: string }) { return <Chip label={label} />; }
export function Banner({ text, kind = 'info' }: { text: string; kind?: 'info' | 'success' | 'warn' | 'danger' | 'offline' }) {
  const color = useColor();
  const backgrounds = { info: color.infoBg, success: color.successBg, warn: color.warnBg, danger: color.dangerBg, offline: color.surface2 };
  return <View accessible accessibilityRole="alert" style={{ backgroundColor: backgrounds[kind], padding: tokens.spacing[2], borderRadius: tokens.radius.input }}><Text style={{ color: color.text }}>{text}</Text></View>;
}
export function Toast({ text }: { text: string }) { return <Banner text={text} />; }
export function Skeleton({ label }: { label: string }) { const color = useColor(); return <View accessible accessibilityLabel={label} style={{ minHeight: 44, backgroundColor: color.surface2 }} />; }
export function Dialog({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const color = useColor();
  return <Modal visible={visible} transparent onRequestClose={onClose}><View style={{ flex: 1, justifyContent: 'center', padding: tokens.spacing[4], backgroundColor: '#00000080' }}><ScrollView accessibilityViewIsModal contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2], backgroundColor: color.surface, borderRadius: tokens.radius.sheet }} style={{ flexGrow: 0 }}><Text accessibilityRole="header" style={{ color: color.text, fontSize: tokens.typography.scale.heading.size }}>{title}</Text>{children}</ScrollView></View></Modal>;
}
export function BottomSheet({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) { return <Dialog visible={visible} title={title} onClose={onClose}>{children}</Dialog>; }
export function ListRow({ label, onPress }: ActionProps) { return <Button label={label} onPress={onPress} variant="ghost" />; }
