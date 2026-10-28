import { useAppColor } from '../../theme/useAppColor';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { authOptions as defaultOptions, type AuthOptions } from '../../config/auth';
import { AppleButton } from './AppleButton';
import { ProviderButton } from './ProviderButton';
import { EMAIL_PATTERN, type AuthPort, type Provider } from './authPort';

type OAuthProvider = 'kakao' | 'apple';
type State = { kind: 'choose' } | { kind: 'redirect'; provider: OAuthProvider } | { kind: 'cancelled' | 'error'; provider: OAuthProvider } | { kind: 'email'; invalid: boolean; sending: boolean; failed: boolean };
export function LoginScreen({ auth, lastUsed, onDone, onEmail, options = defaultOptions }: { auth: AuthPort; lastUsed?: Provider; onDone: () => void; onEmail: (email: string) => void; options?: AuthOptions }) {
  const color = useAppColor();
  const { t } = useTranslation();
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
    return <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center', backgroundColor: color.bg }}>
      <CycleLoader label={t('login.processing')} />
      <Text accessibilityRole="header" style={{ color: color.text }}>{t(state.provider === 'kakao' ? 'login.redirect.title' : 'login.processing')}</Text>
      {state.provider === 'kakao' && <Text style={{ color: color.text2 }}>{t('login.redirect.body')}</Text>}
      <Button label={t('login.cancel')} variant="ghost" onPress={() => setState({ kind: 'cancelled', provider: state.provider })} />
    </View>;
  }
  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2] }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('login.title')}</Text>
      {(state.kind === 'cancelled' || state.kind === 'error') && <View style={{ gap: 8 }}>
        <Banner kind={state.kind === 'error' ? 'danger' : 'info'} text={t(`login.${state.kind}.title`)} />
        <Text style={{ color: color.text2 }}>{t(`login.${state.kind}.body`)}</Text>
        <Button label={t('common.retry')} variant="secondary" onPress={() => void signIn(state.provider)} />
      </View>}
      {state.kind === 'email' && options.devEmail ? <View style={{ gap: 8 }}>
        <Text style={{ color: color.text }}>{t('login.email.title')}</Text>
        <TextField label={t('login.email.label')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        {state.invalid && <Banner kind="warn" text={t('login.email.invalid')} />}
        {state.failed && <Banner kind="danger" text={t('login.error.body')} />}
        {state.sending ? <CycleLoader label={t('login.processing')} /> : <Button label={t('login.email.send')} onPress={() => void send()} />}
        <Button label={t('login.other')} variant="ghost" onPress={() => setState({ kind: 'choose' })} />
      </View> : <View style={{ gap: 12 }}>
        {options.apple === 'native' && <View style={{ gap: 2 }}>
          {lastUsed === 'apple' && <Text style={{ color: color.primary }}>{t('onb.lastUsed')}</Text>}
          <AppleButton onPress={() => void signIn('apple')} />
        </View>}
        {options.apple === 'web' && <ProviderButton provider="apple" highlighted={lastUsed === 'apple'} onPress={() => void signIn('apple')} />}
        {options.kakao && <ProviderButton provider="kakao" highlighted={lastUsed === 'kakao'} onPress={() => void signIn('kakao')} />}
        {/* Development builds only (EXPO_PUBLIC_DEV_EMAIL_LOGIN); never part of the product sign-in. */}
        {options.devEmail && <Button label={t('login.email')} variant="ghost" onPress={() => setState({ kind: 'email', invalid: false, sending: false, failed: false })} />}
      </View>}
    </ScrollView>
  );
}
