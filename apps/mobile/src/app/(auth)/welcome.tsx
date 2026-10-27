import { router } from 'expo-router';
import { Welcome } from '../../features/auth/Welcome';
export default function WelcomeRoute() {
  return <Welcome onStart={() => router.push('/login')} onHasAccount={() => router.push({ pathname: '/login', params: { returning: '1' } })} />;
}
