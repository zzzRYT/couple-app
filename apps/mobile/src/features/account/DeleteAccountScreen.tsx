import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, BottomSheet, Button, Card, Screen, TextField } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { authOptions as defaultOptions, type AuthOptions } from '../../config/auth';
import { AppleButton } from '../auth/AppleButton';
import { ProviderButton } from '../auth/ProviderButton';
import type { Provider } from '../auth/authPort';
import type { PasswordPort } from '../auth/passwordPort';
import { CheckRow, ContactButton, PasswordField } from '../auth/passwordUi';
import type { Reauth, ReauthPort, ReauthResult, SubmitResult } from './deleteAccount';
import { posthog } from '../../config/posthog';

type Phase = 'explain' | 'reauth' | 'password' | 'forgot' | 'appleMore' | 'progress';
/** What the V0-09 sheets need. `apple` is an account with an Apple identity, whatever else it holds. */
export type DeleteCredentials = { hasPassword: boolean; apple: boolean; email: string | null; mail: boolean; password: Pick<PasswordPort, 'verify' | 'requestReset'> };
/** Sign-in methods offered for re-authentication: the account's own provider when this build offers it, otherwise every offered one. */
export function reauthChoices(options: AuthOptions, provider?: Provider): Provider[] {
  const offered: Provider[] = [...(options.kakao ? ['kakao' as const] : []), ...(options.apple === 'native' ? ['apple' as const] : []), ...(options.devEmail ? ['email' as const] : [])];
  return provider && offered.includes(provider) ? [provider] : offered;
}
/**
 * S13 account deletion: consequences and a checkmark, then sign in again (same login UI), then the request. Nothing is sent
 * offline and nothing is queued; before acceptance a failure changes nothing. No days, no restore and no grace period are shown.
 * With a password the V0-09 sheets replace the Apple step; an Apple account still ends with its token revoked (V0-del-apple-more).
 */
export function DeleteAccountScreen({ reauth, onSubmit, onFinished, onCancel, provider, credentials, options = defaultOptions, v0 = false }: {
  reauth: ReauthPort; onSubmit: (reauth: Reauth) => Promise<SubmitResult>; onFinished: (outcome: 'accepted' | 'signedOut') => Promise<void>;
  onCancel: () => void; provider?: Provider; credentials?: DeleteCredentials; options?: AuthOptions; v0?: boolean;
}) {
  const color = useAppColor();
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const [phase, setPhase] = useState<Phase>('explain');
  const [banner, setBanner] = useState<'fail' | 'offline' | null>(null);
  const [reauthFailed, setReauthFailed] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState('');
  const [check, setCheck] = useState<'idle' | 'busy' | 'wrong' | 'locked' | 'error'>('idle');
  const [resetMail, setResetMail] = useState<'idle' | 'busy' | 'sent' | 'failed'>('idle');
  const choices = reauthChoices(options, provider);

  async function confirmIdentity(run: () => Promise<ReauthResult>) {
    setReauthFailed(false);
    const result = await run().catch((): ReauthResult => ({ kind: 'error' }));
    if (result.kind === 'cancelled') return;
    if (result.kind === 'error') { setReauthFailed(true); return; }
    await submit(result.reauth);
  }
  async function submit(input: Reauth) {
    setPhase('progress');
    const outcome = await onSubmit(input);
    if (outcome === 'accepted' || outcome === 'signedOut') { posthog?.capture('account_deletion_completed'); await onFinished(outcome); return; }
    if (outcome === 'appleRequired') { setPhase('appleMore'); return; }
    if (outcome === 'reauthFailed') { setReauthFailed(true); setEmailSent(false); setPhase('reauth'); return; }
    setBanner(outcome === 'offline' ? 'offline' : 'fail');
    setPhase('explain');
  }
  async function confirmPassword() {
    if (!credentials) return;
    setCheck('busy');
    const result = await credentials.password.verify(secret).catch(() => 'error' as const);
    setSecret('');
    if (result === 'ok') { setCheck('idle'); await submit({ provider: 'password' }); } else setCheck(result);
  }
  /** V0-del-email-forgot: the reset mail goes from the sheet itself; the sent line reads the same whether or not the address has an account. */
  async function sendReset() {
    if (!credentials?.email) return;
    setResetMail('busy');
    setResetMail(await credentials.password.requestReset(credentials.email).catch(() => false) ? 'sent' : 'failed');
  }
  async function sendEmail() {
    setReauthFailed(false);
    if (await reauth.sendEmailCode().catch(() => false)) setEmailSent(true); else setReauthFailed(true);
  }

  const byPassword = v0 && !!credentials?.hasPassword;
  const byApple = v0 && !byPassword && (credentials?.apple ?? true);
  const apple = !!credentials?.apple;
  const locked = check === 'locked';
  const account = t('acct.delete.reauth.account', { provider: apple ? 'Apple' : t('acct.provider.email'), email: credentials?.email ?? '' });
  const appleConfirm = <Button label={t('acct.delete.reauth.forgot.oauth')} variant="apple" icon="apple" onPress={() => void confirmIdentity(reauth.apple)} />;
  const cancelSheet = <Button label={t('common.cancel')} variant="ghost" onPress={() => setPhase('explain')} />;
  if (phase === 'progress') {
    return <Screen center><CycleLoader label={t('acct.delete.progress')} /></Screen>;
  }
  return (
    <Screen onBack={onCancel} footer={<>
      <Button label={banner === 'fail' ? t('common.retry') : byPassword ? t('set.delete.cta') : byApple ? t('set.delete.reauth', { provider: 'Apple' }) : t('acct.delete.confirm')} variant="danger" icon={byApple && banner !== 'fail' ? 'apple' : undefined} disabled={!checked} onPress={() => { setBanner(null); setReauthFailed(false); if (byPassword) { setCheck('idle'); setPhase('password'); } else if (byApple) void confirmIdentity(reauth.apple); else setPhase('reauth'); }} />
      <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
    </>}>
      <AppText variant="title" accessibilityRole="header">{t(v0 ? 'set.delete.title' : 'acct.delete.title')}</AppText>
      <AppText tone="text2">{t(v0 ? 'set.delete.body' : 'acct.delete.lead')}</AppText>
      <Card style={{ gap: tokens.spacing[2] + 4 }}>
        {(v0 ? ['set.delete.i1', 'set.delete.i2', 'set.delete.i3'] : ['acct.delete.b1', 'acct.delete.b2', 'acct.delete.b3']).map((key) => (
          <View key={key} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ paddingTop: 3 }}><Icon name="warn" size={18} color={color.danger} /></View>
            <AppText style={{ flex: 1 }}>{t(key)}</AppText>
          </View>
        ))}
      </Card>
      <CheckRow label={t(v0 ? 'set.confirm.check' : 'end.check')} checked={checked} onToggle={() => setChecked((value) => !value)} />
      {byApple && <AppText variant="bodySm" tone="text2">{t('set.delete.apple.note')}</AppText>}
      {banner === 'offline' && <Banner kind="offline" text={t('acct.delete.offline')} />}
      {banner === 'fail' && <Banner kind="danger" text={t('acct.delete.fail.title')} body={t('acct.delete.fail.body')} />}
      {/* V0-del-pw-rate / V0-del-email-rate: the sheet keeps its lines and a field that cannot be typed in, under a yellow lock notice. */}
      <BottomSheet visible={phase === 'password'} title={t('acct.delete.reauth.title')} onClose={() => setPhase('explain')}>
        <AppText tone="text2">{t(apple ? 'acct.delete.reauth.body' : 'acct.delete.reauth.body.email')}</AppText>
        <AppText variant="bodySm" tone="text2">{account}</AppText>
        <PasswordField label={t(apple ? 'set.security.pwLabel' : 'login.pw.label')} value={secret} onChangeText={setSecret} editable={!locked} error={check === 'wrong' ? t('acct.delete.reauth.wrong') : null} />
        {locked && <Banner kind="warn" quiet text={t(apple ? 'acct.delete.reauth.rate' : 'auth.login.rate')} />}
        {reauthFailed && <Banner kind="danger" text={t('acct.delete.reauth.fail')} />}
        {check === 'error' && <Banner kind="danger" text={t('acct.delete.fail.title')} body={t('acct.delete.fail.body')} />}
        {locked && apple
          ? <>{appleConfirm}{cancelSheet}</>
          : <>
            <Button label={t('login.pw.forgot')} variant="ghost" onPress={() => setPhase('forgot')} />
            {apple && <AppText variant="bodySm" tone="text2">{t('acct.delete.reauth.apple')}</AppText>}
            <Button label={t('acct.delete.reauth.submit')} variant="danger" loading={check === 'busy'} disabled={secret.length === 0 || locked} onPress={() => void confirmPassword()} />
            {locked && cancelSheet}
          </>}
      </BottomSheet>
      <BottomSheet visible={phase === 'forgot'} title={t('acct.delete.reauth.forgot.title')} onClose={() => setPhase('explain')}>
        <AppText tone="text2">{t(apple ? 'acct.delete.reauth.forgot.body' : credentials?.mail ? 'acct.delete.reauth.forgot.mail' : 'acct.delete.reauth.forgot.nomail')}</AppText>
        {reauthFailed && <Banner kind="danger" text={t('acct.delete.reauth.fail')} />}
        {resetMail === 'sent' && <Banner kind="success" text={t('login.reset.sent.title')} body={t('login.reset.sent.body', { email: credentials?.email ?? '' })} />}
        {resetMail === 'failed' && <Banner kind="danger" text={t('state.error.body')} />}
        {apple ? appleConfirm : credentials?.mail ? <Button label={t('login.reset.send')} loading={resetMail === 'busy'} onPress={() => void sendReset()} /> : <ContactButton />}
        {cancelSheet}
      </BottomSheet>
      <BottomSheet visible={phase === 'appleMore'} title={t('acct.delete.apple.more.title')} onClose={() => setPhase('explain')}>
        <AppText tone="text2">{t('acct.delete.apple.more.body')}</AppText>
        {reauthFailed && <Banner kind="danger" text={t('acct.delete.reauth.fail')} />}
        {appleConfirm}
        {cancelSheet}
      </BottomSheet>
      <BottomSheet visible={phase === 'reauth'} title={t('acct.delete.reauth.title')} onClose={() => setPhase('explain')}>
        <AppText tone="text2">{t('acct.delete.reauth.body')}</AppText>
        {reauthFailed && <Banner kind="danger" text={t('acct.delete.reauth.fail')} />}
        {choices.includes('kakao') && <ProviderButton provider="kakao" onPress={() => void confirmIdentity(reauth.kakao)} />}
        {choices.includes('apple') && <AppleButton onPress={() => void confirmIdentity(reauth.apple)} />}
        {choices.includes('email') && (emailSent
          ? <>
            <TextField label={t('login.code.label')} value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" />
            <Button label={t('login.code.confirm')} disabled={code.trim().length === 0} onPress={() => void confirmIdentity(() => reauth.verifyEmailCode(code.trim()))} />
          </>
          : <Button label={t('login.email')} variant="secondary" icon="mail" onPress={() => void sendEmail()} />)}
      </BottomSheet>
    </Screen>
  );
}
