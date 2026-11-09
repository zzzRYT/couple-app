import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, BottomSheet, Button } from '../../ui/components';
import { usePassword } from '../../features/auth/PasswordContext';
import { SecurityScreen } from '../../features/settings/SecurityScreen';
import { useApp } from '../../lib/AppContext';
import { supabaseReauth } from '../../lib/reauth';

/**
 * Settings › 로그인·보안, and V0-sec-forgot for an Apple account: Apple again, then a new password with no mail.
 * The change screen comes back here with `saved` (the toast) or `forgot` (the sheet); each visit carries a new value, so
 * returning to this screen while it is still mounted shows them again.
 */
export default function SecurityRoute() {
  const { t } = useTranslation();
  const { supabase, client } = useApp();
  const { state, apple, reload } = usePassword();
  const { saved, forgot: askForgot } = useLocalSearchParams<{ saved?: string; forgot?: string }>();
  const [toast, setToast] = useState(false);
  const [forgot, setForgot] = useState(false);
  const reauth = useMemo(() => supabaseReauth(supabase), [supabase]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  useEffect(() => { if (saved) setToast(true); }, [saved]);
  useEffect(() => { if (askForgot) setForgot(true); }, [askForgot]);
  async function confirmApple() {
    const result = await reauth.apple();
    if (result.kind !== 'ok') return;
    if (result.reauth.authorizationCode) void client.storeAppleToken(result.reauth.authorizationCode).catch(() => undefined);
    setForgot(false);
    router.push('/settings/set-password');
  }
  return <>
    <SecurityScreen state={state} apple={apple} saved={toast} copy={Clipboard.setStringAsync} onBack={() => router.back()} onSavedHidden={() => setToast(false)}
      onAction={(action) => {
        if (action === 'create') router.push('/settings/set-password');
        else if (action === 'change') router.push('/settings/change-password');
        else if (apple) setForgot(true);
        else router.push({ pathname: '/settings/reset-password', params: { email: state?.email ?? '' } });
      }} />
    <BottomSheet visible={forgot} title={t('acct.delete.reauth.forgot.title')} onClose={() => setForgot(false)}>
      <AppText tone="text2">{t('set.pw.forgot.body')}</AppText>
      <Button label={t('acct.delete.reauth.forgot.oauth')} variant="apple" icon="apple" onPress={() => void confirmApple()} />
      <Button label={t('common.cancel')} variant="ghost" onPress={() => setForgot(false)} />
    </BottomSheet>
  </>;
}
