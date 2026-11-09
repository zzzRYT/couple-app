import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, type TextInputProps, type TextProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { tokens } from '../theme/tokens';
import { useAppColor } from '../theme/useAppColor';
import { useType, type TypeVariant } from '../theme/typography';
import { Icon, type IconName } from './Icon';
import { useReducedMotion } from './motion';
import { useLargeText } from './textScale';
import { FlowBackAction } from './FlowBack';
import { SheetModal } from './SheetModal';
import { useDisplayAppearance } from '../features/settings/preferences';

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
type Variant = 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost' | 'apple';
function buttonColors(variant: Variant, color: AppColor, dark: boolean) {
  switch (variant) {
    case 'primary': return { face: color.primary, ink: color.onPrimary, edge: color.line };
    case 'secondary': return { face: color.surface, ink: color.text, edge: color.line };
    case 'danger': return { face: color.danger, ink: color.onDanger, edge: color.line };
    case 'dangerOutline': return { face: color.surface, ink: color.danger, edge: color.danger };
    case 'ghost': return { face: 'transparent', ink: color.primary, edge: 'transparent' };
    // Apple's own black and white (V0-09 "Apple로 다시 로그인해 확인"); the label is ours, so it cannot be the system button.
    case 'apple': return dark ? { face: '#FFFFFF', ink: '#000000', edge: '#FFFFFF' } : { face: '#000000', ink: '#FFFFFF', edge: '#000000' };
  }
}
/** `outline` overrides the edge colour where the control sits on the room (the outline follows the room's day/night, components.md §1.2). */
export function Button({ label, onPress, disabled = false, loading = false, variant = 'primary', icon, compact = false, outline, accessibilityLabel, testID }: ActionProps & { variant?: Variant; loading?: boolean; icon?: IconName; compact?: boolean; outline?: string }) {
  const color = useAppColor();
  const dark = useDisplayAppearance().scheme === 'dark';
  const { type } = useType();
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;
  const base = buttonColors(variant, color, dark);
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
/** Round 48pt icon button (components.md §2.2); `plain` drops the surface for top-bar back/close. `compact` is the 44pt button V0 cards draw (celebration close, invite copy and share), with a `secondary` or `primary` face. */
export function IconButton({ icon, label, onPress, disabled = false, plain = false, compact = false, tone, testID }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; plain?: boolean; compact?: boolean; tone?: 'secondary' | 'primary'; testID?: string }) {
  const color = useAppColor();
  const size = compact ? tokens.touch.platformMinimum.ios : tokens.touch.minimum;
  const face = plain ? 'transparent' : tone === 'primary' ? color.primary : tone === 'secondary' ? color.surface2 : color.surface;
  const ink = tone === 'primary' ? color.onPrimary : plain && compact ? color.text2 : color.text;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} hitSlop={4}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: tokens.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: face, borderWidth: plain ? 0 : compact ? 1.5 : tokens.border.outline.normal, borderColor: tone === 'secondary' ? color.border : color.line, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={compact ? 20 : plain ? 26 : 22} color={ink} />
    </Pressable>
  );
}
/** Shared, translated back affordance used by screen scaffolds. */
export function BackControl({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return <IconButton plain icon="back" label={t('common.back')} onPress={onPress} testID="screen-back" />;
}
/** `icon` puts a leading glyph inside the field (V0-08/V0-09 mail and lock); `invalid` gives the danger edge without a message. A field that cannot be edited is dashed and filled, like a disabled button. */
export function TextField({ label, error, hideLabel = false, icon, invalid = false, ...props }: TextInputProps & { label: string; error?: string | null; hideLabel?: boolean; icon?: IconName; invalid?: boolean }) {
  const color = useAppColor();
  const { type, emphasis } = useType();
  const [focused, setFocused] = useState(false);
  const edge = error || invalid ? color.danger : focused ? color.focus : color.border;
  const disabled = props.editable === false;
  const face: ViewStyle = { minHeight: tokens.touch.toolbarHeight, borderWidth: tokens.border.outline.normal, borderColor: edge, backgroundColor: disabled ? color.surface2 : color.surface, borderRadius: tokens.radius.input, ...(disabled ? { borderStyle: 'dashed' as const } : null) };
  const input = <TextInput placeholderTextColor={color.text2} {...props} accessibilityLabel={label}
    onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
    style={[type('body'), icon
      ? { flex: 1, minHeight: tokens.touch.toolbarHeight - 2 * tokens.border.outline.normal, color: color.text, paddingRight: tokens.spacing[3], paddingVertical: tokens.spacing[2] }
      : { ...face, color: color.text, paddingHorizontal: tokens.spacing[3], paddingVertical: tokens.spacing[2] }, props.style]} />;
  return (
    <View style={{ gap: tokens.spacing[1] }}>
      {!hideLabel && <Text {...WORD_BREAK} style={[emphasis(14), { color: color.text }]}>{label}</Text>}
      {icon ? <View style={[face, { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1], paddingLeft: tokens.spacing[3] }]}><Icon name={icon} size={20} color={color.text2} />{input}</View> : input}
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
/** `quiet` sets a one-line note in body text instead of a bold title (e.g. the S03 time-zone note). `band` is the slimmer V0-03 status band: thinner edge, title and note in the kind's ink, announced as a status rather than an alert. */
export function Banner({ text, body, kind = 'info', action, icon, quiet = false, band = false }: { text: string; body?: string | null; kind?: BannerKind; action?: { label: string; onPress: () => void; disabled?: boolean }; icon?: IconName; quiet?: boolean; band?: boolean }) {
  const color = useAppColor();
  const { type, emphasis } = useType();
  const faces = { info: color.infoBg, success: color.successBg, warn: color.warnBg, danger: color.dangerBg, offline: color.surface2 };
  const inks = { info: color.info, success: color.success, warn: color.warn, danger: color.danger, offline: color.text2 };
  const role = band ? { role: 'status' as const, accessibilityLiveRegion: 'polite' as const } : { accessibilityRole: 'alert' as const };
  return (
    <View accessible={!action} {...role} style={{ flexDirection: 'row', gap: band ? 10 : tokens.spacing[2], alignItems: band ? 'center' : undefined, backgroundColor: faces[kind], borderWidth: band ? 1.5 : tokens.border.outline.normal, borderColor: inks[kind], paddingVertical: band ? 10 : tokens.spacing[2], paddingHorizontal: band ? 14 : tokens.spacing[3], borderRadius: tokens.radius.input }}>
      <View style={{ paddingTop: band ? 0 : 2 }}><Icon name={icon ?? bannerIcons[kind]} size={20} color={inks[kind]} /></View>
      <View style={{ flex: 1, gap: band ? 0 : 2 }}>
        <Text {...WORD_BREAK} style={[band ? emphasis(14) : quiet ? type('bodySm') : emphasis(15), { color: band ? inks[kind] : color.text }]}>{text}</Text>
        {body ? <Text {...WORD_BREAK} style={[type('bodySm'), band ? { fontSize: 13, color: inks[kind] } : { color: color.text2 }]}>{body}</Text> : null}
        {action && <Pressable accessibilityRole="button" accessibilityLabel={action.label} disabled={action.disabled} onPress={action.onPress} hitSlop={12} style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', opacity: action.disabled ? 0.5 : 1 }}>
          <Text {...WORD_BREAK} style={[emphasis(15), { color: color.primary, textDecorationLine: 'underline' }]}>{action.label}</Text>
        </Pressable>}
      </View>
    </View>
  );
}
/** V0 notice band: dark brown (light app) / cream (dark app), as wide as its container, hides itself after 3s; important information also stays on screen. */
export function Toast({ text, onHide, icon = 'check' }: { text: string; onHide?: () => void; icon?: IconName }) {
  const dark = useDisplayAppearance().scheme === 'dark';
  const { emphasis } = useType();
  useEffect(() => {
    if (!onHide) return;
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [onHide]);
  const face = dark ? tokens.color.app.dark.normal.text : tokens.color.app.light.normal.text;
  const ink = dark ? tokens.color.app.dark.normal.bg : tokens.color.app.light.normal.surface;
  return (
    <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: tokens.spacing[2], paddingHorizontal: tokens.spacing[3], borderRadius: 18, backgroundColor: face, shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } }}>
      <Icon name={icon} size={20} color={ink} />
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
/** V0-11 common dialog: 16pt from the screen edges, 12pt between parts, actions 4pt apart. */
export function Dialog({ visible, title, body, icon, children, onClose }: { visible: boolean; title: string; body?: string; icon?: IconName; children: ReactNode; onClose: () => void }) {
  const color = useAppColor();
  const { type, emphasis } = useType();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: tokens.spacing[3], paddingVertical: GUTTER, backgroundColor: 'rgba(43,35,32,0.5)' }}>
        <ScrollView accessibilityViewIsModal style={{ flexGrow: 0 }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2], backgroundColor: color.surface, borderRadius: tokens.radius.sheet, borderWidth: tokens.border.outline.normal, borderColor: color.line }}>
          {icon && <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface2, borderWidth: tokens.border.outline.normal, borderColor: color.line }}><Icon name={icon} size={26} color={color.text} /></View>}
          <Text {...WORD_BREAK} accessibilityRole="header" style={[emphasis(19), { color: color.text }]}>{title}</Text>
          {body ? <Text {...WORD_BREAK} style={[type('body'), { color: color.text2 }]}>{body}</Text> : null}
          <View style={{ gap: tokens.spacing[0] }}>{children}</View>
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
  return (
    <SheetModal visible={visible} onClose={onClose} dismissLabel={t('common.close')}>
      <View accessibilityViewIsModal style={{ flexShrink: 1, backgroundColor: color.surface, borderTopLeftRadius: tokens.radius.sheet, borderTopRightRadius: tokens.radius.sheet, borderWidth: tokens.border.outline.normal, borderBottomWidth: 0, borderColor: color.line }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginTop: tokens.spacing[1] }} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: GUTTER, paddingBottom: Math.max(insets.bottom, GUTTER), gap: tokens.spacing[3] }}>
          <Text {...WORD_BREAK} accessibilityRole="header" style={[type('heading'), { color: color.text }]}>{title}</Text>
          {children}
        </ScrollView>
      </View>
    </SheetModal>
  );
}
/** The 32pt `surface2` tile V0-07/V0-09 rows lead with. */
export function RowTile({ icon, danger = false }: { icon: IconName; danger?: boolean }) {
  const color = useAppColor();
  return <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: color.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} color={danger ? color.danger : color.text2} /></View>;
}
/**
 * Settings-style row: leading icon or tile, title, value, then a chevron, an external-link mark (opens outside the app) or
 * nothing (an action that happens right here, like 로그아웃). At least 56pt tall.
 */
export function ListRow({ label, onPress, icon, tile, value, valueTone = 'text2', labelTone = 'text', trailing = 'chevron', danger = false, disabled = false, last = true, accessibilityLabel, testID }: ActionProps & { icon?: IconName; tile?: IconName; value?: string; valueTone?: 'text2' | 'primary'; labelTone?: 'text' | 'primary'; trailing?: 'chevron' | 'external' | 'none'; danger?: boolean; last?: boolean }) {
  const color = useAppColor();
  const { type, emphasis } = useType();
  const ink = danger ? color.danger : labelTone === 'primary' ? color.primary : color.text;
  const labelFace = danger ? emphasis(16) : type('body');
  // An action value (V0-10 "연결하기") is drawn like a link: primary and bold, with a primary chevron.
  const valueInk = valueTone === 'primary' ? color.primary : color.text2;
  const valueFace = valueTone === 'primary' ? emphasis(14) : type('bodySm');
  const stacked = useLargeText() && !!value;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: tile ? tokens.spacing[2] + 4 : tokens.spacing[2], paddingVertical: tokens.spacing[2], borderBottomWidth: last ? 0 : 1, borderColor: color.divider, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
      {tile ? <RowTile icon={tile} danger={danger} /> : icon && <Icon name={icon} size={22} color={ink} />}
      {stacked ? <View style={{ flex: 1 }}><Text {...WORD_BREAK} style={[labelFace, { color: ink }]}>{label}</Text><Text {...WORD_BREAK} style={[valueFace, { color: valueInk }]}>{value}</Text></View> : <>
        <Text {...WORD_BREAK} style={[labelFace, { color: ink, flex: 1 }]}>{label}</Text>
        {value ? <Text {...WORD_BREAK} style={[valueFace, { color: valueInk, flexShrink: 1, textAlign: 'right' }]}>{value}</Text> : null}
      </>}
      {trailing === 'chevron' && <Icon name="forward" size={18} color={valueInk} />}
      {trailing === 'external' && <Icon name="externalLink" size={18} color={color.text2} />}
    </Pressable>
  );
}
/** A row that only shows something (V0-07: 상대, 버전; V0-09: 사용 중): no chevron and nothing to press. `subtitle` sits under the label (V0-sec-email address). */
export function InfoRow({ label, value, subtitle, tile, last = true }: { label: string; value?: string; subtitle?: string; tile?: IconName; last?: boolean }) {
  const color = useAppColor();
  const { type } = useType();
  const stacked = useLargeText() && !!value;
  const title = <Text {...WORD_BREAK} style={[type('body'), { color: color.text }]}>{label}</Text>;
  return (
    <View accessible accessibilityLabel={[label, subtitle, value].filter(Boolean).join(', ')} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: tile ? tokens.spacing[2] + 4 : tokens.spacing[2], paddingVertical: tokens.spacing[2], borderBottomWidth: last ? 0 : 1, borderColor: color.divider }}>
      {tile && <RowTile icon={tile} />}
      <View style={{ flex: 1, flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'flex-start' : 'center', gap: stacked ? 0 : tokens.spacing[2] }}>
        {subtitle ? <View style={{ flex: stacked ? undefined : 1, gap: 1 }}>{title}<Text {...WORD_BREAK} style={[type('bodySm'), { fontSize: 13, color: color.text2 }]}>{subtitle}</Text></View> : <View style={{ flex: stacked ? undefined : 1 }}>{title}</View>}
        {value ? <Text {...WORD_BREAK} style={[type('bodySm'), { color: color.text2, flexShrink: 1, textAlign: stacked ? 'left' : 'right' }]}>{value}</Text> : null}
      </View>
    </View>
  );
}
/** One choice of a single-choice list (V0-set-lang, -mode, -notify 미리 알림): a primary check on the chosen row, no chevron. */
export function RadioRow({ label, selected, onPress, disabled = false, last = true }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean; last?: boolean }) {
  const color = useAppColor();
  const { type } = useType();
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2], borderBottomWidth: last ? 0 : 1, borderColor: color.divider, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
      <Text {...WORD_BREAK} style={[type('body'), { color: color.text, flex: 1 }]}>{label}</Text>
      {selected ? <Icon name="check" size={22} color={color.primary} /> : <View style={{ width: 22 }} />}
    </Pressable>
  );
}
/** The switch as drawn on V0-07 (51×31); the system one changes shape and sits off-centre on iOS 26. Hidden from screen readers: the control holding it carries the name and state. */
function SwitchTrack({ value, disabled }: { value: boolean; disabled: boolean }) {
  const color = useAppColor();
  const on = value && !disabled;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 51, height: 31, borderRadius: 16, backgroundColor: disabled ? color.surface2 : on ? color.primary : '#E9E9EA', opacity: disabled ? 0.5 : 1 }}>
      <View style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }} />
    </View>
  );
}
/** Row with a trailing switch (V0-07). By default the whole row is the switch; with `onPress` the row opens something and only the switch toggles. */
export function SwitchRow({ label, value, onValueChange, leading, onPress, disabled = false, last = true }: { label: string; value: boolean; onValueChange: (value: boolean) => void; leading?: ReactNode; onPress?: () => void; disabled?: boolean; last?: boolean }) {
  const color = useAppColor();
  const { type } = useType();
  const toggle = () => onValueChange(!value);
  return (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2], borderBottomWidth: last ? 0 : 1, borderColor: color.divider }}>
      <Pressable accessibilityRole={onPress ? 'button' : 'switch'} accessibilityLabel={label} accessibilityState={onPress ? undefined : { checked: value, disabled }} disabled={!onPress && disabled} onPress={onPress ?? toggle}
        style={({ pressed }) => ({ flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2], paddingVertical: tokens.spacing[2], opacity: pressed ? 0.7 : 1 })}>
        {leading}
        <Text {...WORD_BREAK} style={[type('body'), { color: color.text, flex: 1 }]}>{label}</Text>
        {!onPress && <SwitchTrack value={value} disabled={disabled} />}
      </Pressable>
      {onPress && <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled }} disabled={disabled} hitSlop={12} onPress={toggle}><SwitchTrack value={value} disabled={disabled} /></Pressable>}
    </View>
  );
}
/** Bottom space a tab root keeps clear of the system tab bar (components.md §1.1: iOS 49pt, Android about 80pt, plus the home indicator). */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + (Platform.OS === 'ios' ? 49 : 80);
}
export type NavAction = { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };
/** The text action at the right of the nav bar (V0-set-me 저장): bold primary, a 48pt target. */
function NavTextButton({ label, onPress, disabled = false, loading = false }: NavAction) {
  const color = useAppColor();
  const { emphasis } = useType();
  const inactive = disabled || loading;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} onPress={onPress} hitSlop={4}
      style={({ pressed }) => ({ minHeight: tokens.touch.minimum, minWidth: tokens.touch.minimum, paddingHorizontal: tokens.spacing[2] + 4, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      {loading ? <ActivityIndicator size="small" color={color.primary} /> : <Text {...WORD_BREAK} style={[emphasis(16), { color: disabled ? color.text2 : color.primary }]}>{label}</Text>}
    </Pressable>
  );
}
/**
 * Screen scaffold: safe areas, 20pt gutter, optional back/close bar, scrolling body and a footer pinned above the home indicator.
 * `title` and `trailing` draw the V0 nav bar of pushed screens: back, a centered 17pt bold title and an optional text action.
 */
export function Screen({ children, footer, onBack, onClose, title, trailing, scroll = true, center = false, bottomInset = true, testID }: {
  children: ReactNode; footer?: ReactNode; onBack?: () => void; onClose?: () => void; title?: string; trailing?: NavAction; scroll?: boolean; center?: boolean; bottomInset?: boolean; testID?: string;
}) {
  const color = useAppColor();
  const { emphasis } = useType();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const close = onClose && <IconButton plain icon="close" label={t('a11y.close')} onPress={onClose} testID="screen-close" />;
  const side = { minWidth: tokens.touch.minimum, flexDirection: 'row' as const };
  const bar = title || trailing
    ? <View style={{ minHeight: tokens.touch.minimum + tokens.spacing[1], flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[0], marginHorizontal: GUTTER - 12 }}>
      <View style={side}>{onBack && <BackControl onPress={onBack} />}</View>
      {title ? <Text {...WORD_BREAK} accessibilityRole="header" style={[emphasis(17), { flex: 1, color: color.text, textAlign: 'center' }]}>{title}</Text> : <View style={{ flex: 1 }} />}
      <View style={[side, { justifyContent: 'flex-end' }]}>{trailing ? <NavTextButton {...trailing} /> : close}</View>
    </View>
    : onBack || onClose
    ? <View style={{ height: tokens.touch.minimum + tokens.spacing[1], flexDirection: 'row', alignItems: 'center', justifyContent: onBack ? 'flex-start' : 'flex-end', marginHorizontal: GUTTER - 12 }}>
      {onBack && <BackControl onPress={onBack} />}
      {close}
    </View>
    : null;
  const body = { flexGrow: 1, paddingHorizontal: GUTTER, paddingTop: bar ? tokens.spacing[1] : tokens.spacing[3], paddingBottom: tokens.spacing[5], gap: tokens.spacing[3], justifyContent: center ? 'center' as const : 'flex-start' as const };
  return (
    <KeyboardAvoidingView testID={testID} behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <FlowBackAction onBack={onBack} />
      {bar}
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={body}>{children}</ScrollView> : <View style={[{ flex: 1 }, body]}>{children}</View>}
      {footer && <View style={{ paddingHorizontal: GUTTER, paddingTop: tokens.spacing[2], paddingBottom: bottomInset ? Math.max(insets.bottom, GUTTER) : GUTTER, gap: tokens.spacing[1] }}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}
