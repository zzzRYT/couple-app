import { useState } from 'react';
import { Image, View, type ViewStyle } from 'react-native';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { graphemes } from '../onboarding/ProfileScreen';
import { useProfiles } from '../space/profiles';
import { OWNER_COLOR, type Owner } from './model';

/** An owner's face: their profile photo, else their color with the first letter of their name, or a heart for 함께. Hidden from screen readers because a name always sits next to it. */
export function Avatar({ owner, name, size, style }: { owner: Owner; name: string; size: number; style?: ViewStyle }) {
  const color = useAppColor(); const { emphasis } = useType(); const profiles = useProfiles();
  const [failed, setFailed] = useState<string | null>(null);
  const photo = owner === 'together' ? null : profiles?.[owner].photo ?? null;
  const fontSize = Math.round(size * 0.58);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: color[OWNER_COLOR[owner]] }, style]}>
    {photo && photo !== failed ? <Image testID="avatar-photo" source={{ uri: photo }} resizeMode="cover" onError={() => setFailed(photo)} style={{ width: size, height: size }} />
      : owner === 'together' ? <Icon name="heart" size={Math.round(size * 0.62)} color={color.onPrimary} fill={color.onPrimary} />
      : <AppText allowFontScaling={false} style={[emphasis(fontSize), { lineHeight: size, color: color.onPrimary }]}>{graphemes(name)[0]}</AppText>}
  </View>;
}
