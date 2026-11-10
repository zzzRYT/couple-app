import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Screen, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { AppleButton } from './AppleButton';
import { EMAIL_PATTERN } from './authPort';
import type { PasswordPort, SetResult } from './passwordPort';
import { passwordRules, rulesMet } from './passwordRules';
import { ContactButton, MailResend, PasswordField, RuleList } from './passwordUi';

/** V0-auth-reset, -reset-sent and -reset-nomail. The sent screen reads the same whether or not the address has an account. */
export function ResetScreen({ password, initialEmail = '', onBack, onApple }: { password: Pick<PasswordPort, 'mailConnected' | 'requestReset'>; initialEmail?: string; onBack: () => void; onApple?: () => void }) {
  const { t } = useTranslation();
  const [mail, setMail] = useState<boolean | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { void password.mailConnected().then(setMail); }, [password]);
  async function send() {
    setBusy(true); setFailed(false);
    const ok = await password.requestReset(email.trim()).catch(() => false);
    setBusy(false);
    if (ok) setSent(true); else setFailed(true);
  }
  if (mail === null) return <Screen center onBack={onBack}><CycleLoader label={t('state.loading')} /></Screen>;
  if (!mail) {
    return (
      <Screen onBack={onBack}>
        <AppText variant="title" accessibilityRole="header">{t('auth.reset.nomail.title')}</AppText>
        <AppText tone="text2">{t('auth.reset.nomail.body')}</AppText>
        <Card>
          <View style={{ gap: tokens.spacing[2], padding: tokens.spacing[3] }}>
            <AppText variant="heading">{t('auth.reset.nomail.apple.title')}</AppText>
            <AppText tone="text2">{t('auth.reset.nomail.apple.body')}</AppText>
            {onApple && <AppleButton onPress={onApple} />}
          </View>
        </Card>
        <Card>
          <View style={{ gap: tokens.spacing[2], padding: tokens.spacing[3] }}>
            <AppText variant="heading">{t('auth.reset.nomail.email.title')}</AppText>
            <AppText tone="text2">{t('auth.reset.nomail.email.body')}</AppText>
            <ContactButton />
          </View>
        </Card>
      </Screen>
    );
  }
  if (sent) {
    return (
      <Screen onBack={onBack} footer={<MailResend sent label={t('login.mail.resend')} send={() => password.requestReset(email.trim())} />}>
        <AppText variant="title" accessibilityRole="header">{t('login.reset.sent.title')}</AppText>
        <AppText>{t('login.reset.sent.body', { email: email.trim() })}</AppText>
        <AppText variant="bodySm" tone="text2">{t('login.mail.spam')}</AppText>
      </Screen>
    );
  }
  return (
    <Screen onBack={onBack} footer={<Button label={t('login.reset.send')} loading={busy} disabled={!EMAIL_PATTERN.test(email.trim())} onPress={() => void send()} />}>
      <AppText variant="title" accessibilityRole="header">{t('login.reset.title')}</AppText>
      <AppText tone="text2">{t('login.reset.body')}</AppText>
      <TextField icon="mail" label={t('login.email.label')} placeholder={t('login.email.placeholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" />
      <AppText variant="bodySm" tone="text2">{t('auth.reset.apple')}</AppText>
      {failed && <Banner kind="danger" text={t('auth.send.err.title')} body={t('auth.send.err.body')} />}
    </Screen>
  );
}
/** V0-auth-newpw: after a mail link. A link that has gone stale by now answers `reauth`, which is V0-auth-link-exp. */
export function NewPasswordScreen({ password, email, onSaved, onExpired, onBack }: { password: Pick<PasswordPort, 'set'>; email: string; onSaved: () => void; onExpired: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<SetResult | null>(null);
  const rules = passwordRules(secret, email);
  async function save() {
    setBusy(true); setFailed(null);
    const result = await password.set(secret).catch(() => 'error' as const);
    setBusy(false);
    if (result === 'ok') onSaved(); else if (result === 'reauth') onExpired(); else setFailed(result);
  }
  return (
    <Screen onBack={onBack} footer={<Button label={t('login.pw.new.save')} loading={busy} disabled={!rulesMet(rules)} onPress={() => void save()} />}>
      <AppText variant="title" accessibilityRole="header">{t('login.pw.new.title')}</AppText>
      <AppText tone="text2">{t('login.pw.new.body')}</AppText>
      <PasswordField kind="new" label={t('set.pw.new')} value={secret} onChangeText={setSecret} invalid={secret.length > 0 && !rulesMet(rules)} />
      <RuleList rules={rules} typed={secret.length > 0} />
      {failed && <Banner kind="danger" text={t('auth.save.err.title')} body={t('auth.save.err.body')} />}
    </Screen>
  );
}
/** V0-auth-link-exp. */
export function LinkExpiredScreen({ onResend, onBack }: { onResend: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen onBack={onBack} footer={<Button label={t('login.reset.send')} onPress={onResend} />}>
      <AppText variant="title" accessibilityRole="header">{t('auth.link.exp.title')}</AppText>
      <AppText tone="text2">{t('auth.link.exp.body')}</AppText>
    </Screen>
  );
}
/** V0-auth-link-exp for a sign-up confirmation link: resends to the address this device signed up with, or opens sign-up when it has none. */
export function ConfirmLinkExpiredScreen({ password, email, onSignup, onBack }: { password: Pick<PasswordPort, 'resendConfirmation'>; email: string | null; onSignup: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const label = t('auth.link.confirmExp.resend');
  return (
    <Screen onBack={onBack} footer={email ? <MailResend variant="primary" label={label} send={() => password.resendConfirmation(email)} /> : <Button label={label} onPress={onSignup} />}>
      <AppText variant="title" accessibilityRole="header">{t('auth.link.confirmExp.title')}</AppText>
      <AppText tone="text2">{t('auth.link.confirmExp.body')}</AppText>
    </Screen>
  );
}
