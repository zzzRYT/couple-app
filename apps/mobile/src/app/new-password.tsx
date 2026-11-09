import { useState } from 'react';
import { usePassword } from '../features/auth/PasswordContext';
import { LinkExpiredScreen, NewPasswordScreen } from '../features/auth/ResetScreens';
import { useApp } from '../lib/AppContext';

/** V0-auth-newpw. Leaving without saving signs the link's session out, so the old password keeps working; a new mail is asked for from V0-auth-reset once signed out. */
export default function NewPasswordRoute() {
  const { auth, password, session } = useApp();
  const { setRecovery, setPendingReset, reload } = usePassword();
  const [expired, setExpired] = useState(false);
  const email = session?.user.email ?? '';
  const leave = () => { setRecovery(false); void auth.signOut(); };
  if (expired) return <LinkExpiredScreen onResend={() => { setPendingReset(email); leave(); }} onBack={leave} />;
  return <NewPasswordScreen password={password} email={email} onExpired={() => setExpired(true)} onBack={leave} onSaved={() => { setRecovery(false); void reload(); }} />;
}
