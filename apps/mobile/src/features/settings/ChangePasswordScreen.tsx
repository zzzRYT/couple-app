import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen } from '../../ui/components';
import type { PasswordPort, SetResult } from '../auth/passwordPort';
import { passwordRules, rulesMet } from '../auth/passwordRules';
import { PasswordField, RuleList } from '../auth/passwordUi';

/** V0-sec-change, -change-wrong and -change-rate. Only the title differs for an email account. */
export function ChangePasswordScreen({ password, email, apple, onSaved, onForgot, onBack }: { password: Pick<PasswordPort, 'set'>; email: string; apple: boolean; onSaved: () => void; onForgot: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<SetResult | null>(null);
  const rules = passwordRules(next, email);
  async function save() {
    setBusy(true); setFailed(null);
    const result = await password.set(next, current).catch(() => 'error' as const);
    setBusy(false);
    if (result === 'ok') { onSaved(); return; }
    setCurrent('');
    setFailed(result);
  }
  const currentError = failed === 'wrong' ? t('set.pw.wrong') : failed === 'locked' ? t('auth.login.rate') : null;
  return (
    <Screen onBack={onBack} footer={<Button label={t('common.save')} loading={busy} disabled={current.length === 0 || !rulesMet(rules) || failed === 'locked'} onPress={() => void save()} />}>
      <AppText variant="title" accessibilityRole="header">{t(apple ? 'set.security.pwChange' : 'set.security.pwChange.email')}</AppText>
      <PasswordField label={t('set.pw.current')} value={current} onChangeText={setCurrent} error={currentError} />
      <PasswordField kind="new" label={t('set.pw.new')} value={next} onChangeText={setNext} />
      <RuleList rules={rules} />
      <Button label={t('login.pw.forgot')} variant="ghost" onPress={onForgot} />
      {(failed === 'weak' || failed === 'error' || failed === 'reauth') && <Banner kind="danger" text={t('state.error.title')} />}
    </Screen>
  );
}
