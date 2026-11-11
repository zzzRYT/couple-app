import { AccessoryWidgetBackground, Gauge, HStack, Image, Link, Rectangle, RoundedRectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { accessibilityElement, accessibilityLabel, background, containerBackground, font, foregroundStyle, frame, gaugeStyle, layoutPriority, lineLimit, minimumScaleFactor, offset, padding, privacySensitive, resizable, shapes, truncationMode, widgetAccentedRenderingMode, widgetURL, type ModifierConfig } from '@expo/ui/swift-ui/modifiers';
import type { WidgetEnvironment } from 'expo-widgets';
import type { WidgetProps, WidgetRow } from './widgetProps';

type Asset = 'heart' | 'heart_fill' | 'medal' | 'cake' | 'pepero' | 'tree' | 'star' | 'sparkle' | 'sparkle_art' | 'clock' | 'link_off' | 'mascot_wave';
type Modifiers = ModifierConfig[];
type Tiled = { icon: WidgetRow['icon']; tile: string };

/**
 * One view of one timeline entry, chosen by family and state. The babel plugin turns this function into a string that runs in the
 * extension's own JS runtime, so everything it uses lives inside it: no imports reach it except the Expo UI globals, and only syntax
 * that compiles without a helper works (no object or array spread).
 */
export function widgetLayout(props: WidgetProps, env: WidgetEnvironment) {
  'widget';
  const family = env.widgetFamily ?? 'systemSmall';
  const dark = env.colorScheme === 'dark';
  /** Tinted, clear and lock: the system repaints in one tone, so tiles and the mascot go and only white and its opacities stay. */
  const mono = env.widgetRenderingMode === 'accented' || env.widgetRenderingMode === 'vibrant';
  const ink = '#4A3426';
  const color = mono
    ? { bg: '#00000000', text: '#FFFFFF', text2: '#FFFFFFD1', primary: '#FFFFFF', divider: '#FFFFFF59', skeleton: '#FFFFFF4D' }
    : dark
      ? { bg: '#2B2320', text: '#F7EBDD', text2: '#CDB8A5', primary: '#F0A67F', divider: '#4A3D36', skeleton: '#F7EBDD29' }
      : { bg: '#FFF8EC', text: '#3F2D22', text2: '#6B5444', primary: '#B24A24', divider: '#E3CDB0', skeleton: '#3F2D2229' };
  const ja = props.state !== 'placeholder' && props.ja;
  /** The list kind trades the D+N column for the next anniversary: its own small, a gauge circular and list-only rows. */
  const list = 'kind' in props && props.kind === 'list';
  const fonts = {
    display: ja ? 'Yomogi-Regular' : 'Gaegu-Bold',
    bold: ja ? 'ZenMaruGothic-Bold' : 'NotoSansKR-Bold',
    medium: ja ? 'NotoSansJP-Regular' : 'NotoSansKR-Regular',
    body: ja ? 'NotoSansJP-Regular' : 'GowunDodum-Regular',
  };

  const label = (value: string, family_: string, size: number, tone: string, extra?: Modifiers) => <Text modifiers={[font({ family: family_, size }), foregroundStyle(tone), lineLimit(1), truncationMode('tail'), frame({ height: size * 1.25 })].concat(extra ?? [])}>{value}</Text>;
  const wrapped = (value: string, family_: string, size: number, tone: string) => <Text modifiers={[font({ family: family_, size }), foregroundStyle(tone), lineLimit(3)]}>{value}</Text>;
  const big = (value: string, size: number, tone: string) => label(value, fonts.display, size, tone, [minimumScaleFactor(0.6)]);
  const image = (name: Asset, size: number, tone?: string, extra?: Modifiers) => <Image assetName={name} modifiers={[resizable(), frame({ width: size, height: size })].concat(tone ? [foregroundStyle(tone)] : []).concat(extra ?? [])} />;
  /** The heart is the only drawing in the accent group; expo-widgets has no widgetAccentable for text. */
  const heart = (size: number) => image('heart_fill', size, color.primary, [widgetAccentedRenderingMode('accented')]);
  const names = (value: string, size: number) => <HStack spacing={4}>{heart(size)}{label(value, fonts.bold, size, color.text)}</HStack>;
  const rule = (extra?: Modifiers) => <Rectangle modifiers={[foregroundStyle(color.divider), frame({ height: 1 })].concat(extra ?? [])} />;
  const bar = (width: number, height: number) => <RoundedRectangle cornerRadius={Math.floor(height / 2)} modifiers={[foregroundStyle(color.skeleton), frame({ width, height })]} />;
  const kindTile = (item: Tiled, size: number, iconSize: number, monoSize: number) => {
    if (mono) return <ZStack modifiers={[frame({ width: size, height: size })]}>{image(item.icon, monoSize, color.text)}</ZStack>;
    const radius = size * 0.32;
    return <ZStack modifiers={[frame({ width: size, height: size })]}>
      <RoundedRectangle cornerRadius={radius} modifiers={[foregroundStyle(ink)]} />
      <RoundedRectangle cornerRadius={radius - 1.5} modifiers={[foregroundStyle(item.tile), frame({ width: size - 3, height: size - 3 })]} />
      {image(item.icon, iconSize, ink)}
    </ZStack>;
  };
  const mascot = (size: number, x: number, y: number) => (mono ? null : <Image assetName="mascot_wave" modifiers={[resizable(), frame({ width: size, height: size * 0.88 }), offset({ x, y }), accessibilityElement('ignore')]} />);
  const root = (url: string, a11y: string, inset: number, content: React.ReactNode) => <VStack alignment="leading" spacing={0} modifiers={[padding({ all: inset }), frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }), containerBackground(color.bg, 'widget'), widgetURL(url), accessibilityElement('ignore'), accessibilityLabel(a11y)]}>{content}</VStack>;

  if (props.state === 'placeholder') {
    const rowBars = (count: number, height: number) => Array.from({ length: count }, (_, row) => <RoundedRectangle key={row} cornerRadius={height / 2} modifiers={[foregroundStyle(color.skeleton), frame({ height })]} />);
    const shell = (inset: number, content: React.ReactNode) => <VStack alignment="leading" spacing={0} modifiers={[padding({ all: inset }), frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }), containerBackground(color.bg, 'widget')]}>{content}</VStack>;
    switch (family) {
      case 'accessoryCircular': return <ZStack modifiers={[containerBackground(color.bg, 'widget')]}><AccessoryWidgetBackground /><VStack spacing={6}>{bar(40, 10)}{bar(28, 8)}</VStack></ZStack>;
      case 'accessoryRectangular': return shell(4, <VStack alignment="leading" spacing={6}>{bar(80, 12)}{bar(128, 10)}{bar(104, 10)}</VStack>);
      case 'accessoryInline': return <HStack>{heart(13)}</HStack>;
      case 'systemLarge':
        if (list) return shell(18, <VStack alignment="leading" spacing={26}>{bar(105, 9)}{rowBars(6, 14)}</VStack>);
        return shell(18, <VStack alignment="leading" spacing={12}>{bar(120, 10)}{bar(180, 40)}{bar(150, 9)}<Spacer modifiers={[frame({ height: 14 })]} />{bar(105, 9)}{rowBars(5, 14)}</VStack>);
      case 'systemMedium':
        if (list) return shell(14, <VStack alignment="leading" spacing={22}>{bar(100, 9)}{rowBars(3, 12)}</VStack>);
        return shell(14, <HStack spacing={14} alignment="top">
        <VStack alignment="leading" spacing={10} modifiers={[frame({ width: 128 })]}>{bar(102, 10)}{bar(64, 8)}{bar(115, 30)}{bar(77, 8)}</VStack>
        <VStack alignment="leading" spacing={14} modifiers={[padding({ top: 4 })]}>{bar(100, 9)}{rowBars(3, 12)}</VStack>
      </HStack>);
      default: return shell(14, <VStack alignment="leading" spacing={8}>{bar(91, 10)}{bar(52, 8)}<Spacer />{bar(104, 30)}<Spacer />{bar(117, 10)}</VStack>);
    }
  }

  if (props.state === 'none' || props.state === 'ended') {
    const none = props.state === 'none';
    switch (family) {
      case 'accessoryCircular': return <ZStack modifiers={[containerBackground(color.bg, 'widget'), widgetURL(props.url), accessibilityElement('ignore'), accessibilityLabel(props.a11y)]}><AccessoryWidgetBackground />{image(none ? 'heart' : 'link_off', 24, color.text)}</ZStack>;
      case 'accessoryRectangular': return root(props.url, props.a11y, 4, <VStack alignment="leading" spacing={2}>{label(props.title, fonts.bold, 15, color.text)}{label(props.body, fonts.medium, 13, color.text2)}</VStack>);
      case 'accessoryInline': return <HStack spacing={5} modifiers={[widgetURL(props.url), containerBackground(color.bg, 'widget')]}>{heart(13)}{label(props.title, fonts.bold, 15, color.text)}</HStack>;
      default: return root(props.url, props.a11y, family === 'systemLarge' ? 18 : 14, <>
        {none ? image('heart', 26, color.primary) : image('link_off', 24, color.text2)}
        <Spacer />
        {wrapped(props.title, fonts.bold, 15, color.text)}
        {wrapped(props.body, fonts.body, 11, color.text2)}
      </>);
    }
  }

  const { rows, today } = props;
  const next = rows[0];
  const pending = props.state === 'pending';
  const dayRow = (size: number, tone: string) => label(props.day, fonts.bold, size, tone);
  const leftText = (value: string, size: number) => label(value, fonts.bold, size, color.primary, [layoutPriority(1)]);
  const todayPill = (size: number) => <Link destination={props.url}><HStack spacing={6} modifiers={[padding({ vertical: 5, horizontal: 8 }), background(color.divider, shapes.roundedRectangle({ cornerRadius: 10 }))]}>{image('sparkle', 16, color.primary)}{label(today!.line, fonts.bold, size, color.text)}<Spacer /></HStack></Link>;
  const mediumRow = (row: WidgetRow) => <Link key={row.url} destination={row.url}><HStack spacing={7}>{kindTile(row, 22, 12, 20)}{label(row.title, fonts.medium, 13, color.text, [frame({ maxWidth: Infinity, alignment: 'leading' })])}{leftText(row.left, 13)}</HStack></Link>;
  const largeRow = (row: WidgetRow) => <Link key={row.url} destination={row.url}><HStack spacing={9}>{kindTile(row, 26, 14, 24)}<VStack alignment="leading" spacing={0}>{label(row.title, fonts.bold, 14, color.text)}{label(row.date, fonts.body, 11, color.text2)}</VStack><Spacer />{leftText(row.left, 14)}</HStack></Link>;
  const upcoming = (size: number, spacing: number, count: number) => <VStack alignment="leading" spacing={spacing}>{label(props.listTitle, fonts.bold, size, color.text2)}{today ? todayPill(size + 2) : null}{rows.slice(0, today ? count - 1 : count).map(largeRow)}</VStack>;

  switch (family) {
    case 'accessoryCircular':
      // The widget renderer drops a Gauge's label slots, so the icon and D-n sit over the ring instead of in currentValueLabel.
      if (list && next && !today) return <ZStack modifiers={[containerBackground(color.bg, 'widget'), widgetURL(props.url), accessibilityElement('ignore'), accessibilityLabel(props.a11y)]}>
        <Gauge value={props.gauge} modifiers={[gaugeStyle('circularCapacity')]} />
        <VStack spacing={1}>{image(next.icon, 13, color.text)}{label(next.left, fonts.bold, 17, color.text, [minimumScaleFactor(0.5)])}</VStack>
      </ZStack>;
      return <ZStack modifiers={[containerBackground(color.bg, 'widget'), widgetURL(props.url), accessibilityElement('ignore'), accessibilityLabel(props.a11y)]}>
        <AccessoryWidgetBackground />
        {today
          ? <VStack spacing={2}>{image('sparkle', 18, color.text)}{label(props.todayWord, fonts.bold, 15, color.text)}</VStack>
          : <VStack spacing={0}>
            {heart(11)}
            {ja ? null : label(props.lockDays, fonts.bold, 10, color.text2)}
            {label(String(props.dayCount), fonts.bold, 22, color.text, [minimumScaleFactor(0.6)])}
            {ja ? label(props.lockDays, fonts.bold, 10, color.text2) : null}
          </VStack>}
      </ZStack>;
    case 'accessoryRectangular':
      if (today) return root(props.url, props.a11y, 4, <VStack alignment="leading" spacing={2}><HStack spacing={4}>{image('sparkle', 14, color.text)}{label(today.line, fonts.bold, 15, color.text, [privacySensitive(today.hideWhenLocked)])}</HStack>{label(props.day, fonts.medium, 13, color.text2)}</VStack>);
      return root(props.url, props.a11y, 4, <VStack alignment="leading" spacing={2}>
        <HStack spacing={4}>{heart(13)}{label(props.day, fonts.bold, 16, color.text)}</HStack>
        {pending || !next
          ? label(props.pending, fonts.medium, 13, color.text2)
          : <>
            {label(next.title, fonts.medium, 13, color.text, [privacySensitive(next.hideWhenLocked)])}
            {label(`${next.left} · ${next.dateMd}`, fonts.medium, 13, color.text2)}
          </>}
      </VStack>);
    case 'accessoryInline': {
      const text = today ? today.line : pending || !next ? `${props.day} · ${props.pending}` : `${props.day} · ${next.title} ${next.left}`;
      const hide = today ? today.hideWhenLocked : !pending && !!next?.hideWhenLocked;
      return <HStack spacing={5} modifiers={[containerBackground(color.bg, 'widget'), widgetURL(props.url)]}>{heart(13)}{label(text, fonts.bold, 15, color.text, [privacySensitive(hide)])}</HStack>;
    }
    case 'systemMedium':
      if (list) return root(props.url, props.a11y, 14, upcoming(11, 6, 3));
      return root(props.url, props.a11y, 14, <HStack spacing={2} alignment="top" modifiers={[frame({ maxHeight: Infinity })]}>
        <VStack alignment="leading" spacing={0} modifiers={[frame({ width: 128, alignment: 'leading' }), frame({ maxHeight: Infinity })]}>
          {names(props.names, 12)}
          <Spacer />
          {label(props.together, fonts.medium, 11, color.text2)}
          {big(props.day, ja ? 30 : 36, color.text)}
          <Spacer />
          {pending
            ? <HStack spacing={4}>{image('clock', 13, color.primary)}{label(props.pending, fonts.bold, 11, color.primary)}</HStack>
            : label(props.since, fonts.body, 11, color.text2)}
        </VStack>
        <Rectangle modifiers={[foregroundStyle(color.divider), frame({ width: 1 })]} />
        <VStack alignment="leading" spacing={9} modifiers={[padding({ leading: 12 }), frame({ maxWidth: Infinity, alignment: 'leading' })]}>
          {label(props.listTitle, fonts.bold, 11, color.text2)}
          {today ? todayPill(13) : null}
          {rows.slice(0, today ? 2 : 3).map(mediumRow)}
        </VStack>
      </HStack>);
    case 'systemLarge':
      if (list) return root(props.url, props.a11y, 18, upcoming(12, 10, 6));
      return root(props.url, props.a11y, 18, <>
        <HStack spacing={8} alignment="top">
          <VStack alignment="leading" spacing={0}>
            {names(props.names, 13)}
            {big(props.day, ja ? 36 : 46, color.text)}
            {pending
              ? <HStack spacing={4}>{image('clock', 13, color.primary)}{label(props.pending, fonts.bold, 12, color.primary)}</HStack>
              : label(props.sinceLong, fonts.body, 12, color.text2)}
          </VStack>
          <Spacer />
          {mascot(96, 6, -6)}
        </HStack>
        {rule([padding({ top: 12, bottom: 10 })])}
        {label(props.listTitle, fonts.bold, 12, color.text2, [padding({ bottom: 6 })])}
        <VStack alignment="leading" spacing={6}>
          {today ? todayPill(14) : null}
          {rows.slice(0, today ? 4 : 5).map(largeRow)}
        </VStack>
      </>);
    default:
      if (today) return root(props.url, props.a11y, 14, <>
        <HStack alignment="top">{kindTile(today, 30, 16, 26)}<Spacer />{image(mono ? 'sparkle' : 'sparkle_art', 22, mono ? color.text : undefined)}</HStack>
        <Spacer />
        <VStack alignment="leading" spacing={2}>
          {props.today?.prefix.trim() ? label(today.prefix.trim(), fonts.medium, 12, color.text2) : null}
          {label(today.title, fonts.display, 19, color.text, [minimumScaleFactor(0.7)])}
          {dayRow(13, color.primary)}
        </VStack>
      </>);
      if (list && next) return root(props.url, props.a11y, 14, <>
        {label(props.nextWord, fonts.medium, 11, color.text2)}
        {label(next.title, fonts.bold, 16, color.text)}
        <Spacer />
        {big(next.left, ja ? 34 : 40, color.primary)}
        <Spacer />
        <HStack spacing={6}>{label(next.date, fonts.body, 11, color.text2)}<Spacer />{label(props.day, fonts.bold, 11, color.text)}</HStack>
      </>);
      if (pending) return root(props.url, props.a11y, 14, <>
        {label(props.together, fonts.medium, 11, color.text2)}
        {big(props.day, ja ? 26 : 32, color.text)}
        <Spacer />
        <HStack spacing={5}>{image('clock', 14, color.primary)}{label(props.pending, fonts.bold, 12, color.primary)}</HStack>
        {wrapped(props.pendingBody, fonts.body, 11, color.text2)}
      </>);
      return root(props.url, props.a11y, 14, <>
        {names(props.names, 12)}
        <Spacer />
        {label(props.together, fonts.medium, 11, color.text2)}
        {big(props.day, ja ? 32 : 38, color.text)}
        <Spacer />
        {rule([padding({ bottom: 7 })])}
        {next ? <HStack spacing={6}>{image(next.icon, 14, color.primary)}{label(next.title, fonts.bold, 12, color.text, [frame({ maxWidth: Infinity, alignment: 'leading' })])}{leftText(next.left, 12)}</HStack> : null}
      </>);
  }
}
