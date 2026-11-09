import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen, TextField, WORD_BREAK } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import { AppleButton } from './AppleButton';
import { EMAIL_PATTERN } from './authPort';
import type { PasswordPort } from './passwordPort';
import { PasswordField } from './passwordUi';

/**
 * V0-auth-login and its wrong, rate and processing states. One message for a wrong email or password, so sign-up status stays hidden.
 * A wrong password stays in the field so it can be corrected; the lock empties it and closes both fields.
 */
export function EmailLoginScreen({ password, onDone, onBack, onApple, onSignup, onForgot }: { password: Pick<PasswordPort, 'signIn'>; onDone: () => void; onBack: () => void; onApple: () => void; onSignup: () => void; onForgot: (email: string) => void }) {
  const { t } = useTranslation();
  const color = useAppColor();
  const { emphasis } = useType();
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'wrong' | 'locked' | 'error'>('idle');
  const ready = EMAIL_PATTERN.test(email.trim()) && secret.length > 0;
  async function submit() {
    if (!ready) return;
    setStatus('busy');
    const result = await password.signIn(email.trim(), secret).catch(() => 'error' as const);
    if (result === 'ok' || result === 'locked') setSecret('');
    if (result === 'ok') onDone(); else setStatus(result);
  }
  if (status === 'busy') return <Screen center><CycleLoader label={t('login.processing')} /></Screen>;
  const locked = status === 'locked';
  return (
    <Screen onBack={onBack} footer={<>
      <Button label={t('login.pw.submit')} disabled={!ready || locked} onPress={() => void submit()} />
      {locked ? <AppleButton onPress={onApple} /> : <Button label={t('login.signup.link')} variant="ghost" onPress={onSignup} />}
    </>}>
      <AppText variant="title" accessibilityRole="header">{t('auth.email.entry')}</AppText>
      <TextField label={t('login.email.label')} placeholder={t('login.email.placeholder')} value={email} onChangeText={setEmail} editable={!locked} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" />
      <View style={{ gap: tokens.spacing[1] }}>
        <PasswordField label={t('login.pw.label')} value={secret} onChangeText={setSecret} editable={!locked} onSubmitEditing={() => void submit()} returnKeyType="go" error={status === 'wrong' ? t('auth.login.wrong') : null} />
        {locked && <Banner kind="warn" text={t('auth.login.rate')} body={t('auth.login.rate.apple')} />}
        {status === 'error' && <Banner kind="danger" text={t('login.error.title')} body={t('login.error.body')} />}
        <Pressable accessibilityRole="button" accessibilityLabel={t('login.pw.forgot')} onPress={() => onForgot(email.trim())} hitSlop={4} style={({ pressed }) => ({ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
          <Text {...WORD_BREAK} style={[emphasis(15), { color: color.primary, textDecorationLine: 'underline', textAlign: 'right' }]}>{t('login.pw.forgot')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
