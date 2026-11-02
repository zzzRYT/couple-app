import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Screen } from '../../ui/components';
import { leaveSpace } from '../../features/lifecycle/leave';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
export default function DisconnectRoute() {
  const { t } = useTranslation(); const { client, userId } = useApp(); const { state, reset, reload } = useSpace();
  const [checked, setChecked] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const name = state.snapshot?.members.find((m) => m.userId !== userId)?.displayName ?? t('home.pending.partner');
  const disconnect = async () => { setBusy(true); try { await leaveSpace({ close: client.disconnect, releaseSession: client.release, snapshot: state.snapshot, userId, resetSpace: reset, reload }); } catch { setError(true); } finally { setBusy(false); } };
  return <Screen onBack={() => router.back()} footer={<Button label={t('set.account.disconnect')} variant="danger" disabled={!checked || state.offline} loading={busy} onPress={() => void disconnect()} />}><AppText variant="title">{t('set.disconnect.title')}</AppText><Card>{(['set.disconnect.i1', 'set.disconnect.i2', 'set.disconnect.i3', 'set.disconnect.i4'] as const).map((key) => <AppText key={key}>• {t(key, { name })}</AppText>)}</Card><Pressable accessibilityRole="checkbox" accessibilityLabel={t('set.confirm.check')} accessibilityState={{ checked }} onPress={() => setChecked(!checked)}><AppText>{checked ? '☑' : '☐'} {t('set.confirm.check')}</AppText></Pressable>{error && <Banner kind="danger" text={t('state.error.title')} />}</Screen>;
}
