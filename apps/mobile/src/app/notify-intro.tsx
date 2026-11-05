import { router } from 'expo-router';
import { PrePromptScreen } from '../features/notifications/PrePromptScreen';
import { useApp } from '../lib/AppContext';
export default function NotifyIntroRoute() {
  const { userId } = useApp();
  return <PrePromptScreen userId={userId} onDone={() => router.dismissTo('/home')} />;
}
