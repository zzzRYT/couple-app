export type RoomMode = 'day' | 'night' | 'follow_time';
export type RoomVariant = 'day' | 'night';

/** Resolves automatic room lighting using the shared space zone and a half-open [06:00, 18:00) day. */
export function roomVariant(mode: RoomMode, now: string | Date, timeZone: string): RoomVariant {
  if (mode === 'day' || mode === 'night') return mode;
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(new Date(now)));
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}
