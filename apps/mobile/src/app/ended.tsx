import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSpace } from '../features/space/SpaceContext';
import { useApp } from '../lib/AppContext';
import { cancelV0Notifications } from '../features/notifications/scheduler';
import { clearV0LocalData } from '../features/space/v0LocalData';
import { readV0Cache } from '../features/space/v0Cache';
import { AppText, Banner, Button, Screen } from '../ui/components';
import { mascotPoses } from '../scene/catalog';
export default function EndedRoute() {
  const { t } = useTranslation(); const { client, userId } = useApp(); const { ended, reload, state } = useSpace();
  const [name, setName] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const snapshot = state.snapshot;
  useEffect(() => {
    if (!ended || !userId) return;
    let active = true;
    void (async () => {
      const cached = await readV0Cache(userId);
      const members = snapshot?.members ?? cached?.snapshotV0Part.members ?? [];
      if (active && ended.kind !== 'account_deleted') setName(members.find((member) => member.userId !== userId)?.displayName ?? null);
      await clearV0LocalData(userId, snapshot?.space.spaceId ?? cached?.spaceId).catch(() => undefined);
      await cancelV0Notifications().catch(() => undefined);
    })();
    return () => { active = false; };
  }, [ended, userId, snapshot]);
  if (!ended) return null;
  const title = ended.kind === 'account_deleted' ? 'end.byPartnerDeleted' : ended.by === 'me' ? 'end.done.title' : ended.kind === 'disconnect' ? 'end.byPartnerDisconnect' : 'end.byPartner';
  const proceed = async () => { setBusy(true); setError(false); try { await client.ackEnded(); await reload(); } catch { setError(true); } finally { setBusy(false); } };
  return <Screen center footer={<>{error && <Banner kind="danger" text={t('state.error.title')} body={t('state.error.body')} />}<Button label={t('state.ended.cta')} loading={busy} onPress={() => void proceed()} /></>}><Image accessibilityElementsHidden importantForAccessibility="no" source={mascotPoses.sleep} resizeMode="contain" style={{ width: 160, height: 160, alignSelf: 'center' }} /><AppText variant="title" align="center">{t(title, { name: name ?? t('home.pending.partner') })}</AppText><AppText tone="text2" align="center">{t('state.ended.body')}</AppText></Screen>;
}
