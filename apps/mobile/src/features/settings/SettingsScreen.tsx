import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppColor } from '../../theme/useAppColor';
import { tokens } from '../../theme/tokens';
import { AppText, Banner, Button, Card, Dialog, GUTTER, ListRow, SectionLabel, useTabBarClearance } from '../../ui/components';

type SpaceRows = { anniversary: string; consent: 'not_given' | 'granted' | 'revoked' };
/** S13 settings tab root, limited to what exists in this MVP: the shared date, AI consent management, app version and sign-out. */
export function SettingsScreen({ onLogout, space, version, onOpenDate, onOpenConsent }: { onLogout: () => Promise<void>; space?: SpaceRows | null; version?: string; onOpenDate?: () => void; onOpenConsent?: () => void }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const clearance = useTabBarClearance();
  async function confirm() {
    setBusy(true);
    setFailed(false);
    try { await onLogout(); setConfirming(false); } catch { setFailed(true); }
    setBusy(false);
  }
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: tokens.spacing[3], paddingBottom: clearance + tokens.spacing[3], gap: tokens.spacing[2] }}>
      <AppText variant="title" accessibilityRole="header">{t('set.title')}</AppText>
      {space && <>
        <SectionLabel text={t('set.sec.couple')} />
        <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
          <ListRow icon="heart" label={t('set.together')} value={space.anniversary} onPress={onOpenDate ?? (() => {})} disabled={!onOpenDate} />
        </Card>
        <SectionLabel text={t('set.sec.ai')} />
        <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
          <ListRow icon="shield" label={t('set.ai.consent')} value={space.consent === 'granted' ? t('consent.status.on', { date: '' }).replace(/\s*·\s*$/, '') : t('consent.status.off')} onPress={onOpenConsent ?? (() => {})} disabled={!onOpenConsent} />
        </Card>
      </>}
      <SectionLabel text={t('set.sec.account')} />
      <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
        <ListRow icon="logout" label={t('set.logout')} onPress={() => { setFailed(false); setConfirming(true); }} />
      </Card>
      {version && <><SectionLabel text={t('set.sec.info')} /><View style={{ paddingVertical: tokens.spacing[1] }}><AppText variant="bodySm" tone="text2">{t('set.about.version', { v: version })}</AppText></View></>}
      <Dialog visible={confirming} icon="logout" title={t('set.logout.title')} body={t('set.logout.body')} onClose={() => { if (!busy) setConfirming(false); }}>
        {failed && <Banner kind="danger" text={t('sys.server.title')} />}
        <Button label={t('set.logout')} variant="danger" loading={busy} onPress={() => void confirm()} />
        <Button label={t('common.cancel')} variant="ghost" disabled={busy} onPress={() => setConfirming(false)} />
      </Dialog>
    </ScrollView>
  );
}
