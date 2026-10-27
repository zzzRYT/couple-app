import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, BottomSheet, Button, Chip, Skeleton } from '../../ui/components';
import { DateWheel, fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { catalogImages } from '../../scene/catalogImages';
import { dayCount, formatAnniversary, todayIn } from '../../lib/dday';
import { tokens } from '../../theme/tokens';
import type { SpaceState } from '../space/types';
const color = tokens.color.app.light.normal;
function EditDateSheet({ initial, now, timeZone, onClose, onSave }: { initial: string; now: string; timeZone: string; onClose: () => void; onSave: (date: string) => Promise<void> }) {
  const { t } = useTranslation();
  const [date, setDate] = useState(fromIsoDate(initial));
  const [problem, setProblem] = useState<string | null>(null);
  async function save() {
    const iso = toIsoDate(date);
    const check = dayCount(iso, now, timeZone);
    if (!check.ok) { setProblem(check.code === 'FUTURE_DATE' ? 'space.date.future' : 'space.date.invalid'); return; }
    try { await onSave(iso); onClose(); } catch { setProblem('main.sync.title'); }
  }
  return (
    <BottomSheet visible title={t('main.editSheet.title')} onClose={onClose}>
      <Text style={{ color: color.text2 }}>{t('main.editSheet.body')}</Text>
      <DateWheel value={date} maxYear={Number(todayIn(now, timeZone).slice(0, 4))} onChange={(next) => { setDate(next); setProblem(null); }} />
      {problem && <Banner kind="warn" text={t(problem)} />}
      <Button label={t('common.save')} onPress={() => void save()} />
      <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}
/** S06 home: the shared day count. The cover photo slot keeps the plain background until US6. */
export function HomeScreen({ state, now, onOpenRoom, onOpenInvite, onSaveDate }: { state: SpaceState; now: string; onOpenRoom: () => void; onOpenInvite: () => void; onSaveDate: (date: string) => Promise<void> }) {
  const { t, i18n } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const snapshot = state.snapshot;
  if (!snapshot) {
    return <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      {state.status === 'error' ? <Banner kind="danger" text={t('main.sync.title')} /> : <Skeleton label={t('main.loading')} />}
    </View>;
  }
  const { space } = snapshot;
  const count = dayCount(space.anniversaryDate, now, space.timeZone);
  const pending = space.memberCount < 2;
  const hoursLeft = space.invitation?.status === 'active' ? Math.max(0, Math.ceil((Date.parse(space.invitation.expiresAt) - Date.parse(now)) / 3_600_000)) : null;
  const n = count.ok ? count.dayCount : 0;
  return (
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text accessibilityRole="header" style={{ color: color.text }}>{t('main.appName')}</Text>
      {state.offline && <View style={{ gap: 4 }}><Banner kind="offline" text={t('main.offline.title')} /><Text style={{ color: color.text2 }}>{t('main.offline.body')}</Text></View>}
      {!state.offline && state.status === 'error' && <View style={{ gap: 4 }}><Banner kind="warn" text={t('main.sync.title')} /><Text style={{ color: color.text2 }}>{t('main.sync.body')}</Text></View>}
      {saved && <Banner kind="success" text={t('main.editSheet.saved')} />}
      <View accessible accessibilityLabel={`${t('dday.eyebrow')} ${t('dday.count', { n })}, ${formatAnniversary(space.anniversaryDate, i18n.language)}`} style={{ alignItems: 'center', gap: 4, padding: 16, borderWidth: 2, borderColor: color.line, backgroundColor: color.surface }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Image source={catalogImages.obj_party_balloon} style={{ width: 40, height: 40 }} />
          <Image source={catalogImages.obj_party_ribbon} style={{ width: 40, height: 40 }} />
        </View>
        <Text style={{ color: color.text2 }}>{t('dday.eyebrow')}</Text>
        <Text style={{ color: color.text, fontSize: 56 }}>{t('dday.count', { n })}</Text>
        <Text style={{ color: color.text2 }}>{formatAnniversary(space.anniversaryDate, i18n.language)}</Text>
      </View>
      {pending && <Chip label={t('main.chip.waiting')} />}
      {pending && <View style={{ gap: 4 }}>
        <Banner text={t('main.invitePending.title')} />
        {hoursLeft !== null && <Text style={{ color: color.text2 }}>{t('main.invitePending.body', { h: hoursLeft })}</Text>}
        <Button label={t('main.invitePending.action')} variant="secondary" onPress={onOpenInvite} />
      </View>}
      <Button label={t('main.editDate')} variant="secondary" disabled={state.offline} onPress={() => { setSaved(false); setEditing(true); }} />
      <Button label={t('main.openRoom')} onPress={onOpenRoom} />
      {state.lastSyncedAt && (state.offline || state.status === 'error') && <Text style={{ color: color.text2 }}>{t('main.lastSeen', { time: new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(new Date(state.lastSyncedAt)) })}</Text>}
      {editing && <EditDateSheet initial={space.anniversaryDate} now={now} timeZone={space.timeZone} onClose={() => setEditing(false)} onSave={async (date) => { await onSaveDate(date); setSaved(true); }} />}
    </ScrollView>
  );
}
