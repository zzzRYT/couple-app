import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import { authOptions as defaultOptions, type AuthOptions } from '../../config/auth';
import { AppleButton } from './AppleButton';
import { ProviderButton } from './ProviderButton';
import { EMAIL_PATTERN, type AuthPort, type Provider } from './authPort';

type OAuthProvider = 'kakao' | 'apple';
type State = { kind: 'choose' } | { kind: 'redirect'; provider: OAuthProvider } | { kind: 'cancelled' | 'error'; provider: OAuthProvider } | { kind: 'email'; invalid: boolean; sending: boolean; failed: boolean };
function Legal() {
  const color = useAppColor();
  const { t } = useTranslation();
  const { emphasis } = useType();
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <AppText variant="caption" tone="text2" align="center">{t('onb.legal.lead')}</AppText>
      <AppText style={[emphasis(12), { color: color.primary, textDecorationLine: 'underline' }]}>{t('onb.legal.links')}</AppText>
      <AppText variant="caption" tone="text2" align="center">{t('onb.age')}</AppText>
    </View>
  );
}
/** S02: product sign-in is Sign in with Apple; the email OTP flow exists only in development builds. */
export function LoginScreen({ auth, lastUsed, onDone, onEmail, onBack, notice, options = defaultOptions }: { auth: AuthPort; lastUsed?: Provider; onDone: () => void; onEmail: (email: string) => void; onBack?: () => void; notice?: string; options?: AuthOptions }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const { emphasis } = useType();
  const [state, setState] = useState<State>({ kind: 'choose' });
  const [email, setEmail] = useState('');
  async function signIn(provider: OAuthProvider) {
    setState({ kind: 'redirect', provider });
    const run = provider === 'apple' && options.apple === 'native' ? auth.apple() : auth.oauth(provider);
    const result = await run.catch(() => 'error' as const);
    if (result === 'ok') { onDone(); setState({ kind: 'choose' }); } else setState({ kind: result, provider });
  }
  async function send() {
    if (!EMAIL_PATTERN.test(email.trim())) { setState({ kind: 'email', invalid: true, sending: false, failed: false }); return; }
    setState({ kind: 'email', invalid: false, sending: true, failed: false });
    const result = await auth.sendCode(email.trim()).catch(() => 'error' as const);
    if (result === 'ok') onEmail(email.trim());
    setState({ kind: 'email', invalid: false, sending: false, failed: result !== 'ok' });
  }
  if (state.kind === 'redirect') {
    return (
      <Screen center footer={<Button label={t('login.cancel')} variant="ghost" onPress={() => setState({ kind: 'cancelled', provider: state.provider })} />}>
        <CycleLoader label={t(state.provider === 'kakao' ? 'login.redirect.title' : 'login.processing')} />
        {state.provider === 'kakao' && <AppText tone="text2" align="center">{t('login.redirect.body')}</AppText>}
      </Screen>
    );
  }
  if (state.kind === 'email' && options.devEmail) {
    return (
      <Screen onBack={() => setState({ kind: 'choose' })} footer={<>
        <Button label={t('login.email.send')} loading={state.sending} onPress={() => void send()} />
        <Button label={t('login.other')} variant="ghost" onPress={() => setState({ kind: 'choose' })} />
      </>}>
        <AppText variant="title" accessibilityRole="header">{t('login.email.title')}</AppText>
        <TextField label={t('login.email.label')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus
          error={state.invalid ? t('login.email.invalid') : null} onSubmitEditing={() => void send()} returnKeyType="send" />
        {state.failed && <Banner kind="danger" text={t('login.error.title')} body={t('login.error.body')} />}
      </Screen>
    );
  }
  return (
    <Screen onBack={onBack} footer={<Legal />}>
      <View style={{ alignItems: 'center', gap: 2, paddingTop: tokens.spacing[2] }}>
        <AppText variant="heading" align="center">{t('main.appName')}</AppText>
        <AppText variant="caption" tone="text2" align="center">{t('brand.tagline')}</AppText>
      </View>
      <AppText variant="title" accessibilityRole="header">{t('login.title')}</AppText>
      {notice && state.kind === 'choose' && <Banner kind="success" text={notice} />}
      {(state.kind === 'cancelled' || state.kind === 'error') && (
        <Banner kind={state.kind === 'error' ? 'danger' : 'info'} text={t(`login.${state.kind}.title`)} body={t(`login.${state.kind}.body`)} action={{ label: t('common.retry'), onPress: () => void signIn(state.provider) }} />
      )}
      <View style={{ gap: tokens.spacing[2] }}>
        {options.apple === 'native' && <View style={{ gap: tokens.spacing[0] }}>
          {lastUsed === 'apple' && <AppText style={[emphasis(13), { color: color.primary }]}>{t('onb.lastUsed')}</AppText>}
          <AppleButton onPress={() => void signIn('apple')} />
        </View>}
        {options.apple === 'web' && <ProviderButton provider="apple" highlighted={lastUsed === 'apple'} onPress={() => void signIn('apple')} />}
        {options.kakao && <ProviderButton provider="kakao" highlighted={lastUsed === 'kakao'} onPress={() => void signIn('kakao')} />}
        {/* Development builds only (EXPO_PUBLIC_DEV_EMAIL_LOGIN); never part of the product sign-in. */}
        {options.devEmail && <Button label={t('login.email')} variant="secondary" icon="mail" onPress={() => setState({ kind: 'email', invalid: false, sending: false, failed: false })} />}
      </View>
    </Screen>
  );
}
