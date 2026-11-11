import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { AppleButton } from './AppleButton';
import { EMAIL_PATTERN } from './authPort';
import type { PasswordPort } from './passwordPort';
import { passwordRules, rulesMet } from './passwordRules';
import { CheckRow, ContactButton, MailResend, PasswordField, RuleList } from './passwordUi';
import { posthog } from '../../config/posthog';

/** V0-auth-signup and -err, -sent, -nomail. Until mail is connected -nomail is the real screen; a mail that was not sent is never claimed. */
export function SignupScreen({ password, onBack, onApple }: { password: Pick<PasswordPort, 'mailConnected' | 'signUp' | 'resendConfirmation'>; onBack: () => void; onApple: () => void }) {
  const { t } = useTranslation();
  const [mail, setMail] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [again, setAgain] = useState('');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => { void password.mailConnected().then(setMail); }, [password]);
  const rules = passwordRules(secret, email);
  const mismatch = again.length > 0 && again !== secret;
  const ready = EMAIL_PATTERN.test(email.trim()) && rulesMet(rules) && again === secret && terms;
  async function submit() {
    setBusy(true); setFailed(false);
    const result = await password.signUp(email.trim(), secret).catch(() => 'error' as const);
    setBusy(false);
    if (result === 'closed') setMail(false);
    else if (result === 'ok') { posthog?.capture('signup_requested'); setSecret(''); setAgain(''); setSent(true); } else setFailed(true);
  }
  if (mail === null) return <Screen center onBack={onBack}><CycleLoader label={t('state.loading')} /></Screen>;
  if (!mail) {
    return (
      <Screen onBack={onBack} footer={<>
        <AppleButton onPress={onApple} />
        <ContactButton link />
      </>}>
        <AppText variant="title" accessibilityRole="header">{t('auth.signup.nomail.title')}</AppText>
        <AppText tone="text2">{t('auth.signup.nomail.body')}</AppText>
      </Screen>
    );
  }
  if (sent) {
    return (
      <Screen onBack={onBack} footer={<MailResend sent label={t('login.mail.resend')} send={() => password.resendConfirmation(email.trim())} />}>
        <AppText variant="title" accessibilityRole="header">{t('login.signup.sent.title')}</AppText>
        <AppText>{t('login.signup.sent.body', { email: email.trim() })}</AppText>
        <AppText variant="bodySm" tone="text2">{t('login.mail.spam')}</AppText>
      </Screen>
    );
  }
  return (
    <Screen onBack={onBack} footer={<Button label={t('login.signup.submit')} loading={busy} disabled={!ready} onPress={() => void submit()} />}>
      <AppText variant="title" accessibilityRole="header">{t('login.signup.title')}</AppText>
      <TextField icon="mail" label={t('login.email.label')} placeholder={t('login.email.placeholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" />
      <PasswordField kind="new" label={t('login.pw.label')} value={secret} onChangeText={setSecret} invalid={secret.length > 0 && !rulesMet(rules)} />
      <RuleList rules={rules} typed={secret.length > 0} />
      <PasswordField kind="new" label={t('login.pw.confirm')} placeholder={t('login.pw.confirm.placeholder')} value={again} onChangeText={setAgain} error={mismatch ? t('login.pw.mismatch') : null} />
      <CheckRow label={t('login.signup.terms')} checked={terms} onToggle={() => setTerms((value) => !value)} />
      <AppText variant="bodySm" tone="text2">{t('auth.pw.stored')}</AppText>
      {failed && <Banner kind="danger" text={t('auth.save.err.title')} body={t('auth.save.err.body')} />}
    </Screen>
  );
}
