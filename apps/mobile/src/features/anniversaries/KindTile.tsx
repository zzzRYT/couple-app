import { View } from 'react-native';
import type { Occurrence } from '../../lib/anniversaries';
import { Icon, type IconName } from '../../ui/Icon';
/** Boards draw the tile at 34 (home rows), 40 (list rows), 48 (home next card) and 64 (detail); corner and glyph scale with it. */
export function KindTile({ item, size = 40 }: { item: Occurrence; size?: number }) {
  const choices: Record<Occurrence['kind'], [IconName, string]> = { days: ['annivDays', '#F4B79B'], years: ['annivYears', '#F2A7B4'], birthday: ['annivBirthday', '#F7D98B'], season: item.seasonId === 'pepero' ? ['annivPepero', '#AACBE2'] : ['annivChristmas', '#A8C6A0'], custom: ['annivCustom', '#C9B8E8'] };
  const [name, backgroundColor] = choices[item.kind];
  return <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.33), borderWidth: 1.5, borderColor: '#4A3426', backgroundColor, alignItems: 'center', justifyContent: 'center' }}><Icon name={name} size={Math.round(size * 0.55)} color="#4A3426" /></View>;
}
