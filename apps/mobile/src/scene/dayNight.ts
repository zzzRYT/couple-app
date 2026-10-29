import type { RoomThemeDocument } from '../lib/client';
import { roomVariant } from '../features/settings/followTime';
/** The room renderer and settings preview use the same shared 06:00-18:00 room-local rule. */
export function roomMode(theme: RoomThemeDocument, nowIso: string): 'day' | 'night' {
  return roomVariant(theme.mode, nowIso, theme.timeZone);
}
