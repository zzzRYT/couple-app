import { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EventEdit } from '../features/calendar/EventEdit';
import { useSpace } from '../features/space/SpaceContext';
import { useApp } from '../lib/AppContext';
import { todayIn } from '../lib/dday';
import { useNow } from '../lib/useNow';
export default function EventEditRoute() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>(); const { t } = useTranslation(); const { state, refresh } = useSpace(); const { client } = useApp(); const now = useNow();
  const snapshot = state.snapshot; const initial = useRef(snapshot?.events.find((item) => item.id === id));
  useEffect(() => { if (snapshot && id && !initial.current) router.back(); }, [snapshot, id]);
  if (!snapshot || (id && !initial.current)) return null;
  const partnerMember = snapshot.members.find((member) => member.userId !== snapshot.me.userId);
  const spaceId = snapshot.space.spaceId;
  return <EventEdit initial={initial.current} date={date ?? todayIn(now, snapshot.space.timeZone)} me={snapshot.me.userId} meName={snapshot.me.displayName ?? t('cal.by.me')} partner={partnerMember ? partnerMember.displayName ?? t('home.pending.partner') : null} partnerId={partnerMember?.userId ?? null} timeZone={snapshot.space.timeZone} offline={state.offline}
    comments={snapshot.eventComments.filter((comment) => comment.eventId === id)}
    onClose={() => router.back()} onGone={() => { router.dismissTo('/(tabs)/calendar'); void refresh(); }} onSaved={(toast, day) => router.replace({ pathname: '/(tabs)/calendar', params: { toast, date: day } })}
    save={async (fields, version, key) => { if (id && version) await client.updateEvent(spaceId, id, fields, version, key); else await client.createEvent(spaceId, fields, key); await refresh(); }}
    remove={async (version, key) => { if (id) { await client.deleteEvent(spaceId, id, version, key); await refresh(); } }}
    addComment={async (body, key) => { if (id) { await client.createEventComment(spaceId, id, body, key); await refresh(); } }}
    // Refresh after a failed delete too: NOT_FOUND means the comment is already gone and the list should drop it.
    removeComment={async (commentId, key) => { if (id) { try { await client.deleteEventComment(spaceId, id, commentId, key); } finally { await refresh(); } } }}
    reload={async () => { const latest = await client.snapshot(spaceId); await refresh(); return latest.events.find((item) => item.id === id); }} />;
}
