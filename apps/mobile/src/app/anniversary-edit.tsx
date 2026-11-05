import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AnniversaryEdit } from '../features/anniversaries/AnniversaryEdit';
import { getAnniversaryNotify, setAnniversaryNotify } from '../features/notifications/preferences';
import { useSpace } from '../features/space/SpaceContext';
import { useApp } from '../lib/AppContext';
import { todayIn } from '../lib/dday';
import { useNow } from '../lib/useNow';
export default function AnniversaryEditRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const { t } = useTranslation(); const { state, refresh } = useSpace(); const { client } = useApp(); const now = useNow();
  const snapshot = state.snapshot; const initial = useRef(snapshot?.anniversaries.find((item) => item.id === id));
  const [notify, setNotify] = useState<'default' | 'off' | null>(id ? null : 'default');
  useEffect(() => { if (snapshot && id) void getAnniversaryNotify(snapshot.me.userId, id).then(setNotify).catch(() => setNotify('default')); }, [snapshot?.me.userId, id]);
  useEffect(() => { if (snapshot && id && !initial.current) router.back(); }, [snapshot, id]);
  if (!snapshot || !notify || (id && !initial.current)) return null;
  const partner = snapshot.members.find((member) => member.userId !== snapshot.me.userId)?.displayName ?? t('home.pending.partner');
  const spaceId = snapshot.space.spaceId;
  return <AnniversaryEdit initial={initial.current} today={todayIn(now, snapshot.space.timeZone)} partner={partner} offline={state.offline} initialNotify={notify} onClose={() => router.back()} onSaved={(toast) => router.replace({ pathname: '/(tabs)/anniversaries', params: { toast } })}
    save={async (fields, version, key, choice) => { const item = id && version ? await client.updateAnniversaryItem(spaceId, id, fields, version, key) : await client.createAnniversary(spaceId, fields, key); await setAnniversaryNotify(snapshot.me.userId, item.id, choice); await refresh(); }}
    remove={async (version, key) => { if (id) { await client.deleteAnniversaryItem(spaceId, id, version, key); await refresh(); } }}
    reload={async () => { const latest = await client.snapshot(spaceId); await refresh(); return latest.anniversaries.find((item) => item.id === id); }} />;
}
