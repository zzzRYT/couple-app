import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
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
      style={{ minHeight: tokens.touch.minimum, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color.text, alignItems: 'center', justifyContent: 'center' }}>
        {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color.text }} />}
      </View>
      <Text style={{ flexShrink: 1, color: color.text }}>{label}</Text>
    </Pressable>
  );
}

/** S15: report (target → reason → optional details → send) kept separate from "disconnect", which only starts a confirmation. */
export function ReportScreen({ partnerName, initialTarget, messageId, onSubmit, onDisconnect, onDone }: {
  partnerName: string; initialTarget?: ReportTarget; messageId?: string;
  onSubmit: (input: ReportInput) => Promise<void>; onDisconnect: () => Promise<void>; onDone: () => void;
}) {
  const color = useAppColor();
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
      <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2] }}>
        <Text accessibilityRole="header" style={{ color: color.text, fontSize: tokens.typography.scale.heading.size }}>{t('report.done.title')}</Text>
        <Text style={{ color: color.text2 }}>{t('report.done.body')}</Text>
        <Text style={{ color: color.text2 }}>{t('report.contact')}</Text>
        <Button label={t('common.done')} onPress={onDone} />
      </ScrollView>
    );
  }
  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2] }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: tokens.typography.scale.heading.size }}>{t('report.title')}</Text>
      <Text accessibilityRole="header" style={{ color: color.text2 }}>{t('report.what')}</Text>
      <View accessibilityRole="radiogroup">
        {TARGETS.map((option) => <Choice key={option.value} label={t(option.key)} selected={target === option.value} disabled={sending} onPress={() => setTarget(option.value)} />)}
      </View>
      <Text accessibilityRole="header" style={{ color: color.text2 }}>{t('report.why')}</Text>
      <View accessibilityRole="radiogroup">
        {REASONS.map((option) => <Choice key={option.value} label={t(option.key)} selected={reason === option.value} disabled={sending} onPress={() => setReason(option.value)} />)}
      </View>
      <Text style={{ color: color.text2 }}>{t('report.detail')}</Text>
      <TextField label={t('report.detail')} placeholder={t('report.detail.placeholder')} placeholderTextColor={color.text2} multiline maxLength={MAX_DETAIL} editable={!sending}
        value={detail} onChangeText={setDetail} style={{ minHeight: 96, textAlignVertical: 'top' }} />
      {failure && <View style={{ gap: 4 }}><Banner kind="danger" text={t(failure)} />{failure === 'report.fail.title' && <Text style={{ color: color.text2 }}>{t('report.fail.body')}</Text>}</View>}
      {sending && <View style={{ alignItems: 'center' }}><CycleLoader label={t('report.sending')} /><Text style={{ color: color.text2 }}>{t('report.sending')}</Text></View>}
      <Button label={t('report.submit')} disabled={!target || !reason || sending} onPress={() => void submit()} />
      <Text style={{ color: color.text2 }}>{t('report.contact')}</Text>
      <View style={{ height: tokens.spacing[3] }} />
      <Button label={t('report.block', { name: partnerName })} variant="dangerOutline" disabled={sending} onPress={() => setDisconnecting(true)} />
      <DisconnectDialog visible={disconnecting} partnerName={partnerName} onConfirm={onDisconnect} onClose={() => setDisconnecting(false)} />
    </ScrollView>
  );
}
