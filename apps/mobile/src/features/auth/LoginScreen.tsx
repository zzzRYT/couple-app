import { useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Screen, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { IconTile } from '../../ui/IconTile';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import { authOptions as defaultOptions, type AuthOptions } from '../../config/auth';
import { AppleButton } from './AppleButton';
import { DevQuickLogin } from './devQuickLogin';
import type { createSupabase } from '../../lib/supabase';
import { ProviderButton } from './ProviderButton';
import { EMAIL_PATTERN, type AuthPort, type Provider } from './authPort';
import { mascotPoses } from '../../scene/catalog';

type OAuthProvider = 'kakao' | 'apple';
const features = [['start.intro.f1', 'annivDays', 'peach'], ['start.intro.f2', 'annivBirthday', 'butter'], ['start.intro.f3', 'annivCustom', 'lav']] as const;
type State = { kind: 'choose' } | { kind: 'finishing' } | { kind: 'redirect'; provider: OAuthProvider } | { kind: 'cancelled' | 'error'; provider: OAuthProvider } | { kind: 'email'; invalid: boolean; sending: boolean; failed: boolean };
function Legal() {
  const { t } = useTranslation();
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <AppText variant="caption" tone="text2" align="center">{t('start.intro.terms')}</AppText>
      <AppText variant="caption" tone="text2" align="center">{t('onb.age')}</AppText>
    </View>
  );
}
/** V0-start-intro: Sign in with Apple first, then email and password (V0-08); the email OTP flow exists only in development builds. */
export function LoginScreen({ auth, lastUsed, onDone, onEmail, onEmailLogin, onBack, notice, quickLoginClient, options = defaultOptions }: { auth: AuthPort; lastUsed?: Provider; onDone: () => void; onEmail: (email: string) => void; onEmailLogin?: () => void; onBack?: () => void; notice?: string; quickLoginClient?: ReturnType<typeof createSupabase>; options?: AuthOptions }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const { emphasis } = useType();
  const [state, setState] = useState<State>({ kind: 'choose' });
  const [email, setEmail] = useState('');
  async function signIn(provider: OAuthProvider) {
    // Native Sign in with Apple has no page of its own: the system sheet opens over this screen (V0-start-intro-apple),
    // which shows progress only once the sheet has answered (V0-start-intro-busy).
    const native = provider === 'apple' && options.apple === 'native';
    setState(native ? { kind: 'choose' } : { kind: 'redirect', provider });
    const run = native ? auth.apple(() => setState({ kind: 'finishing' })) : auth.oauth(provider);
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
      <Screen onBack={state.sending ? undefined : () => setState({ kind: 'choose' })} footer={<>
        <Button label={t('login.email.send')} loading={state.sending} onPress={() => void send()} />
        <Button label={t('login.other')} variant="ghost" disabled={state.sending} onPress={() => setState({ kind: 'choose' })} />
      </>}>
        <AppText variant="title" accessibilityRole="header">{t('login.email.title')}</AppText>
        <TextField label={t('login.email.label')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus
          error={state.invalid ? t('login.email.invalid') : null} onSubmitEditing={() => void send()} returnKeyType="send" />
        {state.failed && <Banner kind="danger" text={t('login.error.title')} body={t('login.error.body')} />}
      </Screen>
    );
  }
  const finishing = state.kind === 'finishing';
  return (
    <Screen onBack={finishing ? undefined : onBack} footer={<>
      <View style={{ gap: tokens.spacing[2] }}>
        {options.apple === 'native' && <View pointerEvents={finishing ? 'none' : 'auto'} style={{ gap: tokens.spacing[0], opacity: finishing ? 0.5 : 1 }}>
          {lastUsed === 'apple' && <AppText style={[emphasis(13), { color: color.primary }]}>{t('onb.lastUsed')}</AppText>}
          <AppleButton onPress={() => void signIn('apple')} />
        </View>}
        {options.apple === 'web' && <ProviderButton provider="apple" highlighted={lastUsed === 'apple'} onPress={() => void signIn('apple')} />}
        {options.kakao && <ProviderButton provider="kakao" highlighted={lastUsed === 'kakao'} onPress={() => void signIn('kakao')} />}
        {onEmailLogin && <Button label={t('auth.email.entry')} variant="secondary" disabled={finishing} onPress={onEmailLogin} />}
        {/* Development builds only (EXPO_PUBLIC_DEV_EMAIL_LOGIN); never part of the product sign-in. */}
        {options.devEmail && <Button label={t('login.email')} variant="secondary" icon="mail" disabled={finishing} onPress={() => setState({ kind: 'email', invalid: false, sending: false, failed: false })} />}
      </View>
      {quickLoginClient && <DevQuickLogin client={quickLoginClient} onDone={onDone} />}
      <Legal />
    </>}>
      <View style={{ alignItems: 'center', gap: 2, paddingTop: tokens.spacing[2] }}>
        <Image accessibilityLabel={t('mascot.alt.wave')} source={mascotPoses.wave_main} resizeMode="contain" style={{ width: 150, height: 150 }} />
        <AppText variant="title" align="center">{t('app.name')}</AppText>
        <AppText variant="caption" tone="text2" align="center">{t('app.slogan')}</AppText>
      </View>
      <AppText variant="title" align="center" accessibilityRole="header" style={{ fontSize: 26, lineHeight: 33 }}>{t('start.intro.title')}</AppText>
      {finishing ? <CycleLoader label={t('login.processing')} />
        : <View style={{ gap: tokens.spacing[2], paddingHorizontal: tokens.spacing[1] }}>{features.map(([key, icon, face]) => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2] }}><IconTile icon={icon} face={face} /><AppText style={{ flex: 1 }}>{t(key)}</AppText></View>)}</View>}
      {notice && state.kind === 'choose' && <Banner kind="success" text={notice} />}
      {(state.kind === 'cancelled' || state.kind === 'error') && (
        <Banner kind={state.kind === 'error' ? 'danger' : 'info'} text={t(`login.${state.kind}.title`)} body={t(`login.${state.kind}.body`)} action={{ label: t('common.retry'), onPress: () => void signIn(state.provider) }} />
      )}
    </Screen>
  );
}
