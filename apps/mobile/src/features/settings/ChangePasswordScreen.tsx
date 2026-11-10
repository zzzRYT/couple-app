import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen } from '../../ui/components';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import type { PasswordPort, SetResult } from '../auth/passwordPort';
import { passwordRules, rulesMet } from '../auth/passwordRules';
import { PasswordField, RuleList } from '../auth/passwordUi';

const RULES = ['login.pw.rule.len', 'login.pw.rule.mix', 'login.pw.rule.email'] as const;
/** While locked nothing can be typed, so the rules are plain bullets rather than met or unmet (V0-sec-change-rate). */
function PlainRules() {
  const { t } = useTranslation();
  const color = useAppColor();
  return (
    <View accessible accessibilityLabel={`${t('login.pw.rules.a11y')}: ${RULES.map((key) => t(key)).join(', ')}`} style={{ gap: tokens.spacing[0] }}>
      {RULES.map((key) => (
        <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] }}>
          <View style={{ width: 16, alignItems: 'center' }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.text2 }} /></View>
          <AppText variant="bodySm" tone="text2">{t(key)}</AppText>
        </View>
      ))}
    </View>
  );
}
/** V0-sec-change, -change-wrong and -change-rate. Only the title differs for an email account. */
export function ChangePasswordScreen({ password, email, apple, onSaved, onForgot, onBack }: { password: Pick<PasswordPort, 'set'>; email: string; apple: boolean; onSaved: () => void; onForgot: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<SetResult | null>(null);
  const rules = passwordRules(next, email);
  const locked = failed === 'locked';
  async function save() {
    setBusy(true); setFailed(null);
    const result = await password.set(next, current).catch(() => 'error' as const);
    setBusy(false);
    if (result === 'ok') { onSaved(); return; }
    setCurrent('');
    setFailed(result);
  }
  return (
    <Screen onBack={onBack} title={t(apple ? 'set.security.pwChange' : 'set.security.pwChange.email')} footer={<Button label={t('common.save')} loading={busy} disabled={current.length === 0 || !rulesMet(rules) || locked} onPress={() => void save()} />}>
      <PasswordField label={t('set.pw.current')} value={current} onChangeText={setCurrent} editable={!locked} error={failed === 'wrong' ? t('set.pw.wrong') : null} />
      {locked && <Banner kind="warn" quiet text={t('auth.login.rate')} />}
      <PasswordField kind="new" label={t('set.pw.new')} value={next} onChangeText={setNext} editable={!locked} />
      {locked ? <PlainRules /> : <RuleList rules={rules} />}
      <Button label={t('login.pw.forgot')} variant="ghost" onPress={onForgot} />
      {(failed === 'weak' || failed === 'error' || failed === 'reauth') && <Banner kind="danger" text={t('set.save.err')} />}
    </Screen>
  );
}
