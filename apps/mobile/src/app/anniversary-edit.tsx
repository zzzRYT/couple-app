import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AnniversaryEdit } from '../features/anniversaries/AnniversaryEdit';
import { notifyDefaultLabel } from '../features/notifications/labels';
import { getAnniversaryNotify, setAnniversaryNotify } from '../features/notifications/preferences';
import { useNotifyPrefs } from '../features/notifications/useNotifyPrefs';
import { useSpace } from '../features/space/SpaceContext';
import { useApp } from '../lib/AppContext';
import { todayIn } from '../lib/dday';
import { useNow } from '../lib/useNow';
import { track } from '../lib/analytics';
export default function AnniversaryEditRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const { t, i18n } = useTranslation(); const { state, refresh } = useSpace(); const { client, userId } = useApp(); const now = useNow(); const prefs = useNotifyPrefs(userId);
  const snapshot = state.snapshot; const initial = useRef(snapshot?.anniversaries.find((item) => item.id === id));
  const [notify, setNotify] = useState<'default' | 'off' | null>(id ? null : 'default');
  useEffect(() => { if (snapshot && id) void getAnniversaryNotify(snapshot.me.userId, id).then(setNotify).catch(() => setNotify('default')); }, [snapshot?.me.userId, id]);
  useEffect(() => { if (snapshot && id && !initial.current) router.back(); }, [snapshot, id]);
  if (!snapshot || !notify || (id && !initial.current)) return null;
  const partnerMember = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  const partner = partnerMember ? partnerMember.displayName ?? t('home.pending.partner') : null;
  const spaceId = snapshot.space.spaceId;
  return <AnniversaryEdit initial={initial.current} today={todayIn(now, snapshot.space.timeZone)} partner={partner} offline={state.offline} initialNotify={notify} notifyDefault={notifyDefaultLabel(prefs, i18n.language, t)} onClose={() => router.back()} onGone={() => { router.dismissTo('/(tabs)/anniversaries'); void refresh(); }} onSaved={(toast) => router.replace({ pathname: '/(tabs)/anniversaries', params: { toast } })}
    save={async (fields, version, key, choice) => { const editing = !!(id && version); const item = editing ? await client.updateAnniversaryItem(spaceId, id, fields, version, key) : await client.createAnniversary(spaceId, fields, key); if (!editing) track('anniversary_added'); await setAnniversaryNotify(snapshot.me.userId, item.id, choice); await refresh(); }}
    remove={async (version, key) => { if (id) { await client.deleteAnniversaryItem(spaceId, id, version, key); await refresh(); } }}
    reload={async () => { const latest = await client.snapshot(spaceId); await refresh(); return latest.anniversaries.find((item) => item.id === id); }} />;
}
