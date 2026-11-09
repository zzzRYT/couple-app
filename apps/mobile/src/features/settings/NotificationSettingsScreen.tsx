import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, ListRow, RadioRow, Screen, SectionLabel, SwitchRow } from '../../ui/components';
import { Icon, type IconName } from '../../ui/Icon';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import { earlyLabel, formatNotifyTime } from '../notifications/labels';
import type { Early, NotifyPrefs } from '../notifications/preferences';
import { useNotifySettings } from '../notifications/useNotifyPrefs';
import { NotificationTimeSheet } from './NotificationTimeSheet';

const EARLY: Early[] = ['none', '1d', '3d', '7d'];
const KINDS: { kind: keyof NotifyPrefs['kinds']; label: string; icon: IconName; tile: string }[] = [
  { kind: 'milestone', label: 'anniv.kind.milestone', icon: 'annivDays', tile: '#F4B79B' },
  { kind: 'birthday', label: 'anniv.kind.birthday', icon: 'annivBirthday', tile: '#F7D98B' },
  { kind: 'season', label: 'anniv.kind.season', icon: 'annivPepero', tile: '#AACBE2' },
  { kind: 'custom', label: 'anniv.kind.custom', icon: 'annivCustom', tile: '#C9B8E8' },
];
function KindTile({ icon, tile }: { icon: IconName; tile: string }) {
  return <View style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1.5, borderColor: '#4A3426', backgroundColor: tile, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={20} color="#4A3426" /></View>;
}
function DeniedBanner() {
  const { t } = useTranslation();
  const color = useAppColor();
  const { emphasis } = useType();
  return <View accessibilityRole="alert" style={{ gap: tokens.spacing[1], paddingVertical: 14, paddingHorizontal: 16, borderRadius: tokens.radius.card, borderWidth: tokens.border.outline.normal, borderColor: color.warn, backgroundColor: color.warnBg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name="bellOff" size={22} color={color.warn} /><AppText style={[emphasis(16), { color: color.warn, flex: 1 }]}>{t('set.notify.denied.title')}</AppText></View>
    <AppText variant="bodySm" style={{ color: color.warn }}>{t('set.notify.denied.body')}</AppText>
    <Button variant="secondary" icon="externalLink" label={t('set.notify.denied.cta')} onPress={() => void Linking.openSettings()} />
  </View>;
}
/** V0-set-notify and V0-set-notify-denied. Everything here applies to this device only. */
export function NotificationSettingsScreen({ userId, partner, onBack }: { userId: string; partner: string; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { prefs, denied, update, setEnabled } = useNotifySettings(userId);
  const [picking, setPicking] = useState(false);
  const off = denied || !prefs.enabled;
  return <Screen onBack={onBack} title={t('set.section.notify')}>
    {denied && <DeniedBanner />}
    <Card>
      <SwitchRow label={t('set.notify.toggle')} value={prefs.enabled && !denied} disabled={denied} last={false} onValueChange={(value) => void setEnabled(value)} />
      <ListRow label={t('set.notify.time')} value={formatNotifyTime(prefs.time, i18n.language)} onPress={() => setPicking(true)} />
    </Card>
    {!denied && <><SectionLabel text={t('set.notify.early')} /><Card>{EARLY.map((early, index) => <RadioRow key={early} label={earlyLabel(early, t)} selected={prefs.early === early} disabled={off} last={index === EARLY.length - 1} onPress={() => update({ early })} />)}</Card></>}
    <SectionLabel text={t('set.notify.kinds')} />
    <Card>{KINDS.map(({ kind, label, icon, tile }, index) => <SwitchRow key={kind} label={t(label)} leading={<KindTile icon={icon} tile={tile} />} value={prefs.kinds[kind] && !denied} disabled={off} last={index === KINDS.length - 1} onValueChange={(value) => update({ kinds: { ...prefs.kinds, [kind]: value } })} />)}</Card>
    <AppText variant="bodySm" tone="text2">{t('set.notify.note', { name: partner })}</AppText>
    <NotificationTimeSheet visible={picking} time={prefs.time} onClose={() => setPicking(false)} onSelect={(time) => update({ time })} />
  </Screen>;
}
