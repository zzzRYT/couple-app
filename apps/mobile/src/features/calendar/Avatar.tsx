import { View, type ViewStyle } from 'react-native';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText } from '../../ui/components';
import { graphemes } from '../onboarding/ProfileScreen';
import { PERSON_COLOR, type Person } from './model';

/** A person's face: their color with the first letter of their name. Hidden from screen readers because a name always sits next to it. */
export function Avatar({ person, name, size, style }: { person: Person; name: string; size: number; style?: ViewStyle }) {
  const color = useAppColor(); const { emphasis } = useType();
  const fontSize = Math.round(size * 0.58);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: color[PERSON_COLOR[person]] }, style]}>
    <AppText allowFontScaling={false} style={[emphasis(fontSize), { lineHeight: size, color: color.onPrimary }]}>{graphemes(name)[0]}</AppText>
  </View>;
}
