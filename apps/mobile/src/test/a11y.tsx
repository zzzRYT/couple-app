import type { ReactElement, ReactNode } from 'react';
import { Dimensions } from 'react-native';
import { render } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { safeMetrics } from './render';
import { createI18n, type Locale } from '../i18n';
const storage = { getItemAsync: async () => null, setItemAsync: async () => {} };

/** The host-element JSON `screen.toJSON()` returns. */
type Node = { type: string; props: Record<string, unknown>; children: (Node | string)[] | null };
type Props = Record<string, unknown>;
const isNode = (child: unknown): child is Node => typeof child === 'object' && child !== null && 'type' in child;
const hidden = (props: Props) => props.accessibilityElementsHidden === true || props['aria-hidden'] === true || props.importantForAccessibility === 'no-hide-descendants';
function text(node: Node | string): string {
  if (typeof node === 'string') return node;
  if (hidden(node.props)) return '';
  return (node.children ?? []).map((child) => text(child)).join(' ').trim();
}
/** A control the user can touch: a Pressable host view (focusable), a switch or a text input. */
const touchable = (node: Node) => node.props.focusable === true || node.type === 'RCTSwitch' || node.type === 'Switch' || node.type === 'TextInput';
const name = (node: Node) => String(node.props.accessibilityLabel ?? node.props['aria-label'] ?? '').trim() || (node.type === 'TextInput' ? '' : text(node));
const role = (node: Node) => node.props.accessibilityRole ?? node.props.role ?? (node.type === 'TextInput' ? 'text' : undefined);

/** Every visible touchable in the rendered tree that lacks an accessibility role or a spoken name. */
export function unlabeledTouchables(tree: Node | Node[] | null): string[] {
  const found: string[] = [];
  /** A control marked `accessible={false}` is skipped by VoiceOver on purpose. Inside an accessible container (a wheel column, a grouped row) the container is the one element VoiceOver reaches. */
  const walk = (node: Node, path: string, grouped = false) => {
    if (hidden(node.props)) return;
    if (touchable(node) && !grouped && node.props.accessible !== false) {
      const missing = [role(node) ? '' : 'role', name(node) ? '' : 'name'].filter(Boolean);
      if (missing.length) found.push(`${path} <${node.type}> missing ${missing.join(' + ')}`);
    }
    (node.children ?? []).forEach((child, index) => { if (isNode(child)) walk(child, `${path}/${node.type}[${index}]`, grouped || node.props.accessible === true); });
  };
  (Array.isArray(tree) ? tree : tree ? [tree] : []).forEach((node, index) => walk(node, `root${index}`));
  return found;
}

/** Texts that were rendered with a line cap (`numberOfLines`) - the ones large text can hide behind an ellipsis. */
export function cappedTexts(tree: Node | Node[] | null): { lines: number; text: string }[] {
  const found: { lines: number; text: string }[] = [];
  const walk = (node: Node) => {
    if (hidden(node.props)) return;
    const lines = node.props.numberOfLines;
    if (typeof lines === 'number' && lines > 0) found.push({ lines, text: text(node) });
    (node.children ?? []).forEach((child) => { if (isNode(child)) walk(child); });
  };
  (Array.isArray(tree) ? tree : tree ? [tree] : []).forEach(walk);
  return found;
}

/** The three shipped languages every V0 screen test runs in. */
export const LOCALES: Locale[] = ['ko-KR', 'en-US', 'ja-JP'];

/**
 * Renders in one language with no fallback language, so a key missing from that language is recorded instead of silently
 * showing English, and with the system text size set to `fontScale` (200% = 2).
 */
export async function renderSweep(element: ReactElement, locale: Locale, fontScale = 1) {
  const instance = await createI18n({ deviceLocale: locale, storage, profileLocale: null });
  const missing: string[] = [];
  Object.assign(instance.options, { fallbackLng: false, saveMissing: true, missingKeyHandler: (_lngs: readonly string[], _ns: string, key: string) => { missing.push(`${locale} ${key}`); } });
  const before = Dimensions.get('window');
  Dimensions.set({ window: { ...before, width: 375, height: 812, scale: 3, fontScale }, screen: { ...Dimensions.get('screen'), fontScale } });
  const wrapper = ({ children }: { children: ReactNode }) => <SafeAreaProvider initialMetrics={safeMetrics}><I18nextProvider i18n={instance}>{children}</I18nextProvider></SafeAreaProvider>;
  const screen = await render(element, { wrapper });
  return { screen, missing, restore: () => Dimensions.set({ window: before, screen: Dimensions.get('screen') }), t: instance.t.bind(instance) as (key: string, options?: Record<string, unknown>) => string };
}
