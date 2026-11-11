import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import type { WidgetTimelineEntry } from 'expo-widgets';
import type { i18n } from 'i18next';
import type { WidgetSnapshot } from './snapshot';
import { widgetProps, type WidgetKind, type WidgetProps } from './widgetProps';
import { installWidgets, type WidgetPort } from './writer';

type Timeline = { updateTimeline(entries: WidgetTimelineEntry<WidgetProps>[]): void; reload(): void };

/** The configured URL scheme; `aroom-dev` comes first on the variants that have both. */
export function appScheme(scheme: string | string[] | undefined) {
  return (Array.isArray(scheme) ? scheme[0] : scheme) ?? 'aroom';
}
export function timelineOf(snapshot: WidgetSnapshot, scheme: string, kind: WidgetKind): WidgetTimelineEntry<WidgetProps>[] {
  return snapshot.entries.map((entry) => ({ date: new Date(entry.showAt), props: widgetProps(snapshot, entry, scheme, kind) }));
}
/** Each `updateTimeline` replaces that widget's whole timeline in one defaults write, and reloads it. */
export function widgetPort(widgets: Record<WidgetKind, Timeline>, scheme: string): WidgetPort {
  const kinds = Object.keys(widgets) as WidgetKind[];
  return {
    write: async (json) => { const snapshot = JSON.parse(json) as WidgetSnapshot; for (const kind of kinds) widgets[kind].updateTimeline(timelineOf(snapshot, scheme, kind)); },
    reload: async () => { for (const kind of kinds) widgets[kind].reload(); },
  };
}
/** A build reports a widgets directory only when the extension's App Group is configured; every other build stays a no-op. */
export function installNativeWidgets(translator: i18n) {
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule<{ widgetsDirectory?: string | null }>('ExpoWidgets')?.widgetsDirectory) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded only here: creating a widget writes its layout to the App Group
    const { widgets } = require('./definitions') as typeof import('./definitions');
    installWidgets({ port: widgetPort(widgets, appScheme(Constants.expoConfig?.scheme)), translator });
  } catch {
    /* This runs before the first screen: a broken extension costs the widgets, never the app. */
  }
}
