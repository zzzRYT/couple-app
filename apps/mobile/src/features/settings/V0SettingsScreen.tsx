import { useState } from 'react';
import { Linking, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Dialog, InfoRow, ListRow, SectionLabel, SwitchRow, useTabBarClearance } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { useAppColor } from '../../theme/useAppColor';
import { formatAnniversary } from '../../lib/dday';
import { V0_FEATURES } from '../../config/features';
import { APP_IDENTITY } from '../../config/identity';
import type { Snapshot } from '../../lib/client';
import { earlyLabel, formatNotifyTime } from '../notifications/labels';
import { useNotifySettings } from '../notifications/useNotifyPrefs';
import { TERMS_URL, contactUrl, privacyUrl } from './helpLinks';
import { usePreferences } from './preferences';
import { TimeZoneSheet } from './TimeZoneSheet';
import { zoneLabel } from './zoneLabel';
export function V0SettingsScreen({ snapshot, offline, version, apple = true, supportEmail = APP_IDENTITY.supportEmail, onLogout, onZone, navigate }: { snapshot: Snapshot; offline: boolean; version: string; apple?: boolean; supportEmail?: string | null; onLogout: () => Promise<void>; onZone: (zone: string) => Promise<void>; navigate: (route: 'me' | 'start-date' | 'notifications' | 'language' | 'appearance' | 'security' | 'disconnect' | 'delete-account') => void }) {
  const { t, i18n } = useTranslation(); const color = useAppColor(); const preferences = usePreferences(); const clearance = useTabBarClearance();
  const [zone, setZone] = useState(false), [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const partner = snapshot.members.find((m) => m.userId !== snapshot.me.userId)?.displayName;
  const notify = useNotifySettings(snapshot.me.userId);
  const contact = contactUrl({ ...APP_IDENTITY, supportEmail });
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(false); try { await action(); setZone(false); setConfirm(false); } catch { setError(true); } finally { setBusy(false); } };
  return <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: 20, paddingBottom: clearance + 20, gap: 8 }}>
    <AppText variant="title">{t('set.title')}</AppText>
    <SectionLabel text={t('set.section.me')} /><Card><ListRow label={t('set.me.name')} value={snapshot.me.displayName ?? ''} disabled={offline} onPress={() => navigate('me')} /><ListRow label={t('set.me.birthday')} value={snapshot.me.birthday ? `${snapshot.me.birthday.month}/${snapshot.me.birthday.day}` : t('set.me.birthday.none')} disabled={offline} onPress={() => navigate('me')} /></Card>
    <SectionLabel text={t('set.section.us')} /><Card><ListRow label={t('set.us.start')} value={formatAnniversary(snapshot.space.anniversaryDate, i18n.language)} disabled={offline} onPress={() => navigate('start-date')} /><InfoRow label={t('set.us.partner')} value={partner ? t('set.us.connected', { name: partner }) : t('home.pending.partner')} /><ListRow label={t('set.us.tz')} value={zoneLabel(snapshot.space.timeZone, i18n.language)} disabled={offline} onPress={() => setZone(true)} /><AppText variant="bodySm" tone="text2">{t('set.us.tz.note')}</AppText></Card>
    {V0_FEATURES.notifications && <><SectionLabel text={t('set.section.notify')} /><Card><SwitchRow label={t('set.notify.toggle')} leading={<Icon name="bell" size={22} color={color.text} />} value={notify.prefs.enabled && !notify.denied} disabled={notify.denied} last={false} onPress={() => navigate('notifications')} onValueChange={(value) => void notify.setEnabled(value)} /><ListRow icon="clock" label={t('set.notify.time')} value={formatNotifyTime(notify.prefs.time, i18n.language)} last={false} onPress={() => navigate('notifications')} /><ListRow icon="annivCalendar" label={t('set.notify.early')} value={earlyLabel(notify.prefs.early, t)} onPress={() => navigate('notifications')} /></Card></>}
    <SectionLabel text={t('set.section.display')} /><Card><ListRow label={t('set.lang')} value={preferences.locale ?? t('set.lang.system')} onPress={() => navigate('language')} /><ListRow label={t('set.mode')} value={t(`set.mode.${preferences.displayMode}`)} onPress={() => navigate('appearance')} /><AppText variant="bodySm" tone="text2">{t('set.display.note')}</AppText></Card>
    <SectionLabel text={t('set.section.help')} /><Card>{contact && <ListRow label={t('set.help.contact')} onPress={() => void Linking.openURL(contact).catch(() => undefined)} />}<ListRow label={t('set.help.privacy')} onPress={() => void Linking.openURL(privacyUrl(i18n.language)).catch(() => undefined)} /><ListRow label={t('set.help.terms')} onPress={() => void Linking.openURL(TERMS_URL).catch(() => undefined)} /><InfoRow label={t('set.help.version')} value={version} /></Card>
    <SectionLabel text={t('set.section.account')} /><Card><ListRow label={t('set.security.title')} value={t(apple ? 'set.account.apple' : 'set.account.email')} disabled={offline} onPress={() => navigate('security')} /><ListRow label={t('set.account.logout')} onPress={() => setConfirm(true)} /><ListRow label={t('set.account.disconnect')} danger disabled={offline} onPress={() => navigate('disconnect')} /><ListRow label={t('set.account.delete')} danger disabled={offline} onPress={() => navigate('delete-account')} /></Card>
    {error && <Banner kind="danger" text={t('state.error.title')} />}
    <TimeZoneSheet visible={zone} timeZone={snapshot.space.timeZone} disabled={busy || offline} onClose={() => setZone(false)} onSelect={(value) => void run(() => onZone(value))} />
    <Dialog visible={confirm} title={t('set.logout.title')} body={t('set.account.logout.body')} onClose={() => setConfirm(false)}><Button label={t('set.account.logout')} variant="danger" loading={busy} onPress={() => void run(onLogout)} /><Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirm(false)} /></Dialog>
  </ScrollView>;
}
