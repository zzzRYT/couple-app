import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Dialog } from '../../ui/components';

/** Says what disconnecting does before it happens: the partner loses the room and conversation, the space ends, the data is deleted. */
export function DisconnectDialog({ visible, partnerName, onConfirm, onClose }: { visible: boolean; partnerName: string; onConfirm: () => Promise<void>; onClose: () => void }) {
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
    <Dialog visible={visible} icon="warn" title={t('report.block.title', { name: partnerName })} body={t('report.block.body', { name: partnerName })} onClose={() => { if (!busy) onClose(); }}>
      {failed && <Banner kind="danger" text={t('end.err.title')} />}
      <Button label={t('report.block.confirm')} variant="danger" loading={busy} onPress={() => void confirm()} />
      <Button label={t('common.cancel')} variant="ghost" disabled={busy} onPress={onClose} />
    </Dialog>
  );
}
