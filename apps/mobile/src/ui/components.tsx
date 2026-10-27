import type { ReactNode } from 'react';
import { Modal, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { tokens } from '../theme/tokens';
const color = tokens.color.app.light.normal;
type ActionProps = { label: string; onPress: () => void; disabled?: boolean };
export function Button({ label, onPress, disabled = false, variant = 'primary' }: ActionProps & { variant?: 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost' }) {
  const backgroundColor = variant === 'primary' ? color.primary : variant === 'danger' ? color.danger : 'transparent';
  const foreground = variant === 'primary' || variant === 'danger' ? color.onPrimary : variant === 'dangerOutline' ? color.danger : color.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', backgroundColor, borderWidth: variant === 'secondary' || variant === 'dangerOutline' ? 1 : 0, borderColor: foreground, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: foreground }}>{label}</Text></Pressable>;
}
export function TextField({ label, ...props }: TextInputProps & { label: string }) {
  return <TextInput {...props} accessibilityLabel={label} style={[{ minHeight: 44, borderWidth: 1, borderColor: color.border, color: color.text, padding: 10 }, props.style]} />;
}
export function Chip({ label }: { label: string }) { return <View accessibilityLabel={label} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}><Text style={{ color: color.text }}>{label}</Text></View>; }
export function OccupancyChip({ label }: { label: string }) { return <Chip label={label} />; }
export function Banner({ text, kind = 'info' }: { text: string; kind?: 'info' | 'success' | 'warn' | 'danger' | 'offline' }) {
  const backgrounds = { info: color.infoBg, success: color.successBg, warn: color.warnBg, danger: color.dangerBg, offline: color.surface2 };
  return <View accessible accessibilityRole="alert" style={{ backgroundColor: backgrounds[kind], padding: 12 }}><Text style={{ color: color.text }}>{text}</Text></View>;
}
export function Toast({ text }: { text: string }) { return <Banner text={text} />; }
export function Skeleton({ label }: { label: string }) { return <View accessible accessibilityLabel={label} style={{ minHeight: 44, backgroundColor: color.surface2 }} />; }
export function Dialog({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  return <Modal visible={visible} transparent onRequestClose={onClose}><View accessibilityViewIsModal style={{ padding: 24, backgroundColor: color.surface }}><Text accessibilityRole="header" style={{ color: color.text }}>{title}</Text>{children}</View></Modal>;
}
export function BottomSheet({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) { return <Dialog visible={visible} title={title} onClose={onClose}>{children}</Dialog>; }
export function ListRow({ label, onPress }: ActionProps) { return <Button label={label} onPress={onPress} variant="ghost" />; }
