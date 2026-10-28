import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColor } from '../../theme/useAppColor';

export default function Layout() {
  const color = useAppColor();
  return <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}><Slot /></SafeAreaView>;
}
