import * as Notifications from 'expo-notifications';

export type NotifyPermission = 'granted' | 'denied' | 'undetermined';
export async function notificationPermission(): Promise<NotifyPermission> {
  const { granted, status } = await Notifications.getPermissionsAsync();
  return granted ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}
/** Shows the iOS prompt the first time; afterwards iOS answers with the stored choice and shows nothing. */
export async function requestNotificationPermission(): Promise<boolean> {
  return (await Notifications.requestPermissionsAsync()).granted;
}
