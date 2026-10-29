import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, BottomSheet, Button, Screen, TextField } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { authOptions as defaultOptions, type AuthOptions } from '../../config/auth';
import { AppleButton } from '../auth/AppleButton';
import { ProviderButton } from '../auth/ProviderButton';
import type { Provider } from '../auth/authPort';
import type { Reauth, ReauthPort, ReauthResult, SubmitResult } from './deleteAccount';

type Phase = 'explain' | 'reauth' | 'progress';
/** Sign-in methods offered for re-authentication: the account's own provider when this build offers it, otherwise every offered one. */
export function reauthChoices(options: AuthOptions, provider?: Provider): Provider[] {
  const offered: Provider[] = [...(options.kakao ? ['kakao' as const] : []), ...(options.apple === 'native' ? ['apple' as const] : []), ...(options.devEmail ? ['email' as const] : [])];
  return provider && offered.includes(provider) ? [provider] : offered;
}
/**
 * S13 account deletion: consequences and a checkmark, then sign in again (same login UI), then the request. Nothing is sent
 * offline and nothing is queued; before acceptance a failure changes nothing. No days, no restore and no grace period are shown.
 */
export function DeleteAccountScreen({ reauth, onSubmit, onFinished, onCancel, provider, options = defaultOptions }: {
  reauth: ReauthPort; onSubmit: (reauth: Reauth) => Promise<SubmitResult>; onFinished: (outcome: 'accepted' | 'signedOut') => Promise<void>;
  onCancel: () => void; provider?: Provider; options?: AuthOptions;
}) {
  const color = useAppColor();
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const [phase, setPhase] = useState<Phase>('explain');
  const [banner, setBanner] = useState<'fail' | 'offline' | null>(null);
  const [reauthFailed, setReauthFailed] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState('');
  const choices = reauthChoices(options, provider);

  async function confirmIdentity(run: () => Promise<ReauthResult>) {
    setReauthFailed(false);
    const result = await run().catch((): ReauthResult => ({ kind: 'error' }));
    if (result.kind === 'cancelled') return;
    if (result.kind === 'error') { setReauthFailed(true); return; }
    setPhase('progress');
    const outcome = await onSubmit(result.reauth);
    if (outcome === 'accepted' || outcome === 'signedOut') { await onFinished(outcome); return; }
    if (outcome === 'reauthFailed') { setReauthFailed(true); setEmailSent(false); setPhase('reauth'); return; }
    setBanner(outcome === 'offline' ? 'offline' : 'fail');
    setPhase('explain');
  }
  async function sendEmail() {
    setReauthFailed(false);
    if (await reauth.sendEmailCode().catch(() => false)) setEmailSent(true); else setReauthFailed(true);
  }

  if (phase === 'progress') {
    return <Screen center><CycleLoader label={t('acct.delete.progress')} /></Screen>;
  }
  return (
    <Screen onBack={onCancel} footer={<>
      <Button label={banner === 'fail' ? t('common.retry') : t('acct.delete.confirm')} variant="danger" disabled={!checked} onPress={() => { setBanner(null); setReauthFailed(false); setPhase('reauth'); }} />
      <Button label={t('end.cancel')} variant="ghost" onPress={onCancel} />
    </>}>
      <AppText variant="title" accessibilityRole="header">{t('acct.delete.title')}</AppText>
      <AppText tone="text2">{t('acct.delete.lead')}</AppText>
      <View style={{ gap: tokens.spacing[2], padding: tokens.spacing[4], borderRadius: tokens.radius.card, borderWidth: tokens.border.outline.normal, borderColor: color.danger, backgroundColor: color.dangerBg }}>
        {(['acct.delete.b1', 'acct.delete.b2', 'acct.delete.b3'] as const).map((key) => (
          <View key={key} style={{ flexDirection: 'row', gap: tokens.spacing[2] }}>
            <View style={{ paddingTop: 2 }}><Icon name={key === 'acct.delete.b3' ? 'warn' : 'check'} size={20} color={color.danger} /></View>
            <AppText style={{ flex: 1 }}>{t(key)}</AppText>
          </View>
        ))}
      </View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={t('end.check')} onPress={() => setChecked((value) => !value)}
        style={{ minHeight: tokens.touch.minimum, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2] }}>
        <View style={{ width: 24, height: 24, borderWidth: tokens.border.outline.normal, borderColor: color.line, borderRadius: 8, backgroundColor: checked ? color.danger : color.surface, alignItems: 'center', justifyContent: 'center' }}>
          {checked && <Icon name="check" size={16} color={color.onDanger} />}
        </View>
        <AppText style={{ flexShrink: 1 }}>{t('end.check')}</AppText>
      </Pressable>
      {banner === 'offline' && <Banner kind="offline" text={t('acct.delete.offline')} />}
      {banner === 'fail' && <Banner kind="danger" text={t('acct.delete.fail.title')} body={t('acct.delete.fail.body')} />}
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
