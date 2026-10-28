import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button } from '../../ui/components';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
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
  const color = useAppColor();
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
    <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2], flexGrow: 1, justifyContent: 'center' }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: tokens.typography.scale.heading.size }}>{t(endedTitleKey(ended), { name: partnerName })}</Text>
      <Text style={{ color: color.text2, fontSize: tokens.typography.scale.body.size }}>{t('end.done.body')}</Text>
      {failed && <Banner kind="danger" text={t('sys.server.title')} />}
      <Button label={hasActiveSpace ? t('common.confirm') : t('end.newSpace')} disabled={busy} onPress={() => void next()} />
    </ScrollView>
  );
}
