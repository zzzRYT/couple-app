import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { Screen } from '../ui/components';
import { CycleLoader } from '../ui/CycleLoader';
import { parseAuthLink } from '../features/auth/passwordPort';
import { usePassword } from '../features/auth/PasswordContext';
import { LinkExpiredScreen } from '../features/auth/ResetScreens';
import { useApp } from '../lib/AppContext';

/** Where confirmation and reset mail links return. V0-auth-link-exp when the link no longer works. */
export default function AuthCallbackRoute() {
  const { t } = useTranslation();
  const { supabase } = useApp();
  const { setRecovery } = usePassword();
  const url = Linking.useLinkingURL();
  const [outcome, setOutcome] = useState<'working' | 'expired' | 'done'>('working');
  useEffect(() => {
    if (!url) return;
    const link = parseAuthLink(url);
    if (link.kind === 'none') { setOutcome('done'); return; }
    if (link.kind === 'expired') { setOutcome('expired'); return; }
    if (link.recovery) setRecovery(true);
    void supabase.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken }).then(({ error }) => {
      if (error) { setRecovery(false); setOutcome('expired'); } else setOutcome('done');
    });
  }, [url, supabase, setRecovery]);
  if (outcome === 'done') return <Redirect href="/" />;
  if (outcome === 'expired') return <LinkExpiredScreen onResend={() => router.replace('/reset')} onBack={() => router.replace('/')} />;
  return <Screen center><CycleLoader label={t('login.processing')} /></Screen>;
}
