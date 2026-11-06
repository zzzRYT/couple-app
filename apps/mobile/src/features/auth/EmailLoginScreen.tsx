import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { EMAIL_PATTERN } from './authPort';
import type { PasswordPort } from './passwordPort';
import { PasswordField } from './passwordUi';

/** V0-auth-login and its wrong, rate and processing states. One message for a wrong email or password, so sign-up status stays hidden. */
export function EmailLoginScreen({ password, onDone, onBack, onApple, onSignup, onForgot }: { password: Pick<PasswordPort, 'signIn'>; onDone: () => void; onBack: () => void; onApple: () => void; onSignup: () => void; onForgot: (email: string) => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'wrong' | 'locked' | 'error'>('idle');
  const ready = EMAIL_PATTERN.test(email.trim()) && secret.length > 0;
  async function submit() {
    if (!ready) return;
    setStatus('busy');
    const result = await password.signIn(email.trim(), secret).catch(() => 'error' as const);
    setSecret('');
    if (result === 'ok') onDone(); else setStatus(result);
  }
  if (status === 'busy') return <Screen center><CycleLoader label={t('login.processing')} /></Screen>;
  const locked = status === 'locked';
  return (
    <Screen onBack={onBack} footer={<>
      <Button label={t('login.pw.submit')} disabled={!ready || locked} onPress={() => void submit()} />
      {locked ? <Button label={t('auth.apple')} variant="secondary" onPress={onApple} /> : <Button label={t('login.signup.link')} variant="ghost" onPress={onSignup} />}
    </>}>
      <AppText variant="title" accessibilityRole="header">{t('auth.email.entry')}</AppText>
      <TextField label={t('login.email.label')} placeholder={t('login.email.placeholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" />
      <View style={{ gap: tokens.spacing[1] }}>
        <PasswordField label={t('login.pw.label')} value={secret} onChangeText={setSecret} onSubmitEditing={() => void submit()} returnKeyType="go" error={status === 'wrong' ? t('auth.login.wrong') : null} />
        {locked && <Banner kind="danger" text={t('auth.login.rate')} body={t('auth.login.rate.apple')} />}
        {status === 'error' && <Banner kind="danger" text={t('login.error.title')} body={t('login.error.body')} />}
        <Button label={t('login.pw.forgot')} variant="ghost" onPress={() => onForgot(email.trim())} />
      </View>
    </Screen>
  );
}
