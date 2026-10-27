import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { ProviderButton } from './ProviderButton';
import { EMAIL_PATTERN, type AuthPort, type Provider } from './authPort';
const color = tokens.color.app.light.normal;
type State = { kind: 'choose' } | { kind: 'redirect'; provider: 'kakao' | 'apple' } | { kind: 'cancelled' | 'error'; provider: 'kakao' | 'apple' } | { kind: 'email'; invalid: boolean; sending: boolean; failed: boolean };
export function LoginScreen({ auth, lastUsed, onDone, onEmail }: { auth: AuthPort; lastUsed?: Provider; onDone: () => void; onEmail: (email: string) => void }) {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ kind: 'choose' });
  const [email, setEmail] = useState('');
  async function oauth(provider: 'kakao' | 'apple') {
    setState({ kind: 'redirect', provider });
    const result = await auth.oauth(provider).catch(() => 'error' as const);
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
      <Text style={{ color: color.text2 }}>{t('login.redirect.body')}</Text>
      <Button label={t('login.cancel')} variant="ghost" onPress={() => setState({ kind: 'cancelled', provider: state.provider })} />
    </View>;
  }
  return (
    <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('login.title')}</Text>
      {(state.kind === 'cancelled' || state.kind === 'error') && <View style={{ gap: 8 }}>
        <Banner kind={state.kind === 'error' ? 'danger' : 'info'} text={t(`login.${state.kind}.title`)} />
        <Text style={{ color: color.text2 }}>{t(`login.${state.kind}.body`)}</Text>
        <Button label={t('common.retry')} variant="secondary" onPress={() => void oauth(state.provider)} />
      </View>}
      {state.kind === 'email' ? <View style={{ gap: 8 }}>
        <Text style={{ color: color.text }}>{t('login.email.title')}</Text>
        <TextField label={t('login.email.label')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        {state.invalid && <Banner kind="warn" text={t('login.email.invalid')} />}
        {state.failed && <Banner kind="danger" text={t('login.error.body')} />}
        {state.sending ? <CycleLoader label={t('login.processing')} /> : <Button label={t('login.email.send')} onPress={() => void send()} />}
        <Button label={t('login.other')} variant="ghost" onPress={() => setState({ kind: 'choose' })} />
      </View> : <View style={{ gap: 12 }}>
        <ProviderButton provider="kakao" highlighted={lastUsed === 'kakao'} onPress={() => void oauth('kakao')} />
        <ProviderButton provider="apple" highlighted={lastUsed === 'apple'} onPress={() => void oauth('apple')} />
        {lastUsed === 'email' && <Text style={{ color: color.primary }}>{t('onb.lastUsed')}</Text>}
        <Button label={t('login.email')} variant={lastUsed === 'email' ? 'primary' : 'secondary'} onPress={() => setState({ kind: 'email', invalid: false, sending: false, failed: false })} />
      </View>}
    </View>
  );
}
