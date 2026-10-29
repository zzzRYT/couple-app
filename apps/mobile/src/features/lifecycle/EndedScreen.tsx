import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen } from '../../ui/components';
import { Spot } from '../../ui/Spot';
import type { MySpace } from '../../lib/client';

type Ended = NonNullable<MySpace['ended']>;
/** The headline for each way a space can end; the partner's name is never shown (nobody has a display name). */
export function endedTitleKey(ended: Ended): string {
  if (ended.by === 'me') return 'end.done.title';
  return ended.kind === 'account_deleted' ? 'end.byPartnerDeleted' : ended.kind === 'disconnect' ? 'end.byPartnerDisconnect' : 'end.byPartner';
}
/**
 * S14 notice shown once after a space ended. It names the result and offers one way forward; there is no date, no
 * restore and no countdown. With an active space already open (a new one started before this was read) it only asks for an OK.
 */
export function EndedScreen({ ended, hasActiveSpace, partnerName, onContinue }: { ended: Ended; hasActiveSpace: boolean; partnerName: string; onContinue: () => Promise<void> }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function next() {
    setBusy(true);
    setFailed(false);
    try { await onContinue(); } catch { setFailed(true); }
    setBusy(false);
  }
  return (
    <Screen center footer={<>
      {failed && <Banner kind="danger" text={t('sys.server.title')} />}
      <Button label={hasActiveSpace ? t('common.confirm') : t('end.newSpace')} loading={busy} disabled={busy} onPress={() => void next()} />
    </>}>
      <Spot kind="waiting" />
      <AppText variant="title" accessibilityRole="header" align="center">{t(endedTitleKey(ended), { name: partnerName })}</AppText>
      <AppText tone="text2" align="center">{t('end.done.body')}</AppText>
    </Screen>
  );
}
