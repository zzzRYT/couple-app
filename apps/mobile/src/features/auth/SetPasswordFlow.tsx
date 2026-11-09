import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, BottomSheet, Button, Card, Chip, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { useAppColor } from '../../theme/useAppColor';
import type { PasswordPort } from './passwordPort';
import { passwordRules, rulesMet } from './passwordRules';
import { LoginAddress, PasswordField, RuleList } from './passwordUi';

type Step = 'prompt' | 'form' | 'done';
/**
 * V0-auth-setpw-prompt → -setpw(-err) → -setpw-done. The password is optional: `onLater` always continues into the app.
 * `start="form"` skips the prompt when the person came from settings or from the sheet on home.
 */
export function SetPasswordFlow({ password, email, copy, start = 'prompt', onDone, onLater, onBack }: { password: Pick<PasswordPort, 'set'>; email: string; copy: (value: string) => Promise<unknown>; start?: Step; onDone: () => void; onLater: () => void; onBack?: () => void }) {
  const { t } = useTranslation();
  const color = useAppColor();
  const [step, setStep] = useState<Step>(start);
  const [secret, setSecret] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const rules = passwordRules(secret, email);
  const mismatch = again.length > 0 && again !== secret;
  async function save() {
    setBusy(true); setFailed(false);
    const result = await password.set(secret).catch(() => 'error' as const);
    setBusy(false);
    if (result === 'ok') { setSecret(''); setAgain(''); setStep('done'); } else setFailed(true);
  }
  if (step === 'prompt') {
    return (
      <Screen onBack={onBack} footer={<>
        <Button label={t('auth.setpw.cta')} onPress={() => setStep('form')} />
        <Button label={t('auth.setpw.later')} variant="ghost" onPress={onLater} />
        <AppText variant="bodySm" tone="text2" align="center">{t('auth.setpw.later.note')}</AppText>
      </>}>
        <AppText variant="title" accessibilityRole="header">{t('auth.setpw.prompt.title')}</AppText>
        <AppText tone="text2">{t('auth.setpw.prompt.body')}</AppText>
        <Card>
          {(['auth.setpw.prompt.b1', 'auth.setpw.prompt.b2'] as const).map((key) => (
            <View key={key} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ paddingTop: 2 }}><Icon name="check" size={20} color={color.success} /></View>
              <AppText style={{ flex: 1 }}>{t(key)}</AppText>
            </View>
          ))}
        </Card>
        <AppText variant="bodySm" tone="text2">{t('auth.setpw.prompt.note')}</AppText>
      </Screen>
    );
  }
  if (step === 'done') {
    return (
      <Screen footer={<Button label={t('common.next')} onPress={onDone} />}>
        <AppText variant="title" accessibilityRole="header">{t('auth.setpw.done.title')}</AppText>
        <AppText tone="text2">{t('auth.setpw.done.body')}</AppText>
        <LoginAddress email={email} copy={copy} />
        <AppText variant="bodySm" tone="text2">{t('auth.setpw.done.again')}</AppText>
      </Screen>
    );
  }
  return (
    <Screen onBack={start === 'form' ? onBack : () => setStep('prompt')} footer={<>
      <Button label={t('onb.pw.submit')} loading={busy} disabled={!rulesMet(rules) || again !== secret} onPress={() => void save()} />
      <Button label={t('auth.setpw.later')} variant="ghost" disabled={busy} onPress={onLater} />
    </>}>
      <AppText variant="title" accessibilityRole="header">{t('onb.pw.title')}</AppText>
      <Chip kind="success" icon="apple" label={t('onb.pw.apple')} />
      <AppText tone="text2">{t('onb.pw.body')}</AppText>
      <PasswordField kind="new" label={t('login.pw.label')} value={secret} onChangeText={setSecret} invalid={secret.length > 0 && !rulesMet(rules)} />
      <RuleList rules={rules} typed={secret.length > 0} />
      <PasswordField kind="new" label={t('login.pw.confirm')} placeholder={t('login.pw.confirm.placeholder')} value={again} onChangeText={setAgain} error={mismatch ? t('login.pw.mismatch') : null} />
      <AppText variant="bodySm" tone="text2">{t('auth.pw.stored')}</AppText>
      {failed && <Banner kind="danger" text={t('login.error.title')} body={t('login.error.body')} />}
    </Screen>
  );
}
/** V0-auth-setpw-sheet: over home, once, for accounts that existed before this version. */
export function SetPasswordSheet({ visible, onCreate, onLater }: { visible: boolean; onCreate: () => void; onLater: () => void }) {
  const { t } = useTranslation();
  return (
    <BottomSheet visible={visible} title={t('auth.setpw.prompt.title')} onClose={onLater}>
      <AppText tone="text2">{t('auth.setpw.sheet.body')}</AppText>
      <AppText variant="bodySm" tone="text2">{t('auth.setpw.prompt.note')}</AppText>
      <Button label={t('auth.setpw.cta')} onPress={onCreate} />
      <Button label={t('auth.setpw.later')} variant="ghost" onPress={onLater} />
      <AppText variant="bodySm" tone="text2" align="center">{t('auth.setpw.later.note')}</AppText>
    </BottomSheet>
  );
}
