import { Slot } from 'expo-router';
import { View } from 'react-native';
import { useAppColor } from '../../theme/useAppColor';

/** Screens own their safe-area insets (ui/components Screen), so the group only paints the background. */
export default function Layout() {
  const color = useAppColor();
  return <View style={{ flex: 1, backgroundColor: color.bg }}><Slot /></View>;
}
