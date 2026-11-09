import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { useAppColor } from '../../theme/useAppColor';
import { CheckRow } from '../../features/auth/passwordUi';
import { leaveSpace } from '../../features/lifecycle/leave';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
/** V0-set-disconnect: an empty nav bar with the large heading, the consequences with warning marks, and 취소 under the red button. */
export default function DisconnectRoute() {
  const { t } = useTranslation(); const color = useAppColor(); const { client, userId } = useApp(); const { state, reset, reload } = useSpace();
  const [checked, setChecked] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const name = state.snapshot?.members.find((m) => m.userId !== userId)?.displayName ?? t('home.pending.partner');
  const disconnect = async () => { setBusy(true); try { await leaveSpace({ close: client.disconnect, releaseSession: client.release, snapshot: state.snapshot, userId, resetSpace: reset, reload }); } catch { setError(true); } finally { setBusy(false); } };
  return <Screen onBack={() => router.back()} footer={<><Button label={t('set.account.disconnect')} variant="danger" disabled={!checked || state.offline} loading={busy} onPress={() => void disconnect()} /><Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} /></>}>
    <AppText variant="title" accessibilityRole="header">{t('set.disconnect.title')}</AppText>
    <Card style={{ gap: 12 }}>{(['set.disconnect.i1', 'set.disconnect.i2', 'set.disconnect.i3', 'set.disconnect.i4'] as const).map((key) => <View key={key} style={{ flexDirection: 'row', gap: 10 }}><View style={{ paddingTop: 3 }}><Icon name="warn" size={18} color={color.danger} /></View><AppText style={{ flex: 1 }}>{t(key, { name })}</AppText></View>)}</Card>
    <CheckRow label={t('set.confirm.check')} checked={checked} onToggle={() => setChecked(!checked)} />
    {error && <Banner kind="danger" text={t('state.error.title')} />}
  </Screen>;
}
