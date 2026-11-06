import * as Clipboard from 'expo-clipboard';
import { usePassword } from '../features/auth/PasswordContext';
import { SetPasswordFlow } from '../features/auth/SetPasswordFlow';
import { useApp } from '../lib/AppContext';

/** V0-auth-setpw-prompt after a first Apple sign-in. Either way the prompt is answered, so it never comes back. */
export default function SetPasswordPromptRoute() {
  const { password } = useApp();
  const { state, markPromptSeen, reload } = usePassword();
  return <SetPasswordFlow password={password} email={state?.email ?? ''} copy={Clipboard.setStringAsync} onLater={() => void markPromptSeen()} onDone={() => { void markPromptSeen().then(reload); }} />;
}
