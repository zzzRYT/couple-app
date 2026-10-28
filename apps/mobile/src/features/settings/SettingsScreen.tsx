import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppColor } from '../../theme/useAppColor';
import { tokens } from '../../theme/tokens';
import { Banner, Button, Dialog, ListRow } from '../../ui/components';

/** Settings tab root. Only the account section (sign out) exists so far; the other S13 rows arrive with their features. */
export function SettingsScreen({ onLogout }: { onLogout: () => Promise<void> }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function confirm() {
    setBusy(true);
    setFailed(false);
    try { await onLogout(); setConfirming(false); } catch { setFailed(true); }
    setBusy(false);
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2] }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('set.title')}</Text>
      <Text accessibilityRole="header" style={{ color: color.text2 }}>{t('set.sec.account')}</Text>
      <ListRow label={t('set.logout')} onPress={() => { setFailed(false); setConfirming(true); }} />
      <Dialog visible={confirming} title={t('set.logout.title')} onClose={() => { if (!busy) setConfirming(false); }}>
        <Text style={{ color: color.text2 }}>{t('set.logout.body')}</Text>
        {failed && <Banner kind="danger" text={t('sys.server.title')} />}
        <View style={{ gap: tokens.spacing[1] }}>
          <Button label={t('set.logout')} variant="danger" disabled={busy} onPress={() => void confirm()} />
          <Button label={t('common.cancel')} variant="ghost" disabled={busy} onPress={() => setConfirming(false)} />
        </View>
      </Dialog>
    </ScrollView>
  );
}
