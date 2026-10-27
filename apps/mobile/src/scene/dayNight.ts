import type { RoomThemeDocument } from '../lib/client';
/** follow_time uses daytime 06:00-18:00 in the room time zone (assumed; the spec leaves the switch hours open). */
export function roomMode(theme: RoomThemeDocument, nowIso: string): 'day' | 'night' {
  if (theme.mode !== 'follow_time') return theme.mode;
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: theme.timeZone, hour: '2-digit', hourCycle: 'h23' }).format(new Date(nowIso)));
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}
