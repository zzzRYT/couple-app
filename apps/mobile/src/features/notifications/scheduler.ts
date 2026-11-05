import * as Notifications from 'expo-notifications';
import type { AnniversaryInput } from '../../lib/anniversaries';
import { serialQueue } from '../../lib/serialQueue';
import { notificationPermission } from './permissions';
import { planNotifications, type PlannedNotification } from './plan';
import { readNotifyPrefs } from './preferences';

const isV0 = (identifier: string) => identifier.startsWith('v0:');
/** One at a time: a cancel on logout must land after any sync already running, or that sync would re-add what it removed. */
const queued = serialQueue();
async function applyPlan(plan: PlannedNotification[]) {
  const wanted = new Map(plan.map((item) => [item.id, item]));
  const scheduled = new Set<string>();
  for (const { identifier, content } of await Notifications.getAllScheduledNotificationsAsync()) {
    if (!isV0(identifier)) continue;
    const item = wanted.get(identifier);
    // The copy counts too: a language or partner-name change keeps the id and the time but must rewrite the text.
    if (item && content.data?.fireAt === item.fireAt && content.title === item.title && content.body === item.body) scheduled.add(identifier);
    else await Notifications.cancelScheduledNotificationAsync(identifier);
  }
  for (const item of plan) {
    if (scheduled.has(item.id)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: { title: item.title, body: item.body, data: { ...item.data, fireAt: item.fireAt }, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.fireAt) },
    });
  }
}
async function cancelV0() {
  for (const { identifier } of await Notifications.getAllScheduledNotificationsAsync()) {
    if (isV0(identifier)) await Notifications.cancelScheduledNotificationAsync(identifier);
  }
}
export function syncNotifications(plan: PlannedNotification[]) { return queued(() => applyPlan(plan)); }
export function cancelV0Notifications() { return queued(cancelV0); }
/** For account deletion, which clears everything this app ever scheduled. */
export function cancelAllNotifications() { return queued(() => Notifications.cancelAllScheduledNotificationsAsync()); }
/** Brings this device's schedule in line with the data, preferences and language as they are right now. */
export function resyncNotifications(userId: string, input: AnniversaryInput, t: (key: string, vars?: Record<string, unknown>) => string, nowIso: string) {
  return queued(async () => {
    const prefs = await readNotifyPrefs(userId);
    if (!prefs.enabled) return cancelV0();
    if (await notificationPermission() !== 'granted') return;
    await applyPlan(planNotifications(input, prefs, t, nowIso));
  });
}
