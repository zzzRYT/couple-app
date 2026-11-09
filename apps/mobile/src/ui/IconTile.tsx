import { View } from 'react-native';
import { tokens } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

const { outline, palette } = tokens.color.illustration;
export type TileFace = keyof typeof palette;
/** Pastel icon tile (V0-01 §2.5). Like the illustrations, its face and brown outline stay the same in dark mode. */
export function IconTile({ icon, face, size = 36 }: { icon: IconName; face: TileFace; size?: 36 | 48 }) {
  const large = size === 48;
  return (
    <View style={{ width: size, height: size, borderRadius: large ? 16 : 12, borderWidth: 1.5, borderColor: outline, backgroundColor: palette[face], alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={large ? 26 : 20} color={outline} />
    </View>
  );
}
