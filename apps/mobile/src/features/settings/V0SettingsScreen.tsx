import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Dialog, InfoRow, ListRow, RowTile, SectionLabel, SwitchRow, WORD_BREAK, useTabBarClearance } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { InlineError } from '../../ui/InlineNote';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import { V0_FEATURES } from '../../config/features';
import { APP_IDENTITY } from '../../config/identity';
import type { Snapshot } from '../../lib/client';
import { formattedMonthDay, formattedYearMonthDay } from '../anniversaries/format';
import { earlyLabel, formatNotifyTime } from '../notifications/labels';
import { useNotifySettings } from '../notifications/useNotifyPrefs';
import { TERMS_URL, contactUrl, privacyUrl } from './helpLinks';
import { AUTONYMS, usePreferences } from './preferences';
import { TimeZoneSheet } from './TimeZoneSheet';
import { zoneLabel } from './zoneLabel';

const { outline, palette } = tokens.color.illustration;
const pad = (value: number) => String(value).padStart(2, '0');
/** V0-set-main: the initial on a peach circle (unchanged in dark mode, like the illustrations), name and birthday, opening V0-set-me. */
function ProfileCard({ name, detail, disabled, onPress }: { name: string; detail: string; disabled: boolean; onPress: () => void }) {
  const color = useAppColor();
  const { type, emphasis } = useType();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${name}, ${detail}`} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: palette.peach, borderWidth: 1.5, borderColor: outline, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[emphasis(22), { color: outline }]}>{Array.from(name)[0]?.toLocaleUpperCase() ?? ''}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text {...WORD_BREAK} style={[emphasis(18), { color: color.text }]}>{name}</Text>
          <Text {...WORD_BREAK} style={[type('bodySm'), { color: color.text2 }]}>{detail}</Text>
        </View>
        <Icon name="forward" size={18} color={color.text2} />
      </Card>
    </Pressable>
  );
}
export function V0SettingsScreen({ snapshot, offline, version, apple = true, supportEmail = APP_IDENTITY.supportEmail, onLogout, onZone, navigate }: { snapshot: Snapshot; offline: boolean; version: string; apple?: boolean; supportEmail?: string | null; onLogout: () => Promise<void>; onZone: (zone: string) => Promise<void>; navigate: (route: 'me' | 'start-date' | 'notifications' | 'language' | 'appearance' | 'security' | 'connect' | 'disconnect' | 'delete-account') => void }) {
  const { t, i18n } = useTranslation(); const color = useAppColor(); const preferences = usePreferences(); const clearance = useTabBarClearance();
  const [zone, setZone] = useState(false), [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const partner = snapshot.members.find((m) => m.userId !== snapshot.me.userId)?.displayName;
  const notify = useNotifySettings(snapshot.me.userId);
  const contact = contactUrl({ ...APP_IDENTITY, supportEmail });
  const birthday = snapshot.me.birthday;
  const birthdayLine = `${t('set.me.birthday')} · ${birthday ? formattedMonthDay(`2000-${pad(birthday.month)}-${pad(birthday.day)}`, i18n.language) : t('set.me.birthday.none')}`;
  // A failure keeps the dialog or sheet open and is told there, not on the screen behind it.
  const run = async (action: () => Promise<void>) => { setBusy(true); setFailed(false); try { await action(); setZone(false); setConfirm(false); } catch { setFailed(true); } finally { setBusy(false); } };
  const openZone = () => { setFailed(false); setZone(true); };
  const openConfirm = () => { setFailed(false); setConfirm(true); };
  return <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: 20, paddingBottom: clearance + 20, gap: 8 }}>
    <AppText variant="title">{t('set.title')}</AppText>
    <ProfileCard name={snapshot.me.displayName ?? ''} detail={birthdayLine} disabled={offline} onPress={() => navigate('me')} />
    <SectionLabel text={t('set.section.us')} /><Card><ListRow tile="annivDays" label={t('set.us.start')} value={formattedYearMonthDay(snapshot.space.anniversaryDate, i18n.language)} disabled={offline} last={false} onPress={() => navigate('start-date')} />{snapshot.space.memberCount < 2 ? <ListRow tile="user" label={t('set.us.partner')} value={t('set.us.connect')} valueTone="primary" disabled={offline} last={false} onPress={() => navigate('connect')} /> : <InfoRow tile="user" label={t('set.us.partner')} value={t('set.us.connected', { name: partner ?? t('home.pending.partner') })} last={false} />}<ListRow tile="globe" label={t('set.us.tz')} value={zoneLabel(snapshot.space.timeZone, i18n.language)} disabled={offline} onPress={openZone} /></Card>
    <AppText variant="bodySm" tone="text2">{t('set.us.tz.note')}</AppText>
    {V0_FEATURES.notifications && <><SectionLabel text={t('set.section.notify')} /><Card><SwitchRow label={t('set.notify.toggle')} leading={<RowTile icon="bell" />} value={notify.prefs.enabled && !notify.denied} disabled={notify.denied} last={false} onPress={() => navigate('notifications')} onValueChange={(value) => void notify.setEnabled(value)} /><ListRow tile="clock" label={t('set.notify.time')} value={formatNotifyTime(notify.prefs.time, i18n.language)} last={false} onPress={() => navigate('notifications')} /><ListRow tile="annivCalendar" label={t('set.notify.early')} value={earlyLabel(notify.prefs.early, t)} onPress={() => navigate('notifications')} /></Card></>}
    <SectionLabel text={t('set.section.display')} /><Card><ListRow tile="globe" label={t('set.lang')} value={preferences.locale ? AUTONYMS[preferences.locale] : t('set.lang.system')} last={false} onPress={() => navigate('language')} /><ListRow tile="moon" label={t('set.mode')} value={t(`set.mode.${preferences.displayMode}`)} onPress={() => navigate('appearance')} /></Card>
    <AppText variant="bodySm" tone="text2">{t('set.display.note')}</AppText>
    <SectionLabel text={t('set.section.help')} /><Card>{contact && <ListRow tile="mail" label={t('set.help.contact')} last={false} onPress={() => void Linking.openURL(contact).catch(() => undefined)} />}<ListRow tile="shield" trailing="external" label={t('set.help.privacy')} last={false} onPress={() => void Linking.openURL(privacyUrl(i18n.language)).catch(() => undefined)} /><ListRow tile="document" trailing="external" label={t('set.help.terms')} last={false} onPress={() => void Linking.openURL(TERMS_URL).catch(() => undefined)} /><InfoRow tile="info" label={t('set.help.version')} value={version} /></Card>
    <SectionLabel text={t('set.section.account')} /><Card><ListRow tile="lock" label={t('set.security.title')} value={t(apple ? 'set.account.apple' : 'set.account.email')} disabled={offline} last={false} onPress={() => navigate('security')} /><ListRow tile="logout" trailing="none" label={t('set.account.logout')} last={false} onPress={openConfirm} /><ListRow tile="linkOff" trailing="none" label={t('set.account.disconnect')} danger disabled={offline} last={false} onPress={() => navigate('disconnect')} /><ListRow tile="trash" trailing="none" label={t('set.account.delete')} danger disabled={offline} onPress={() => navigate('delete-account')} /></Card>
    <TimeZoneSheet visible={zone} timeZone={snapshot.space.timeZone} disabled={busy || offline} failed={failed} onClose={() => setZone(false)} onSelect={(value) => void run(() => onZone(value))} />
    <Dialog visible={confirm} title={t('set.logout.title')} onClose={() => setConfirm(false)}>{failed && <InlineError text={t('state.error.body')} />}<Button label={t('set.account.logout')} variant="danger" loading={busy} onPress={() => void run(onLogout)} /><Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirm(false)} /></Dialog>
  </ScrollView>;
}
