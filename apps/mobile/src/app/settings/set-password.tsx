import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { usePassword } from '../../features/auth/PasswordContext';
import { SetPasswordFlow } from '../../features/auth/SetPasswordFlow';
import { useApp } from '../../lib/AppContext';
/** V0-auth-setpw from settings or the home sheet, and after an Apple check for a forgotten password. */
export default function SetPasswordRoute() {
  const { password } = useApp();
  const { state, reload, markPromptSeen } = usePassword();
  return <SetPasswordFlow start="form" password={password} email={state?.email ?? ''} copy={Clipboard.setStringAsync} onBack={() => router.back()} onLater={() => router.back()} onDone={() => { void markPromptSeen().then(reload); router.back(); }} />;
}
