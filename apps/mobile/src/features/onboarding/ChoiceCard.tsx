import { Pressable, View } from 'react-native';
import { AppText, Card } from '../../ui/components';
import { Icon, type IconName } from '../../ui/Icon';
import { IconTile, type TileFace } from '../../ui/IconTile';
import { useAppColor } from '../../theme/useAppColor';
/** One of the two choices on V0-start-choose and V0-connect. The second choice is drawn with the softer `border` edge. */
export function ChoiceCard({ title, body, icon, face, soft = false, onPress }: { title: string; body: string; icon: IconName; face: TileFace; soft?: boolean; onPress: () => void }) {
  const color = useAppColor();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
      <Card tone="line" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 96, borderColor: soft ? color.border : color.line }}>
        <IconTile icon={icon} face={face} size={48} />
        <View style={{ flex: 1 }}><AppText variant="heading">{title}</AppText><AppText tone="text2" variant="bodySm">{body}</AppText></View>
        <Icon name="forward" size={20} color={color.text2} />
      </Card>
    </Pressable>
  );
}
