import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';
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
    <Screen onBack={busy ? undefined : onCancel} footer={<>
      <Button label={failed ? t('common.retry') : t('end.confirm')} variant="danger" loading={busy} disabled={!checked || busy} onPress={() => void confirm()} />
      <Button label={t('end.cancel')} variant="ghost" disabled={busy} onPress={onCancel} />
    </>}>
      <AppText variant="title" accessibilityRole="header">{t('end.title')}</AppText>
      <AppText tone="text2">{t('end.body')}</AppText>
      <Card style={{ gap: tokens.spacing[1] }}>
        {(['end.b1', 'end.b2', 'end.b3'] as const).map((key) => <AppText key={key}>{`• ${t(key)}`}</AppText>)}
      </Card>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled: busy }} accessibilityLabel={t('end.check')} disabled={busy} onPress={() => setChecked((value) => !value)}
        style={{ minHeight: tokens.touch.minimum, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2] }}>
        <View style={{ width: 24, height: 24, borderWidth: tokens.border.outline.normal, borderColor: color.line, borderRadius: 8, backgroundColor: checked ? color.danger : color.surface, alignItems: 'center', justifyContent: 'center' }}>
          {checked && <Icon name="check" size={16} color={color.onDanger} />}
        </View>
        <AppText style={{ flexShrink: 1 }}>{t('end.check')}</AppText>
      </Pressable>
      {failed && <Banner kind="danger" text={t('end.err.title')} body={t('end.err.body')} />}
      {busy && <View style={{ alignItems: 'center' }}><CycleLoader label={t('end.progress')} /></View>}
    </Screen>
  );
}
