import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { Screen } from '../ui/components';
import { CycleLoader } from '../ui/CycleLoader';
import { parseAuthLink } from '../features/auth/passwordPort';
import { expiredLink, readLastMail, type ExpiredLink } from '../features/auth/lastMail';
import { usePassword } from '../features/auth/PasswordContext';
import { ConfirmLinkExpiredScreen, LinkExpiredScreen } from '../features/auth/ResetScreens';
import { useApp } from '../lib/AppContext';

/** Where confirmation and reset mail links return. V0-auth-link-exp when the link no longer works, in the confirmation or the reset variant. */
export default function AuthCallbackRoute() {
  const { t } = useTranslation();
  const { supabase, password } = useApp();
  const { setRecovery } = usePassword();
  const url = Linking.useLinkingURL();
  const [outcome, setOutcome] = useState<'working' | 'done' | ExpiredLink>('working');
  useEffect(() => {
    if (!url) return;
    const link = parseAuthLink(url);
    const expire = (recovery: boolean | null) => void readLastMail().then((last) => setOutcome(expiredLink(recovery, last)));
    if (link.kind === 'none') { setOutcome('done'); return; }
    if (link.kind === 'expired') { expire(null); return; }
    if (link.recovery) setRecovery(true);
    void supabase.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken }).then(({ error }) => {
      if (error) { setRecovery(false); expire(link.recovery); } else setOutcome('done');
    });
  }, [url, supabase, setRecovery]);
  if (outcome === 'done') return <Redirect href="/" />;
  if (outcome === 'working') return <Screen center><CycleLoader label={t('login.processing')} /></Screen>;
  const leave = () => router.replace('/');
  if (outcome.kind === 'confirm') return <ConfirmLinkExpiredScreen password={password} email={outcome.email} onSignup={() => router.replace('/signup')} onBack={leave} />;
  return <LinkExpiredScreen onResend={() => router.replace('/reset')} onBack={leave} />;
}
