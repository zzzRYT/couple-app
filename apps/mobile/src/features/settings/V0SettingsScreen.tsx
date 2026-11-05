import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Dialog, ListRow, SectionLabel, useTabBarClearance } from '../../ui/components';
import { useAppColor } from '../../theme/useAppColor';
import { formatAnniversary } from '../../lib/dday';
import type { Snapshot } from '../../lib/client';
import { usePreferences } from './preferences';
import { TimeZoneSheet } from './TimeZoneSheet';
function zoneLabel(zone: string, locale: string) {
  const name = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'longGeneric' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? zone;
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  return `${name} (${offset.replace('GMT', 'UTC')})`;
}
export function V0SettingsScreen({ snapshot, offline, version, onLogout, onZone, navigate }: { snapshot: Snapshot; offline: boolean; version: string; onLogout: () => Promise<void>; onZone: (zone: string) => Promise<void>; navigate: (route: 'me' | 'start-date' | 'language' | 'appearance' | 'disconnect' | 'delete-account') => void }) {
  const { t, i18n } = useTranslation(); const color = useAppColor(); const preferences = usePreferences(); const clearance = useTabBarClearance();
  const [zone, setZone] = useState(false), [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const partner = snapshot.members.find((m) => m.userId !== snapshot.me.userId)?.displayName;
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(false); try { await action(); setZone(false); setConfirm(false); } catch { setError(true); } finally { setBusy(false); } };
  return <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: 20, paddingBottom: clearance + 20, gap: 8 }}>
    <AppText variant="title">{t('set.title')}</AppText>
    <SectionLabel text={t('set.section.me')} /><Card><ListRow label={t('set.me.name')} value={snapshot.me.displayName ?? ''} disabled={offline} onPress={() => navigate('me')} /><ListRow label={t('set.me.birthday')} value={snapshot.me.birthday ? `${snapshot.me.birthday.month}/${snapshot.me.birthday.day}` : t('set.me.birthday.none')} disabled={offline} onPress={() => navigate('me')} /></Card>
    <SectionLabel text={t('set.section.us')} /><Card><ListRow label={t('set.us.start')} value={formatAnniversary(snapshot.space.anniversaryDate, i18n.language)} disabled={offline} onPress={() => navigate('start-date')} /><ListRow label={t('set.us.partner')} value={partner ? t('set.us.connected', { name: partner }) : t('home.pending.partner')} disabled onPress={() => {}} /><ListRow label={t('set.us.tz')} value={zoneLabel(snapshot.space.timeZone, i18n.language)} disabled={offline} onPress={() => setZone(true)} /><AppText variant="bodySm" tone="text2">{t('set.us.tz.note')}</AppText></Card>
    <SectionLabel text={t('set.section.display')} /><Card><ListRow label={t('set.lang')} value={preferences.locale ?? t('set.lang.system')} onPress={() => navigate('language')} /><ListRow label={t('set.mode')} value={t(`set.mode.${preferences.displayMode}`)} onPress={() => navigate('appearance')} /><AppText variant="bodySm" tone="text2">{t('set.display.note')}</AppText></Card>
    <SectionLabel text={t('set.section.help')} /><Card>{(['contact', 'privacy', 'terms'] as const).map((key) => <ListRow key={key} label={t(`set.help.${key}`)} disabled onPress={() => {}} />)}<ListRow label={t('set.help.version')} value={version} disabled onPress={() => {}} /></Card>
    <SectionLabel text={t('set.section.account')} /><Card><ListRow label={t('set.account.apple')} disabled onPress={() => {}} /><ListRow label={t('set.account.logout')} onPress={() => setConfirm(true)} /><ListRow label={t('set.account.disconnect')} danger disabled={offline} onPress={() => navigate('disconnect')} /><ListRow label={t('set.account.delete')} danger disabled={offline} onPress={() => navigate('delete-account')} /></Card>
    {error && <Banner kind="danger" text={t('state.error.title')} />}
    <TimeZoneSheet visible={zone} timeZone={snapshot.space.timeZone} disabled={busy || offline} onClose={() => setZone(false)} onSelect={(value) => void run(() => onZone(value))} />
    <Dialog visible={confirm} title={t('set.logout.title')} body={t('set.logout.body')} onClose={() => setConfirm(false)}><Button label={t('set.account.logout')} variant="danger" loading={busy} onPress={() => void run(onLogout)} /><Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirm(false)} /></Dialog>
  </ScrollView>;
}
