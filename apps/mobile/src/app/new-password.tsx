import { useState } from 'react';
import { usePassword } from '../features/auth/PasswordContext';
import { LinkExpiredScreen, NewPasswordScreen } from '../features/auth/ResetScreens';
import { useApp } from '../lib/AppContext';

/** V0-auth-newpw. Leaving without saving signs the link's session out, so the old password keeps working. */
export default function NewPasswordRoute() {
  const { auth, password, session } = useApp();
  const { setRecovery, reload } = usePassword();
  const [expired, setExpired] = useState(false);
  const leave = () => { setRecovery(false); void auth.signOut(); };
  if (expired) return <LinkExpiredScreen onResend={leave} onBack={leave} />;
  return <NewPasswordScreen password={password} email={session?.user.email ?? ''} onExpired={() => setExpired(true)} onBack={leave} onSaved={() => { setRecovery(false); void reload(); }} />;
}
