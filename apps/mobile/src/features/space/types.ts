import type { Snapshot } from '../../lib/client';
/** What screens read from the space sync hook: the last good snapshot survives errors and offline periods. */
export type SpaceState = { status: 'loading' | 'ready' | 'error'; snapshot: Snapshot | null; offline: boolean; lastSyncedAt: string | null };
