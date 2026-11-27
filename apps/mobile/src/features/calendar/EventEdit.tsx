import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CalendarEvent, EventAlert, EventComment, EventFields } from '../../lib/client';
import { todayIn } from '../../lib/dday';
import { ApiError } from '../../lib/errors';
import { tokens } from '../../theme/tokens';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText, BottomSheet, Button, IconButton, ListRow, RadioRow, SwitchRow, TextField, Toast } from '../../ui/components';
import { DateWheelSheet, fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { Icon } from '../../ui/Icon';
import { useLargeText } from '../../ui/textScale';
import { formattedDate, formattedMonthDay } from '../anniversaries/format';
import { graphemeLength } from '../anniversaries/AnniversaryEdit';
import { formatNotifyTime } from '../notifications/labels';
import { notificationPermission, requestNotificationPermission } from '../notifications/permissions';
import { NotificationTimeSheet } from '../settings/NotificationTimeSheet';
import { Avatar } from './Avatar';
import { ALL_DAY_ALERTS, OWNERS, OWNER_COLOR, TIMED_ALERTS, alertFor, authorOf, editorOf, ownerOf, type Owner } from './model';

/** `time` stays in the form while 종일 is on, so turning it off again brings the start back. `ownerId` is kept as sent, so an edit leaves it alone unless the owner is picked again. */
type Form = { title: string; date: string; allDay: boolean; time: string; endTime: string | null; alert: EventAlert; ownerId: string | null };
type Picker = 'date' | 'start' | 'end' | 'alert' | null;
const DEFAULT_TIME = '19:00';
const hourAfter = (time: string) => `${String(Math.min(Number(time.slice(0, 2)) + 1, 23)).padStart(2, '0')}:${time.slice(3, 5)}`;
const formOf = (item: CalendarEvent | undefined, date: string): Form => ({ title: item?.title ?? '', date: item?.date ?? date, allDay: item ? item.time === null : false, time: item?.time ?? DEFAULT_TIME, endTime: item?.endTime ?? null, alert: item?.alert ?? 'none', ownerId: item?.ownerId ?? null });
const fieldsOf = (form: Form): EventFields => ({ title: form.title.trim(), date: form.date, time: form.allDay ? null : form.time, endTime: form.allDay ? null : form.endTime, alert: form.alert, ownerId: form.ownerId });

/** V0-13 일정 추가/편집. Both partners may edit or delete any event and change whose plan it is (new events start as 함께); the writer card keeps the original author and names the last other editor. An existing event also carries one flat comment thread where each writer may delete only their own. */
export function EventEdit({ initial, date, me, meName, partner, partnerId, timeZone, offline, comments, save, remove, addComment, removeComment, reload, onClose, onGone, onSaved }: {
  initial?: CalendarEvent; date: string; me: string; meName: string; partner: string | null; partnerId: string | null; timeZone: string; offline: boolean; comments: readonly EventComment[];
  addComment: (body: string, key: string) => Promise<void>; removeComment: (commentId: string, key: string) => Promise<void>;
  save: (fields: EventFields, version: number | undefined, key: string) => Promise<void>; remove: (version: number, key: string) => Promise<void>;
  reload: () => Promise<CalendarEvent | undefined>; onClose: () => void; onGone: () => void; onSaved: (toast: 'saved' | 'deleted', date: string) => void;
}) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor(); const insets = useSafeAreaInsets(); const large = useLargeText();
  const name = partner ?? t('home.pending.partner');
  const [form, setForm] = useState(() => formOf(initial, date)); const [baseline, setBaseline] = useState(form); const [version, setVersion] = useState(initial?.version);
  const [saving, setSaving] = useState(false); const [error, setError] = useState<'save' | 'delete' | 'comment' | null>(null); const [titleTouched, setTitleTouched] = useState(false);
  const [picker, setPicker] = useState<Picker>(null); const [draftDate, setDraftDate] = useState(fromIsoDate(form.date)); const [denied, setDenied] = useState(false);
  const [draft, setDraft] = useState(''); const [sending, setSending] = useState(false);
  const key = useRef(randomUUID()); const commentKey = useRef(randomUUID()); const source = useRef(initial);
  const hideError = useCallback(() => setError(null), []);
  const checkPermission = useCallback(async (alert: EventAlert, ask: boolean) => {
    if (alert === 'none') { setDenied(false); return; }
    const permission = await notificationPermission().catch(() => 'undetermined' as const);
    setDenied(permission === 'denied' || (ask && permission === 'undetermined' && !(await requestNotificationPermission().catch(() => false))));
  }, []);
  useEffect(() => { void checkPermission(initial?.alert ?? 'none', false); }, [checkPermission, initial?.alert]);
  const titleLength = graphemeLength(form.title.trim());
  const endError = !form.allDay && form.endTime !== null && form.endTime <= form.time;
  const valid = !!form.title.trim() && titleLength <= 20 && !endError;
  const ready = valid && !offline;
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const draftLength = graphemeLength(draft.trim());
  const canSend = !!draft.trim() && draftLength <= 200 && !offline && !sending;
  const close = () => dirty ? Alert.alert(t('edit.discard.title'), '', [{ text: t('edit.discard.cta'), style: 'destructive', onPress: onClose }, { text: t('edit.discard.keep'), isPreferred: true }]) : onClose();
  const gone = () => Alert.alert(t('cal.gone.title'), t('cal.gone.body', { name }), [{ text: t('common.ok'), onPress: onGone }]);
  const errorFlow = (action: 'save' | 'delete' | 'comment') => async (err: unknown) => {
    if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
      let latest: CalendarEvent | undefined;
      try { latest = await reload(); } catch { setError(action); return; }
      if (!latest) { gone(); return; }
      source.current = latest; const next = formOf(latest, latest.date); setForm(next); setBaseline(next); setVersion(latest.version); key.current = randomUUID();
      Alert.alert(t('edit.conflict.title', { name }), t('edit.conflict.body'), [{ text: t('common.ok') }]); return;
    }
    if (err instanceof ApiError && err.code === 'NOT_FOUND' && err.details.gone === true) { gone(); return; }
    setError(action);
  };
  const submit = async () => {
    if (!ready || saving) return;
    setSaving(true); setError(null);
    try { await save(fieldsOf(form), version, key.current); onSaved('saved', form.date); } catch (err) { await errorFlow('save')(err); } finally { setSaving(false); }
  };
  const deleteItem = () => Alert.alert(t('cal.delete.title'), partner ? t('edit.delete.body', { name: partner }) : t('edit.delete.body.unpaired'), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => { if (!version) return; void remove(version, randomUUID()).then(() => onSaved('deleted', form.date)).catch(errorFlow('delete')); } }]);
  const send = async () => {
    if (!canSend) return;
    setSending(true); setError(null);
    try { await addComment(draft.trim(), commentKey.current); setDraft(''); commentKey.current = randomUUID(); } catch (err) { await errorFlow('comment')(err); } finally { setSending(false); }
  };
  // A NOT_FOUND here means the comment is already gone, which is what deleting wanted.
  const deleteComment = (commentId: string) => Alert.alert(t('cal.comment.delete.title'), '', [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => { void removeComment(commentId, randomUUID()).catch((err: unknown) => { if (!(err instanceof ApiError && err.code === 'NOT_FOUND')) setError('delete'); }); } }]);
  const setAllDay = (allDay: boolean) => setForm({ ...form, allDay, alert: alertFor(form.alert, allDay) });
  // iOS gives focus back to the title when a sheet closes unless the keyboard was down before it opened.
  const open = (next: Picker) => { Keyboard.dismiss(); setPicker(next); };
  const pickAlert = (alert: EventAlert) => { setForm({ ...form, alert }); setPicker(null); void checkPermission(alert, true); };
  const alertLabel = (alert: EventAlert) => t(form.allDay && alert !== 'none' ? `cal.alert.allDay.${alert}` : `cal.alert.${alert}`);
  const time = (value: string) => formatNotifyTime(value, i18n.language);
  const cancel = <Pressable onPress={close} accessibilityRole="button" style={{ minHeight: 48, justifyContent: 'center' }}><AppText>{t('common.cancel')}</AppText></Pressable>;
  const saveButton = <Pressable disabled={!ready || saving} onPress={() => void submit()} style={{ minHeight: 48, justifyContent: 'center', opacity: ready ? 1 : 0.6 }} accessibilityRole="button" accessibilityState={{ disabled: !ready || saving }}><AppText tone={ready ? 'primary' : 'text2'} style={emphasis(16)}>{t('common.save')}</AppText></Pressable>;
  const heading = t(initial ? 'cal.edit.title' : 'cal.new.title');
  const monthDay = (at: string) => formattedMonthDay(todayIn(at, timeZone), i18n.language);
  const when = (at: string) => `${monthDay(at)} ${time(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(at)))}`;
  const author = initial && authorOf(initial, me), editor = initial && editorOf(initial, me);
  const owner = ownerOf(form, me);
  const owners: Record<Owner, { id: string | null; label: string; name: string }> = { together: { id: null, label: t('cal.owner.together'), name: '' }, me: { id: me, label: t('cal.by.me'), name: meName }, partner: { id: partnerId, label: name, name } };
  const note = (text: string, tone: 'text2' | 'danger' = 'text2') => <AppText tone={tone} variant="bodySm">{text}</AppText>;
  return <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
    <View style={{ minHeight: 48, paddingHorizontal: 20 }}>{large ? <><View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{cancel}{saveButton}</View><AppText style={[emphasis(17), { paddingBottom: 8 }]}>{heading}</AppText></> : <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{cancel}<AppText accessibilityRole="header" style={emphasis(17)}>{heading}</AppText>{saveButton}</View>}</View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 14 }}>
      {initial && author && <View accessible style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: color.surface, borderWidth: tokens.border.outline.normal, borderColor: color[OWNER_COLOR[author]], borderRadius: tokens.radius.card }}>
        <Avatar owner={author} name={author === 'me' ? meName : name} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={[emphasis(15), { color: color[OWNER_COLOR[author]] }]}>{author === 'me' ? t('cal.detail.added.me', { date: monthDay(initial.createdAt) }) : t('cal.detail.added', { name, date: monthDay(initial.createdAt) })}</AppText>
          {editor && <AppText tone="text2" style={{ fontSize: 13, lineHeight: 19 }}>{editor === 'me' ? t('cal.detail.edited.me', { date: monthDay(initial.updatedAt) }) : t('cal.detail.edited', { name, date: monthDay(initial.updatedAt) })}</AppText>}
        </View>
      </View>}
      <View style={{ gap: 6 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><AppText style={emphasis(14)}>{t('edit.field.title')}</AppText><AppText tone={titleLength > 20 || (titleTouched && !form.title.trim()) ? 'danger' : 'text2'} style={{ fontSize: 13, lineHeight: 20 }}>{t('edit.counter', { n: titleLength, max: 20 })}</AppText></View>
        <TextField hideLabel label={t('edit.field.title')} placeholder={t('cal.field.title.ph')} value={form.title} onChangeText={(title) => setForm({ ...form, title })} onBlur={() => setTitleTouched(true)} error={titleLength > 20 ? t('edit.err.title.long') : titleTouched && !form.title.trim() ? t('edit.err.title.empty') : undefined} /></View>
      <View style={{ gap: 6 }}>
        <AppText style={emphasis(14)}>{t('cal.owner')}</AppText>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('cal.owner')} style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: tokens.radius.input, backgroundColor: color.surface2 }}>
          {OWNERS.filter((each) => each !== 'partner' || partnerId !== null).map((each) => <Pressable key={each} accessibilityRole="radio" accessibilityLabel={owners[each].label} accessibilityState={{ selected: owner === each }} onPress={() => setForm({ ...form, ownerId: owners[each].id })}
            style={{ flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, borderRadius: tokens.radius.input - 4, borderWidth: tokens.border.outline.normal, borderColor: owner === each ? color[OWNER_COLOR[each]] : 'transparent', backgroundColor: owner === each ? color.surface : 'transparent' }}>
            <Avatar owner={each} name={owners[each].name} size={20} />
            <AppText numberOfLines={1} style={owner === each ? emphasis(14) : { fontSize: 14, lineHeight: 20 }}>{owners[each].label}</AppText>
          </Pressable>)}
        </View>
      </View>
      <View style={{ backgroundColor: color.surface, borderWidth: tokens.border.outline.normal, borderColor: color.divider, borderRadius: tokens.radius.card, paddingHorizontal: 14 }}>
        <SwitchRow label={t('cal.allDay')} value={form.allDay} onValueChange={setAllDay} last={false} />
        <ListRow label={t('edit.field.date')} value={formattedDate(form.date, i18n.language, true)} onPress={() => { setDraftDate(fromIsoDate(form.date)); open('date'); }} last={false} />
        {!form.allDay && <>
          <ListRow label={t('cal.field.start')} value={time(form.time)} onPress={() => open('start')} last={false} />
          <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: color.divider }}>
            <View style={{ flex: 1 }}><ListRow label={t('cal.field.end')} value={form.endTime ? time(form.endTime) : t('cal.field.end.none')} valueTone={endError ? 'danger' : 'text2'} onPress={() => open('end')} /></View>
            {form.endTime && <IconButton plain compact icon="close" label={t('cal.field.end.clear')} onPress={() => setForm({ ...form, endTime: null })} />}
          </View>
        </>}
        <ListRow label={t('edit.field.notify')} value={alertLabel(form.alert)} onPress={() => open('alert')} />
      </View>
      {endError && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="warn" size={16} color={color.danger} />{note(t('cal.err.end'), 'danger')}</View>}
      <View style={{ gap: 4 }}>
        {denied && note(t('cal.alert.denied'), 'danger')}
        {note(t('cal.alert.note'))}
        {note(partner ? t('edit.shared.hint', { name: partner }) : t('edit.shared.hint.unpaired'))}
      </View>
      {initial && <View style={{ gap: 10 }}>
        <AppText accessibilityRole="header" style={emphasis(14)}>{t('cal.comment.title', { n: comments.length })}</AppText>
        {comments.length === 0 && note(t('cal.comment.empty'))}
        {comments.map((comment) => {
          const person = authorOf(comment, me), who = person === 'me' ? meName : name, at = when(comment.createdAt);
          return <View key={comment.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
            <View accessible accessibilityLabel={t('cal.comment.a11y', { name: who, time: at, body: comment.body })} style={{ flex: 1, flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
              <Avatar owner={person} name={who} size={28} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText tone="text2" style={{ fontSize: 13, lineHeight: 19 }}><AppText style={[emphasis(13), { color: color[OWNER_COLOR[person]] }]}>{who}</AppText>{` · ${at}`}</AppText>
                <AppText>{comment.body}</AppText>
              </View>
            </View>
            {person === 'me' && <IconButton plain compact icon="trash" label={t('cal.comment.delete')} disabled={offline} onPress={() => deleteComment(comment.id)} />}
          </View>;
        })}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}><TextField hideLabel label={t('cal.comment.ph')} placeholder={t('cal.comment.ph')} value={draft} onChangeText={setDraft} editable={!offline} error={draftLength > 200 ? t('cal.comment.err.long') : undefined} /></View>
          <IconButton tone="primary" icon="send" label={t('cal.comment.send')} disabled={!canSend} onPress={() => void send()} />
        </View>
      </View>}
      {initial && <Button variant="dangerOutline" label={t('cal.delete')} disabled={offline} onPress={deleteItem} />}
    </ScrollView>
    {error && <View style={{ position: 'absolute', left: 20, right: 20, bottom: 110 }}><Toast text={t(error === 'comment' ? 'cal.comment.err' : `edit.${error}.err`)} icon="warn" onHide={hideError} /></View>}
    <DateWheelSheet visible={picker === 'date'} value={draftDate} onChange={setDraftDate} minYear={Number(date.slice(0, 4)) - 5} maxYear={Number(date.slice(0, 4)) + 10} onDone={() => { setForm({ ...form, date: toIsoDate(draftDate) }); setPicker(null); }} onClose={() => setPicker(null)} />
    <NotificationTimeSheet visible={picker === 'start'} title={t('cal.field.start')} time={form.time} onClose={() => setPicker(null)} onSelect={(start) => setForm({ ...form, time: start })} />
    <NotificationTimeSheet visible={picker === 'end'} title={t('cal.field.end')} time={form.endTime ?? hourAfter(form.time)} onClose={() => setPicker(null)} onSelect={(endTime) => setForm({ ...form, endTime })} />
    <BottomSheet visible={picker === 'alert'} title={t('edit.field.notify')} onClose={() => setPicker(null)}>
      <View>{(form.allDay ? ALL_DAY_ALERTS : TIMED_ALERTS).map((alert, index, all) => <RadioRow key={alert} label={alertLabel(alert)} selected={form.alert === alert} onPress={() => pickAlert(alert)} last={index === all.length - 1} />)}</View>
    </BottomSheet>
  </View>;
}
