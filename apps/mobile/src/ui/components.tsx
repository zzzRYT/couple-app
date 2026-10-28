import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useColorScheme, type TextInputProps, type TextProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { tokens } from '../theme/tokens';
import { useAppColor } from '../theme/useAppColor';
import { useType, type TypeVariant } from '../theme/typography';
import { Icon, type IconName } from './Icon';
import { useReducedMotion } from './motion';

type AppColor = ReturnType<typeof useAppColor>;
type Tone = 'text' | 'text2' | 'primary' | 'danger' | 'success' | 'onPrimary';
/** components.md §2-6, Direction A: brown outline (2px), flat surfaces, no shadows, pill buttons. */
export const GUTTER = tokens.spacing[4];
/** tokens.typography.wordBreak ko = keep-all: wrap Korean at word boundaries (iOS). */
export const WORD_BREAK = { lineBreakStrategyIOS: 'hangul-word' } as const;
export function AppText({ variant = 'body', tone = 'text', align, style, ...props }: TextProps & { variant?: TypeVariant; tone?: Tone; align?: 'left' | 'center' | 'right' }) {
  const color = useAppColor();
  const { type } = useType();
  return <Text {...WORD_BREAK} {...props} style={[type(variant), { color: color[tone], textAlign: align }, style]} />;
}
type ActionProps = { label: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string; testID?: string };
type Variant = 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost';
function buttonColors(variant: Variant, color: AppColor) {
  switch (variant) {
    case 'primary': return { face: color.primary, ink: color.onPrimary, edge: color.line };
    case 'secondary': return { face: color.surface, ink: color.text, edge: color.line };
    case 'danger': return { face: color.danger, ink: color.onDanger, edge: color.line };
    case 'dangerOutline': return { face: color.surface, ink: color.danger, edge: color.danger };
    case 'ghost': return { face: 'transparent', ink: color.primary, edge: 'transparent' };
  }
}
/** `outline` overrides the edge colour where the control sits on the room (the outline follows the room's day/night, components.md §1.2). */
export function Button({ label, onPress, disabled = false, loading = false, variant = 'primary', icon, compact = false, outline, accessibilityLabel, testID }: ActionProps & { variant?: Variant; loading?: boolean; icon?: IconName; compact?: boolean; outline?: string }) {
  const color = useAppColor();
  const { type } = useType();
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;
  const base = buttonColors(variant, color);
  const ghost = variant === 'ghost';
  const { face, ink, edge } = disabled && !ghost ? { face: color.surface2, ink: color.text2, edge: color.border } : disabled ? { ...base, ink: color.text2 } : base;
  const style: ViewStyle = {
    minHeight: compact ? tokens.touch.minimum : tokens.touch.toolbarHeight, minWidth: tokens.touch.minimum, paddingHorizontal: ghost ? tokens.spacing[2] : tokens.spacing[5], paddingVertical: tokens.spacing[1],
    flexDirection: 'row', gap: tokens.spacing[1], justifyContent: 'center', alignItems: 'center', backgroundColor: face, borderRadius: tokens.radius.pill,
    borderWidth: ghost ? 0 : tokens.border.outline.normal, borderColor: outline ?? edge, borderStyle: disabled && !ghost ? 'dashed' : 'solid',
    opacity: pressed ? 0.88 : 1, transform: [{ translateY: pressed ? 1 : 0 }],
  };
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive}
      onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={style}>
      {loading ? <ActivityIndicator size="small" color={ink} /> : icon ? <Icon name={icon} size={20} color={ink} /> : null}
      <Text {...WORD_BREAK} style={[type('label'), { color: ink, textAlign: 'center', flexShrink: 1 }]}>{label}</Text>
    </Pressable>
  );
}
/** Round 48pt icon button (components.md §2.2); `plain` drops the surface for top-bar back/close. */
export function IconButton({ icon, label, onPress, disabled = false, plain = false, testID }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; plain?: boolean; testID?: string }) {
  const color = useAppColor();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} hitSlop={4}
      style={({ pressed }) => ({ width: tokens.touch.minimum, height: tokens.touch.minimum, borderRadius: tokens.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: plain ? 'transparent' : color.surface, borderWidth: plain ? 0 : tokens.border.outline.normal, borderColor: color.line, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={plain ? 26 : 22} color={color.text} />
    </Pressable>
  );
}
export function TextField({ label, error, hideLabel = false, ...props }: TextInputProps & { label: string; error?: string | null; hideLabel?: boolean }) {
  const color = useAppColor();
  const { type, emphasis } = useType();
  const [focused, setFocused] = useState(false);
  const edge = error ? color.danger : focused ? color.focus : color.border;
  return (
    <View style={{ gap: tokens.spacing[1] }}>
      {!hideLabel && <Text {...WORD_BREAK} style={[emphasis(14), { color: color.text }]}>{label}</Text>}
      <TextInput placeholderTextColor={color.text2} {...props} accessibilityLabel={label}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        style={[type('body'), { minHeight: tokens.touch.toolbarHeight, borderWidth: tokens.border.outline.normal, borderColor: edge, color: color.text, backgroundColor: props.editable === false ? color.surface2 : color.surface, paddingHorizontal: tokens.spacing[3], paddingVertical: tokens.spacing[2], borderRadius: tokens.radius.input }, props.style]} />
      {error && <View style={{ flexDirection: 'row', gap: tokens.spacing[0], alignItems: 'center' }}><Icon name="warn" size={16} color={color.danger} /><Text {...WORD_BREAK} style={[type('bodySm'), { color: color.danger, flexShrink: 1 }]}>{error}</Text></View>}
    </View>
  );
}
type ChipKind = 'neutral' | 'info' | 'success' | 'warn' | 'danger' | 'primary';
function chipColors(kind: ChipKind, color: AppColor) {
  switch (kind) {
    case 'neutral': return { face: color.surface, ink: color.text2, edge: color.border };
    case 'info': return { face: color.infoBg, ink: color.info, edge: color.info };
    case 'success': return { face: color.successBg, ink: color.success, edge: color.success };
    case 'warn': return { face: color.warnBg, ink: color.warn, edge: color.warn };
    case 'danger': return { face: color.dangerBg, ink: color.danger, edge: color.danger };
    case 'primary': return { face: color.primary, ink: color.onPrimary, edge: color.primary };
  }
}
export function Chip({ label, kind = 'neutral', icon }: { label: string; kind?: ChipKind; icon?: IconName }) {
  const color = useAppColor();
  const { emphasis } = useType();
  const { face, ink, edge } = chipColors(kind, color);
  return (
    <View accessible accessibilityLabel={label} style={{ minHeight: 32, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[0] + 2, paddingHorizontal: tokens.spacing[2] + 4, paddingVertical: tokens.spacing[0], borderRadius: tokens.radius.pill, backgroundColor: face, borderWidth: tokens.border.outline.normal, borderColor: edge }}>
      {icon && <Icon name={icon} size={16} color={ink} />}
      <Text {...WORD_BREAK} style={[emphasis(13), { color: ink, flexShrink: 1 }]}>{label}</Text>
    </View>
  );
}
export function OccupancyChip({ label, state = 'free' }: { label: string; state?: 'free' | 'mine' | 'partner' }) {
  return <Chip label={label} kind={state === 'mine' ? 'primary' : state === 'partner' ? 'warn' : 'neutral'} icon={state === 'mine' ? 'pencil' : state === 'partner' ? 'lock' : 'clock'} />;
}
type BannerKind = 'info' | 'success' | 'warn' | 'danger' | 'offline';
const bannerIcons: Record<BannerKind, IconName> = { info: 'info', success: 'check', warn: 'warn', danger: 'warn', offline: 'offline' };
/** `quiet` sets a one-line note in body text instead of a bold title (e.g. the S03 time-zone note). */
export function Banner({ text, body, kind = 'info', action, icon, quiet = false }: { text: string; body?: string | null; kind?: BannerKind; action?: { label: string; onPress: () => void; disabled?: boolean }; icon?: IconName; quiet?: boolean }) {
  const color = useAppColor();
  const { type, emphasis } = useType();
  const faces = { info: color.infoBg, success: color.successBg, warn: color.warnBg, danger: color.dangerBg, offline: color.surface2 };
  const inks = { info: color.info, success: color.success, warn: color.warn, danger: color.danger, offline: color.text2 };
  return (
    <View accessible={!action} accessibilityRole="alert" style={{ flexDirection: 'row', gap: tokens.spacing[2], backgroundColor: faces[kind], borderWidth: tokens.border.outline.normal, borderColor: inks[kind], paddingVertical: tokens.spacing[2], paddingHorizontal: tokens.spacing[3], borderRadius: tokens.radius.input }}>
      <View style={{ paddingTop: 2 }}><Icon name={icon ?? bannerIcons[kind]} size={20} color={inks[kind]} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text {...WORD_BREAK} style={[quiet ? type('bodySm') : emphasis(15), { color: color.text }]}>{text}</Text>
        {body ? <Text {...WORD_BREAK} style={[type('bodySm'), { color: color.text2 }]}>{body}</Text> : null}
        {action && <Pressable accessibilityRole="button" accessibilityLabel={action.label} disabled={action.disabled} onPress={action.onPress} hitSlop={12} style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', opacity: action.disabled ? 0.5 : 1 }}>
          <Text {...WORD_BREAK} style={[emphasis(15), { color: color.primary, textDecorationLine: 'underline' }]}>{action.label}</Text>
        </Pressable>}
      </View>
    </View>
  );
}
/** Dark brown (light app) / cream (dark app) pill that hides itself after 3s; important information also stays on screen. */
export function Toast({ text, onHide, icon = 'check' }: { text: string; onHide?: () => void; icon?: IconName }) {
  const dark = useColorScheme() === 'dark';
  const { emphasis } = useType();
  useEffect(() => {
    if (!onHide) return;
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [onHide]);
  const face = dark ? tokens.color.app.dark.normal.text : tokens.color.app.light.normal.text;
  const ink = dark ? tokens.color.app.dark.normal.bg : tokens.color.app.light.normal.surface;
  return (
    <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1], maxWidth: '100%', paddingVertical: tokens.spacing[2], paddingHorizontal: tokens.spacing[4], borderRadius: tokens.radius.pill, backgroundColor: face }}>
      <Icon name={icon} size={18} color={ink} />
      <Text {...WORD_BREAK} style={[emphasis(15), { color: ink, flexShrink: 1 }]}>{text}</Text>
    </View>
  );
}
/** Placeholder block; give one `label` per loading region and leave the rest unlabelled so the state is read once. */
export function Skeleton({ label, height = 44, width }: { label?: string; height?: number; width?: ViewStyle['width'] }) {
  const color = useAppColor();
  return <View accessible={!!label} accessibilityLabel={label} style={{ height, width, borderRadius: tokens.radius.input, backgroundColor: color.surface2 }} />;
}
export function Card({ children, style, tone = 'divider' }: { children: ReactNode; style?: ViewStyle; tone?: 'divider' | 'line' }) {
  const color = useAppColor();
  return <View style={[{ backgroundColor: color.surface, borderWidth: tokens.border.outline.normal, borderColor: tone === 'line' ? color.line : color.divider, borderRadius: tokens.radius.card, padding: tokens.spacing[4], gap: tokens.spacing[2] }, style]}>{children}</View>;
}
export function SectionLabel({ text }: { text: string }) {
  const color = useAppColor();
  const { emphasis } = useType();
  return <Text {...WORD_BREAK} accessibilityRole="header" style={[emphasis(14), { color: color.text2, marginTop: tokens.spacing[2] }]}>{text}</Text>;
}
export function Dialog({ visible, title, body, icon, children, onClose }: { visible: boolean; title: string; body?: string; icon?: IconName; children: ReactNode; onClose: () => void }) {
  const color = useAppColor();
  const { type } = useType();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'center', padding: GUTTER, backgroundColor: 'rgba(43,35,32,0.5)' }}>
        <ScrollView accessibilityViewIsModal style={{ flexGrow: 0 }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[3], backgroundColor: color.surface, borderRadius: tokens.radius.sheet, borderWidth: tokens.border.outline.normal, borderColor: color.line }}>
          {icon && <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface2, borderWidth: tokens.border.outline.normal, borderColor: color.line }}><Icon name={icon} size={26} color={color.text} /></View>}
          <Text {...WORD_BREAK} accessibilityRole="header" style={[type('heading'), { color: color.text }]}>{title}</Text>
          {body ? <Text {...WORD_BREAK} style={[type('body'), { color: color.text2 }]}>{body}</Text> : null}
          <View style={{ gap: tokens.spacing[1] }}>{children}</View>
        </ScrollView>
      </View>
    </Modal>
  );
}
/** components.md §4.2: rounded top, handle, scrim, rises above the keyboard and covers the tab bar. */
export function BottomSheet({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const color = useAppColor();
  const { type } = useType();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'slide'} onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(43,35,32,0.5)' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={{ flex: 1 }} onPress={onClose} />
        <View accessibilityViewIsModal style={{ maxHeight: '90%', backgroundColor: color.surface, borderTopLeftRadius: tokens.radius.sheet, borderTopRightRadius: tokens.radius.sheet, borderWidth: tokens.border.outline.normal, borderBottomWidth: 0, borderColor: color.line }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginTop: tokens.spacing[1] }} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: GUTTER, paddingBottom: Math.max(insets.bottom, GUTTER), gap: tokens.spacing[3] }}>
            <Text {...WORD_BREAK} accessibilityRole="header" style={[type('heading'), { color: color.text }]}>{title}</Text>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
/** Settings-style row: icon + title + value + chevron, at least 56pt tall. */
export function ListRow({ label, onPress, icon, value, danger = false, disabled = false, last = true, accessibilityLabel, testID }: ActionProps & { icon?: IconName; value?: string; danger?: boolean; last?: boolean }) {
  const color = useAppColor();
  const { type } = useType();
  const ink = danger ? color.danger : color.text;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2], paddingVertical: tokens.spacing[2], borderBottomWidth: last ? 0 : 1, borderColor: color.divider, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
      {icon && <Icon name={icon} size={22} color={ink} />}
      <Text {...WORD_BREAK} style={[type('body'), { color: ink, flex: 1 }]}>{label}</Text>
      {value ? <Text {...WORD_BREAK} style={[type('bodySm'), { color: color.text2, flexShrink: 1, textAlign: 'right' }]}>{value}</Text> : null}
      <Icon name="forward" size={18} color={color.text2} />
    </Pressable>
  );
}
/** Bottom space a tab root keeps clear of the system tab bar (components.md §1.1: iOS 49pt, Android about 80pt, plus the home indicator). */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + (Platform.OS === 'ios' ? 49 : 80);
}
/** Screen scaffold: safe areas, 20pt gutter, optional back/close bar, scrolling body and a footer pinned above the home indicator. */
export function Screen({ children, footer, onBack, onClose, scroll = true, center = false, bottomInset = true, testID }: {
  children: ReactNode; footer?: ReactNode; onBack?: () => void; onClose?: () => void; scroll?: boolean; center?: boolean; bottomInset?: boolean; testID?: string;
}) {
  const color = useAppColor();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bar = onBack || onClose
    ? <View style={{ height: tokens.touch.minimum + tokens.spacing[1], flexDirection: 'row', alignItems: 'center', justifyContent: onBack ? 'flex-start' : 'flex-end', marginHorizontal: GUTTER - 12 }}>
      {onBack && <IconButton plain icon="back" label={t('a11y.back')} onPress={onBack} testID="screen-back" />}
      {onClose && <IconButton plain icon="close" label={t('a11y.close')} onPress={onClose} testID="screen-close" />}
    </View>
    : null;
  const body = { flexGrow: 1, paddingHorizontal: GUTTER, paddingTop: bar ? tokens.spacing[1] : tokens.spacing[3], paddingBottom: tokens.spacing[5], gap: tokens.spacing[3], justifyContent: center ? 'center' as const : 'flex-start' as const };
  return (
    <KeyboardAvoidingView testID={testID} behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      {bar}
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={body}>{children}</ScrollView> : <View style={[{ flex: 1 }, body]}>{children}</View>}
      {footer && <View style={{ paddingHorizontal: GUTTER, paddingTop: tokens.spacing[2], paddingBottom: bottomInset ? Math.max(insets.bottom, GUTTER) : GUTTER, gap: tokens.spacing[1] }}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}
