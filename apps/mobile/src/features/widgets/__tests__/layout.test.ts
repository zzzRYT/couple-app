import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as swiftUi from '@expo/ui/swift-ui';
import * as modifiers from '@expo/ui/swift-ui/modifiers';
import { i18nFor } from '../../../test/render';
import { widgetLayout } from '../layout';
import { buildWidgetSnapshot, type WidgetData } from '../snapshot';
import { WIDGET_PLACEHOLDER, widgetProps, type WidgetProps } from '../widgetProps';

type Node = { type: unknown; props: Record<string, unknown> & { children?: unknown; modifiers?: { $type: string; [key: string]: unknown }[]; assetName?: string; destination?: string } };
const FAMILIES = ['systemSmall', 'systemMedium', 'systemLarge', 'accessoryCircular', 'accessoryRectangular', 'accessoryInline'] as const;
const LOCK = FAMILIES.slice(3);
const MODES = [['light', 'fullColor'], ['dark', 'fullColor'], ['light', 'accented'], ['dark', 'vibrant']] as const;
const CUSTOM = '22222222-2222-4222-8222-222222222222';
const dates = { startDate: '2025-06-29', timeZone: 'Asia/Seoul', me: { birthday: { month: 3, day: 14 } }, partner: { birthday: { month: 8, day: 2 }, displayName: '하루' }, customs: [] };
const normal: WidgetData = { state: 'normal', spaceId: '11111111-1111-4111-8111-111111111111', names: { me: '도담', partner: '하루' }, dates };
const pending: WidgetData = { state: 'pending', spaceId: '11111111-1111-4111-8111-111111111111', names: { me: '도담', partner: null }, dates: { ...dates, partner: null } };

/** Runs the layout the way the extension does: from its source text, with nothing in scope but the runtime's globals. */
function evaluate(props: WidgetProps, env: Record<string, unknown>): Node {
  const element = (type: unknown, config: Record<string, unknown>) => ({ type, props: config });
  const globals: Record<string, unknown> = { ...swiftUi, ...modifiers, _jsx: element, _jsxs: element, _Fragment: 'Fragment' };
  const names = Object.keys(globals).filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
  const layout = new Function(...names, `return (${widgetLayout as unknown as string});`)(...names.map((name) => globals[name])) as (p: WidgetProps, e: unknown) => Node;
  return resolveTree(layout(props, env)) as Node;
}
function resolveTree(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(resolveTree);
  const element = node as Node | null;
  if (!element || typeof element !== 'object' || !('type' in element)) return node;
  return { ...element, props: { ...element.props, children: resolveTree(element.props.children) } };
}
function walk(node: unknown, visit: (node: Node) => void) {
  if (Array.isArray(node)) { node.forEach((child) => walk(child, visit)); return; }
  const element = node as Node | null;
  if (!element || typeof element !== 'object' || !('type' in element)) return;
  visit(element);
  walk(element.props.children, visit);
}
const collect = (root: Node) => {
  const texts: string[] = [], assets: string[] = [], links: string[] = [], fills: unknown[] = [];
  const mods: Node['props']['modifiers'] = [];
  walk(root, (node) => {
    if (typeof node.props.children === 'string') texts.push(node.props.children);
    if (node.props.assetName) assets.push(node.props.assetName);
    if (node.props.destination) links.push(node.props.destination);
    for (const modifier of node.props.modifiers ?? []) { mods.push(modifier); if (modifier.$type === 'foregroundStyle') fills.push((modifier.style as { color?: string }).color); }
  });
  return { texts, assets, links, mods, fills };
};
const propsOf = async (data: WidgetData, now = '2026-11-02T03:00:00.000Z', locale: 'ko-KR' | 'ja-JP' = 'ko-KR') => {
  const i18n = await i18nFor(locale);
  const snapshot = buildWidgetSnapshot({ ...data, locale }, now, (key, vars) => i18n.t(key, vars));
  return widgetProps(snapshot, snapshot.entries[0]!, 'aroom-dev');
};
const hasModifier = (root: Node, type: string, key: string, value: unknown) => collect(root).mods!.some((modifier) => modifier.$type === type && modifier[key] === value);

describe('widgetLayout', () => {
  const states: [string, () => Promise<WidgetProps>][] = [
    ['placeholder', async () => WIDGET_PLACEHOLDER], ['normal', () => propsOf(normal)], ['today', () => propsOf(normal, '2026-11-11T03:00:00.000Z')], ['pending', () => propsOf(pending)],
    ['none', () => propsOf({ state: 'none' })], ['ended', () => propsOf({ state: 'ended' })], ['japanese', () => propsOf(normal, undefined, 'ja-JP')],
  ];
  it.each(states)('V0-F11-AC-03 draws %s for every family and appearance from bundled assets only', async (_, props) => {
    const value = await props();
    for (const widgetFamily of FAMILIES) for (const [colorScheme, widgetRenderingMode] of MODES) {
      const { assets } = collect(evaluate(value, { widgetFamily, colorScheme, widgetRenderingMode }));
      for (const asset of assets) expect([`assets/widgets/icons/${asset}.svg`, `assets/widgets/${asset}.svg`, `assets/widgets/${asset}@2x.png`].some((path) => existsSync(resolve(__dirname, '../../../..', path)))).toBe(true);
    }
  });
  it.each(LOCK)('V0-F11-AC-07 %s never shows a name', async (widgetFamily) => {
    for (const data of [normal, pending]) {
      const { texts } = collect(evaluate(await propsOf(data), { widgetFamily, widgetRenderingMode: 'vibrant' }));
      expect(texts.join(' ')).not.toMatch(/도담|하루/);
    }
  });
  it.each(['accessoryRectangular', 'accessoryInline'] as const)('V0-F11-AC-07 %s hides a custom title on a locked phone', async (widgetFamily) => {
    const custom = { id: CUSTOM, title: '우리만의 날', date: '2026-11-05', repeat: 'none', version: 1 };
    const secret = evaluate(await propsOf({ ...normal, dates: { ...dates, customs: [custom] } } as WidgetData), { widgetFamily, widgetRenderingMode: 'vibrant' });
    expect(hasModifier(secret, 'privacySensitive', 'sensitive', true)).toBe(true);
    const plain = evaluate(await propsOf(normal), { widgetFamily, widgetRenderingMode: 'vibrant' });
    expect(hasModifier(plain, 'privacySensitive', 'sensitive', true)).toBe(false);
  });
  it('V0-F11-AC-08 small and lock open home as a whole, medium and large link each row', async () => {
    const props = await propsOf(normal);
    for (const widgetFamily of ['systemSmall', ...LOCK]) {
      const root = evaluate(props, { widgetFamily, widgetRenderingMode: 'fullColor' });
      expect(collect(root).links).toEqual([]);
      expect(hasModifier(root, 'widgetURL', 'url', 'aroom-dev://home')).toBe(true);
    }
    expect(collect(evaluate(props, { widgetFamily: 'systemMedium', widgetRenderingMode: 'fullColor' })).links).toHaveLength(3);
    const large = evaluate(props, { widgetFamily: 'systemLarge', widgetRenderingMode: 'fullColor' });
    expect(collect(large).links).toHaveLength(5);
    expect(collect(large).links[0]).toBe('aroom-dev://anniversary/season%3Apepero%3A2026');
    expect(hasModifier(large, 'widgetURL', 'url', 'aroom-dev://home')).toBe(true);
  });
  it('V0-F11-AC-08 a signed-out widget opens the start of the app', async () => {
    expect(hasModifier(evaluate(await propsOf({ state: 'none' }), { widgetFamily: 'systemSmall' }), 'widgetURL', 'url', 'aroom-dev://')).toBe(true);
  });
  it('V0-F11-AC-03 tinted and clear drop the tiles and the mascot', async () => {
    const props = await propsOf(normal);
    const full = collect(evaluate(props, { widgetFamily: 'systemLarge', widgetRenderingMode: 'fullColor', colorScheme: 'light' }));
    const tinted = collect(evaluate(props, { widgetFamily: 'systemLarge', widgetRenderingMode: 'accented', colorScheme: 'light' }));
    expect(full.assets).toContain('mascot_wave');
    expect(tinted.assets).not.toContain('mascot_wave');
    expect(full.fills).toContain('#AACBE2');
    expect(tinted.fills).not.toContain('#AACBE2');
  });
  it('V0-F11-AC-03 the dark background is the dark page color', async () => {
    const root = evaluate(await propsOf(normal), { widgetFamily: 'systemSmall', widgetRenderingMode: 'fullColor', colorScheme: 'dark' });
    expect(collect(root).mods!.find((modifier) => modifier.$type === 'containerBackground')).toMatchObject({ style: { color: '#2B2320' }, container: 'widget' });
  });
  it('V0-F11-AC-03 medium keeps three rows on the day itself', async () => {
    const { texts, links } = collect(evaluate(await propsOf(normal, '2026-11-11T03:00:00.000Z'), { widgetFamily: 'systemMedium', widgetRenderingMode: 'fullColor' }));
    expect(texts).toContain('오늘은 빼빼로데이');
    expect(links).toHaveLength(3);
  });
});
