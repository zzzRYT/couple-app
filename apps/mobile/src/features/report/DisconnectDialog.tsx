import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Dialog } from '../../ui/components';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';

/** Says what disconnecting does before it happens: the partner loses the room and conversation, the space ends, the data is deleted. */
export function DisconnectDialog({ visible, partnerName, onConfirm, onClose }: { visible: boolean; partnerName: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function confirm() {
    setBusy(true);
    setFailed(false);
    try { await onConfirm(); } catch { setFailed(true); }
    setBusy(false);
  }
  return (
    <Dialog visible={visible} title={t('report.block.title', { name: partnerName })} onClose={() => { if (!busy) onClose(); }}>
      <Text style={{ color: color.text2 }}>{t('report.block.body', { name: partnerName })}</Text>
      {failed && <Banner kind="danger" text={t('end.err.title')} />}
      <View style={{ gap: tokens.spacing[1] }}>
        <Button label={t('report.block.confirm')} variant="danger" disabled={busy} onPress={() => void confirm()} />
        <Button label={t('common.cancel')} variant="ghost" disabled={busy} onPress={onClose} />
      </View>
    </Dialog>
  );
}
