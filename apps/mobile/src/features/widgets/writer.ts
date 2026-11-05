import type { i18n } from 'i18next';
import type { Locale } from '../../i18n';
import { serialQueue } from '../../lib/serialQueue';
import { buildWidgetSnapshot, type WidgetData } from './snapshot';

/** The native side: `write` replaces the shared JSON whole or not at all (temp file + rename, or one updateTimeline call). */
export type WidgetPort = { write(json: string): Promise<void>; reload(): Promise<void> };
type Target = { port: WidgetPort; translator: Pick<i18n, 'language' | 't'> };

/** Null on a build without the widget extension: nothing is computed or written, and every call below is a no-op. */
let target: Target | null = null;
/** Moves on every clear, so a sync started before it can never put the cleared data back. */
let generation = 0;
const queued = serialQueue();

export function installWidgets(next: Target | null) { target = next; }
export function widgetGeneration() { return generation; }
async function writeWidget(data: WidgetData) {
  if (!target) return;
  const { port, translator } = target;
  const snapshot = buildWidgetSnapshot({ ...data, locale: translator.language as Locale }, new Date().toISOString(), (key, vars) => translator.t(key, vars));
  await port.write(JSON.stringify(snapshot));
  await port.reload();
}
/** `generation` is the value of `widgetGeneration()` when the data was read. Callers debounce (see `useNotificationSync`). */
export function syncWidgets(data: WidgetData, opened: number) {
  return queued(async () => { if (opened === generation) await writeWidget(data); });
}
/** Runs after any write already in progress, so nothing of the space outlives logout, leaving or deletion. */
export function clearWidgets(state: 'none' | 'ended') {
  generation += 1;
  return queued(() => writeWidget({ state }));
}
