import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Snapshot } from '../../lib/client';
import { useOptionalSpace } from './SpaceContext';

/** One person as every screen shows them. `userId: null` is a partner who has not joined yet. */
export type Profile = { userId: string | null; name: string; photo: string | null };
export type Profiles = { me: Profile; partner: Profile };

const PHOTO_REUSE_MS = 60 * 60 * 1000;
// shortcut: never evicts a replaced photo's entry and assumes signed URLs outlive the hour (they last six); add eviction or a server photo version if either stops holding.
const photoUrls = new Map<string, { url: string; at: number }>();
/** Signed URLs change on every snapshot fetch, which reloads (and flickers) every Image; the same object keeps its first URL for an hour. */
export function stablePhoto(url: string | null | undefined, now = Date.now()): string | null {
  if (!url) return null;
  const key = url.split('?')[0]!; const kept = photoUrls.get(key);
  if (kept && now - kept.at < PHOTO_REUSE_MS) return kept.url;
  photoUrls.set(key, { url, at: now });
  return url;
}

export function profilesOf(snapshot: Pick<Snapshot, 'me' | 'members'>, t: (key: string) => string): Profiles {
  const partner = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  return {
    me: { userId: snapshot.me.userId, name: snapshot.me.displayName ?? '', photo: stablePhoto(snapshot.me.photo) },
    partner: { userId: partner?.userId ?? null, name: partner?.displayName ?? t('home.pending.partner'), photo: stablePhoto(partner?.photo) },
  };
}

/** The current space's profiles, or null before a snapshot (or without a SpaceProvider). */
export function useProfiles(): Profiles | null {
  const snapshot = useOptionalSpace()?.state.snapshot; const { t } = useTranslation();
  return useMemo(() => (snapshot ? profilesOf(snapshot, t) : null), [snapshot, t]);
}
