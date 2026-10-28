import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';

/** S14 confirm step: spells out the consequences (no period, no restore), needs a checkmark, then ends the space. */
export function EndSpaceScreen({ onEnd, onCancel }: { onEnd: () => Promise<void>; onCancel: () => void }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function confirm() {
    setBusy(true);
    setFailed(false);
    try { await onEnd(); } catch { setFailed(true); setBusy(false); }
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2] }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: tokens.typography.scale.heading.size }}>{t('end.title')}</Text>
      <Text style={{ color: color.text2 }}>{t('end.body')}</Text>
      <View style={{ gap: tokens.spacing[1] }}>
        {(['end.b1', 'end.b2', 'end.b3'] as const).map((key) => <Text key={key} style={{ color: color.text }}>{`• ${t(key)}`}</Text>)}
      </View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled: busy }} accessibilityLabel={t('end.check')} disabled={busy} onPress={() => setChecked((value) => !value)}
        style={{ minHeight: tokens.touch.minimum, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] }}>
        <View style={{ width: 24, height: 24, borderWidth: 2, borderColor: color.text, borderRadius: 4, backgroundColor: checked ? color.danger : 'transparent' }} />
        <Text style={{ flexShrink: 1, color: color.text }}>{t('end.check')}</Text>
      </Pressable>
      {failed && <View style={{ gap: 4 }}><Banner kind="danger" text={t('end.err.title')} /><Text style={{ color: color.text2 }}>{t('end.err.body')}</Text></View>}
      {busy && <View style={{ alignItems: 'center' }}><CycleLoader label={t('end.progress')} /><Text style={{ color: color.text2 }}>{t('end.progress')}</Text></View>}
      <Button label={failed ? t('common.retry') : t('end.confirm')} variant="danger" disabled={!checked || busy} onPress={() => void confirm()} />
      <Button label={t('end.cancel')} variant="ghost" disabled={busy} onPress={onCancel} />
    </ScrollView>
  );
}
