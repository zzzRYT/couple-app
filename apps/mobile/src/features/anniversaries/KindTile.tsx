import { View } from 'react-native';
import type { Occurrence } from '../../lib/anniversaries';
import { Icon, type IconName } from '../../ui/Icon';
export function KindTile({ item, large = false }: { item: Occurrence; large?: boolean }) {
  const choices: Record<Occurrence['kind'], [IconName, string]> = { days: ['annivDays', '#F4B79B'], years: ['annivYears', '#F2A7B4'], birthday: ['annivBirthday', '#F7D98B'], season: item.seasonId === 'pepero' ? ['annivPepero', '#AACBE2'] : ['annivChristmas', '#A8C6A0'], custom: ['annivCustom', '#C9B8E8'] };
  const [name, backgroundColor] = choices[item.kind];
  return <View style={{ width: large ? 64 : 40, height: large ? 64 : 40, borderRadius: large ? 21 : 13, borderWidth: 1.5, borderColor: '#4A3426', backgroundColor, alignItems: 'center', justifyContent: 'center' }}><Icon name={name} size={large ? 35 : 22} color="#4A3426" /></View>;
}
