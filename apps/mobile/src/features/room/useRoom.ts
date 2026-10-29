import { useCallback } from 'react';
import type { Snapshot } from '../../lib/client';
import type { SpaceState } from '../space/types';
import { ApiError } from '../../lib/errors';
import { isNetworkError } from '../../lib/realtime';
type RoomClient = { snapshot(spaceId: string): Promise<Snapshot>; mascotRecall(spaceId: string, expectedVersion: number): Promise<unknown> };
export type RecallResult = 'ok' | 'offline' | string;
/** Room version sync. Offline the last confirmed room stays read-only; edits, AI and confirm requests are never queued for later. */
export function useRoom(spaceId: string | null, { client }: { client: RoomClient }, { state, refresh }: { state: SpaceState; refresh: () => Promise<void> }) {
  const snapshot = state.snapshot;
  const readOnly = state.offline || !snapshot;
  const hasMascot = !!snapshot?.sceneDocument.objects.some((node) => node.assetId === 'app_mascot');
  const occupied = !!snapshot?.promptSession && snapshot.promptSession.status === 'occupied' && Date.parse(snapshot.promptSession.expiresAt) > Date.now();
  const recall = useCallback(async (): Promise<RecallResult> => {
    if (!spaceId || !snapshot || state.offline) return 'offline';
    try { await client.mascotRecall(spaceId, snapshot.versionNumber); await refresh(); return 'ok'; } catch (error) {
      if (isNetworkError(error)) return 'offline';
      await refresh();
      return error instanceof ApiError ? error.code : 'SERVER_ERROR';
    }
  }, [client, spaceId, snapshot, state.offline, refresh]);
  return { state, snapshot, readOnly, hasMascot, occupied, recall, refresh };
}
