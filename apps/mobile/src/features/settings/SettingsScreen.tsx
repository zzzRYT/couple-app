import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePreferences, type DisplayMode } from './preferences';
import type { Locale } from '../../i18n';
import { useAppColor } from '../../theme/useAppColor';
import { tokens } from '../../theme/tokens';
import { AppText, Banner, BottomSheet, Button, Card, Dialog, GUTTER, ListRow, SectionLabel, TextField, useTabBarClearance } from '../../ui/components';

type SpaceRows = { anniversary: string; consent: 'not_given' | 'granted' | 'revoked'; roomMode: 'day' | 'night' | 'follow_time'; timeZone: string };
const fallbackZones = ['Asia/Seoul', 'Asia/Tokyo', 'Asia/Taipei', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'Pacific/Auckland'];
const supportedZones = (Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }).supportedValuesOf?.('timeZone') ?? fallbackZones;
const languages: { locale: Locale | null; label: string; value: string }[] = [
  { locale: null, label: 'set.lang.system', value: 'system' },
  { locale: 'ko-KR', label: '한국어', value: 'ko' },
  { locale: 'en-US', label: 'English', value: 'en' },
  { locale: 'ja-JP', label: '日本語', value: 'ja' },
];
const modes: { mode: DisplayMode; key: string }[] = [{ mode: 'system', key: 'set.theme.system' }, { mode: 'light', key: 'set.theme.light' }, { mode: 'dark', key: 'set.theme.dark' }];
/** S13 settings tab: shared room preferences, this-device preferences, app info, and existing account/space actions. */
export function SettingsScreen({ onLogout, space, version, offline = false, onRoomMode, onTimeZone, onOpenDate, onOpenCover, onOpenConsent, onOpenReport, onOpenEndSpace }: { onLogout: () => Promise<void>; space?: SpaceRows | null; version?: string; offline?: boolean; onRoomMode?: (mode: SpaceRows['roomMode']) => Promise<void>; onTimeZone?: (timeZone: string) => Promise<void>; onOpenDate?: () => void; onOpenCover?: () => void; onOpenConsent?: () => void; onOpenReport?: () => void; onOpenEndSpace?: () => void }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const preferences = usePreferences();
  const [confirming, setConfirming] = useState(false);
  const [sheet, setSheet] = useState<'language' | 'timezone' | 'licenses' | null>(null);
  const [zoneQuery, setZoneQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [roomFailed, setRoomFailed] = useState(false);
  const [roomSaving, setRoomSaving] = useState(false);
  const clearance = useTabBarClearance();
  const filteredZones = useMemo(() => {
    const choices = zoneQuery.trim() ? supportedZones : [...fallbackZones, ...(space ? [space.timeZone] : [])];
    return [...new Set(choices)].filter((zone) => zone.toLowerCase().includes(zoneQuery.trim().toLowerCase()));
  }, [zoneQuery, space?.timeZone]);
  async function confirm() {
    setBusy(true);
    setFailed(false);
    try { await onLogout(); setConfirming(false); } catch { setFailed(true); }
    setBusy(false);
  }
  async function selectRoomMode(mode: SpaceRows['roomMode']) {
    setRoomFailed(false);
    setRoomSaving(true);
    try { await onRoomMode?.(mode); } catch { setRoomFailed(true); } finally { setRoomSaving(false); }
  }
  async function selectTimeZone(timeZone: string) {
    setRoomFailed(false);
    setRoomSaving(true);
    try { await onTimeZone?.(timeZone); setSheet(null); } catch { setRoomFailed(true); } finally { setRoomSaving(false); }
  }
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: tokens.spacing[3], paddingBottom: clearance + tokens.spacing[3], gap: tokens.spacing[2] }}>
      <AppText variant="title" accessibilityRole="header">{t('set.title')}</AppText>
      {space && <>
        <SectionLabel text={t('set.sec.room')} />
        <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
          <ListRow icon="room" label={t('set.room.mode')} value={t(space.roomMode === 'follow_time' ? 'set.room.mode.auto' : `set.room.mode.${space.roomMode}`)} disabled onPress={() => {}} />
          <View style={{ flexDirection: 'row', gap: tokens.spacing[1], paddingBottom: tokens.spacing[2] }}>
            {(['follow_time', 'day', 'night'] as const).map((mode) => <View key={mode} style={{ flex: 1 }}><Button compact loading={roomSaving} variant={space.roomMode === mode ? 'primary' : 'secondary'} label={t(mode === 'follow_time' ? 'set.room.mode.auto' : `set.room.mode.${mode}`)} disabled={offline || !onRoomMode || space.roomMode === mode} onPress={() => void selectRoomMode(mode)} /></View>)}
          </View>
          <AppText variant="bodySm" tone="text2">{t('set.room.mode.help')}</AppText>
          {offline && <Banner kind="offline" text={t('set.offline.body')} />}
          <ListRow icon="globe" label={t('set.room.tz')} value={space.timeZone} onPress={() => { setZoneQuery(''); setSheet('timezone'); }} disabled={offline || !onTimeZone} />
        </Card>
        {roomFailed && <Banner kind="danger" text={t('sys.server.title')} body={t('sys.server.body')} />}
        <SectionLabel text={t('set.sec.couple')} />
        <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
          <ListRow icon="heart" label={t('set.together')} value={space.anniversary} onPress={onOpenDate ?? (() => {})} disabled={!onOpenDate} />
          <ListRow icon="image" label={t('set.cover')} onPress={onOpenCover ?? (() => {})} disabled={!onOpenCover} />
        </Card>
        <SectionLabel text={t('set.sec.ai')} />
        <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
          <ListRow icon="shield" label={t('set.ai.consent')} value={space.consent === 'granted' ? t('consent.status.on', { date: '' }).replace(/\s*·\s*$/, '') : t('consent.status.off')} onPress={onOpenConsent ?? (() => {})} disabled={!onOpenConsent} />
        </Card>
      </>}
      <SectionLabel text={t('set.sec.app')} />
      <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
        <ListRow icon="globe" label={t('set.lang')} value={preferences.locale === 'ko-KR' ? '한국어' : preferences.locale === 'ja-JP' ? '日本語' : preferences.locale === 'en-US' ? 'English' : t('set.lang.system')} onPress={() => setSheet('language')} />
        <ListRow icon="room" label={t('set.theme')} value={t(`set.theme.${preferences.displayMode}`)} disabled onPress={() => {}} />
        <View style={{ flexDirection: 'row', gap: tokens.spacing[1], paddingBottom: tokens.spacing[2] }}>
          {modes.map(({ mode, key }) => <View key={mode} style={{ flex: 1 }}><Button compact variant={preferences.displayMode === mode ? 'primary' : 'secondary'} label={t(key)} onPress={() => { preferences.setDisplayMode(mode).catch(() => {}); }} /></View>)}
        </View>
        <ListRow icon="shield" label={t('set.hc')} value={preferences.highContrast ? t('a11y.on') : t('a11y.off')} disabled onPress={() => {}} />
        <AppText variant="bodySm" tone="text2">{t('set.hc.help')}</AppText>
      </Card>
      <SectionLabel text={t('set.sec.account')} />
      <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
        <ListRow icon="logout" label={t('set.logout')} onPress={() => { setFailed(false); setConfirming(true); }} />
      </Card>
      <>
        <SectionLabel text={t('set.sec.info')} />
        <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
          {version && <ListRow icon="info" label={t('set.about.version', { v: version })} disabled onPress={() => {}} />}
          <ListRow icon="info" label={t('set.about.licenses')} onPress={() => setSheet('licenses')} />
          <ListRow icon="info" label={t('set.terms')} disabled onPress={() => {}} />
          <ListRow icon="info" label={t('set.privacy')} disabled onPress={() => {}} />
          {onOpenReport && <ListRow icon="mail" label={t('set.support')} onPress={onOpenReport} />}
        </Card>
      </>
      {onOpenEndSpace && <>
        <SectionLabel text={t('set.sec.danger')} />
        <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
          <ListRow icon="warn" danger label={t('set.end')} onPress={onOpenEndSpace} />
        </Card>
        <AppText variant="bodySm" tone="text2">{t('set.end.help')}</AppText>
      </>}
      <BottomSheet visible={sheet === 'language'} title={t('set.lang.sheet')} onClose={() => setSheet(null)}>
        {languages.map(({ locale, label, value }) => <ListRow key={value} label={locale ? label : t(label)} value={(preferences.locale ?? 'system') === (locale ?? 'system') ? '✓' : undefined} onPress={async () => { try { await preferences.setLocale(locale); setSheet(null); } catch { setSheet('language'); } }} />)}
        <AppText variant="bodySm" tone="text2">{t('set.lang.note')}</AppText>
      </BottomSheet>
      <BottomSheet visible={sheet === 'timezone'} title={t('set.room.tz.pick')} onClose={() => setSheet(null)}>
        <TextField label={t('set.room.tz.search')} value={zoneQuery} onChangeText={setZoneQuery} autoCapitalize="none" autoCorrect={false} />
        {filteredZones.map((zone) => <ListRow key={zone} label={zone} value={space?.timeZone === zone ? '✓' : undefined} disabled={offline || roomSaving} onPress={() => { if (space?.timeZone !== zone) void selectTimeZone(zone); else setSheet(null); }} />)}
      </BottomSheet>
      <BottomSheet visible={sheet === 'licenses'} title={t('lic.title')} onClose={() => setSheet(null)}>
        <AppText>{t('lic.ofl')}</AppText>
        <AppText>{t('lic.inter')}</AppText>
        <AppText>{t('lic.notokr')}</AppText>
        <AppText>{t('lic.notojp')}</AppText>
        <AppText variant="bodySm" tone="text2">{t('lic.note')}</AppText>
      </BottomSheet>
      <Dialog visible={confirming} icon="logout" title={t('set.logout.title')} body={t('set.logout.body')} onClose={() => { if (!busy) setConfirming(false); }}>
        {failed && <Banner kind="danger" text={t('sys.server.title')} />}
        <Button label={t('set.logout')} variant="danger" loading={busy} onPress={() => void confirm()} />
        <Button label={t('common.cancel')} variant="ghost" disabled={busy} onPress={() => setConfirming(false)} />
      </Dialog>
    </ScrollView>
  );
}
