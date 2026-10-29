import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Screen, SectionLabel, TextField } from '../../ui/components';
import { ApiError, errorKey } from '../../lib/errors';
import type { ReportInput, ReportReason, ReportTarget } from '../../lib/client';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { DisconnectDialog } from './DisconnectDialog';

const TARGETS: { value: ReportTarget; key: string }[] = [
  { value: 'partner', key: 'report.target.partner' }, { value: 'shared_text', key: 'report.target.text' }, { value: 'room_scene', key: 'report.target.scene' },
];
const REASONS: { value: ReportReason; key: string }[] = [
  { value: 'harass', key: 'report.reason.harass' }, { value: 'inappropriate', key: 'report.reason.inappropriate' },
  { value: 'privacy', key: 'report.reason.privacy' }, { value: 'other', key: 'report.reason.other' },
];
const MAX_DETAIL = 200;
type Phase = 'edit' | 'sending' | 'done';

function Choice({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled: boolean }) {
  const color = useAppColor();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected, disabled }} accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={{ minHeight: tokens.touch.minimum, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2] }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: tokens.border.outline.normal, borderColor: color.line, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.primary }} />}
      </View>
      <AppText style={{ flexShrink: 1 }}>{label}</AppText>
    </Pressable>
  );
}

/** S15: report (target → reason → optional details → send) kept separate from "disconnect", which only starts a confirmation. */
export function ReportScreen({ partnerName, initialTarget, messageId, onSubmit, onDisconnect, onDone }: {
  partnerName: string; initialTarget?: ReportTarget; messageId?: string;
  onSubmit: (input: ReportInput) => Promise<void>; onDisconnect: () => Promise<void>; onDone: () => void;
}) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<ReportTarget | null>(initialTarget ?? null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [phase, setPhase] = useState<Phase>('edit');
  const [failure, setFailure] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const sending = phase === 'sending';
  async function submit() {
    if (!target || !reason) return;
    setPhase('sending');
    setFailure(null);
    try {
      await onSubmit({ target, reason, ...(detail.trim() ? { detail: detail.trim() } : {}), ...(messageId && target === 'shared_text' ? { messageId } : {}) });
      setPhase('done');
    } catch (error) {
      setFailure(error instanceof ApiError && error.code === 'REPORT_RATE_LIMITED' ? errorKey(error.code) : 'report.fail.title');
      setPhase('edit');
    }
  }
  if (phase === 'done') {
    return (
      <Screen footer={<Button label={t('common.done')} onPress={onDone} />}>
        <AppText variant="title" accessibilityRole="header">{t('report.done.title')}</AppText>
        <AppText tone="text2">{t('report.done.body')}</AppText>
        <AppText variant="bodySm" tone="text2">{t('report.contact')}</AppText>
      </Screen>
    );
  }
  return (
    <Screen onBack={sending ? undefined : onDone} footer={<Button label={t('report.submit')} loading={sending} disabled={!target || !reason || sending} onPress={() => void submit()} />}>
      <AppText variant="title" accessibilityRole="header">{t('report.title')}</AppText>
      <SectionLabel text={t('report.what')} />
      <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
        <View accessibilityRole="radiogroup">
          {TARGETS.map((option) => <Choice key={option.value} label={t(option.key)} selected={target === option.value} disabled={sending} onPress={() => setTarget(option.value)} />)}
        </View>
      </Card>
      <SectionLabel text={t('report.why')} />
      <Card style={{ paddingVertical: tokens.spacing[0], gap: 0 }}>
        <View accessibilityRole="radiogroup">
          {REASONS.map((option) => <Choice key={option.value} label={t(option.key)} selected={reason === option.value} disabled={sending} onPress={() => setReason(option.value)} />)}
        </View>
      </Card>
      <TextField label={t('report.detail')} placeholder={t('report.detail.placeholder')} multiline maxLength={MAX_DETAIL} editable={!sending}
        value={detail} onChangeText={setDetail} style={{ minHeight: 96, textAlignVertical: 'top' }} />
      {failure && <Banner kind="danger" text={t(failure)} body={failure === 'report.fail.title' ? t('report.fail.body') : null} />}
      <AppText variant="bodySm" tone="text2">{t('report.contact')}</AppText>
      <View style={{ height: tokens.spacing[2] }} />
      <Button label={t('report.block', { name: partnerName })} variant="dangerOutline" disabled={sending} onPress={() => setDisconnecting(true)} />
      <DisconnectDialog visible={disconnecting} partnerName={partnerName} onConfirm={onDisconnect} onClose={() => setDisconnecting(false)} />
    </Screen>
  );
}
