import { View } from 'react-native';
import { Canvas, Group, Path } from '@shopify/react-native-skia';

/** Line icons drawn on a 24-unit grid with the canvas stroke (2px, round caps). Decorative: the control that holds one carries the accessible name. */
const paths = {
  back: 'M15 5 L8 12 L15 19',
  forward: 'M9 5 L16 12 L9 19',
  close: 'M6 6 L18 18 M18 6 L6 18',
  sparkle: 'M12 3 C12.8 8.4 15.6 11.2 21 12 C15.6 12.8 12.8 15.6 12 21 C11.2 15.6 8.4 12.8 3 12 C8.4 11.2 11.2 8.4 12 3 Z',
  heart: 'M12 20 C6 15.6 3 12.6 3 9 C3 6.4 5 4.5 7.4 4.5 C9.4 4.5 11 5.7 12 7.4 C13 5.7 14.6 4.5 16.6 4.5 C19 4.5 21 6.4 21 9 C21 12.6 18 15.6 12 20 Z',
  clock: 'M12 3.5 A8.5 8.5 0 1 1 11.99 3.5 Z M12 7.5 L12 12 L15 14',
  share: 'M12 3.5 L12 14 M8 7 L12 3.5 L16 7 M7 10.5 L5.5 10.5 L5.5 20 L18.5 20 L18.5 10.5 L17 10.5',
  copy: 'M9 9 L19 9 L19 20 L9 20 Z M5 15 L5 4 L15 4',
  pencil: 'M4.5 19.5 L5.5 15 L15.5 5 L19 8.5 L9 18.5 Z M13.5 7 L17 10.5',
  lock: 'M6 11 L18 11 L18 20 L6 20 Z M8.5 11 L8.5 8 C8.5 5.8 10 4.5 12 4.5 C14 4.5 15.5 5.8 15.5 8 L15.5 11',
  eye: 'M2.5 12 C5 7.5 8.3 5.5 12 5.5 C15.7 5.5 19 7.5 21.5 12 C19 16.5 15.7 18.5 12 18.5 C8.3 18.5 5 16.5 2.5 12 Z M12 9 A3 3 0 1 1 11.99 9 Z',
  send: 'M12 19.5 L12 5 M6 10.5 L12 4.5 L18 10.5',
  people: 'M9 11 A3.2 3.2 0 1 1 8.99 11 Z M3.5 20 C3.5 16.5 6 14.5 9 14.5 C12 14.5 14.5 16.5 14.5 20 M15.5 4.8 A3.2 3.2 0 0 1 15.5 11 M17 14.6 C19.2 15.2 20.5 17.2 20.5 20',
  check: 'M5 12.5 L10 17.5 L19 6.5',
  info: 'M12 3.5 A8.5 8.5 0 1 1 11.99 3.5 Z M12 11 L12 16.5 M12 7.6 L12 7.7',
  warn: 'M12 4 L21 19.5 L3 19.5 Z M12 10 L12 14.2 M12 16.8 L12 16.9',
  offline: 'M4 4 L20 20 M8.5 8.8 C6 9.4 4.5 11.4 4.5 13.8 C4.5 16.6 6.7 18.5 9.4 18.5 L16 18.5 M11 6.2 C11.9 5.8 12.9 5.6 14 5.6 C17.3 5.6 19.6 8 19.6 11 C20.8 11.7 21.5 12.9 21.5 14.3 C21.5 15 21.3 15.6 21 16.2',
  undo: 'M9 14 L4.5 9.5 L9 5 M4.5 9.5 L14.5 9.5 C17.8 9.5 20 11.8 20 14.7 C20 17.6 17.8 19.5 14.5 19.5 L11 19.5',
  user: 'M12 4.5 A3.8 3.8 0 1 1 11.99 4.5 Z M4.5 20.5 C4.5 16.4 7.8 14 12 14 C16.2 14 19.5 16.4 19.5 20.5',
  calendarHeart: 'M12 18.5 C8.2 15.8 6.3 13.9 6.3 11.6 C6.3 10 7.5 8.8 9 8.8 C10.3 8.8 11.3 9.6 12 10.6 C12.7 9.6 13.7 8.8 15 8.8 C16.5 8.8 17.7 10 17.7 11.6 C17.7 13.9 15.8 15.8 12 18.5 Z',
  logout: 'M14 4.5 L19.5 4.5 L19.5 19.5 L14 19.5 M10 8 L6 12 L10 16 M6 12 L15.5 12',
  mail: 'M3.5 6 L20.5 6 L20.5 18 L3.5 18 Z M4 6.5 L12 13 L20 6.5',
  image: 'M3.5 5 L20.5 5 L20.5 19 L3.5 19 Z M3.5 16 L9 11 L13.5 15 L16 12.5 L20.5 16.5 M15.5 8.2 A1.3 1.3 0 1 1 15.49 8.2 Z',
  room: 'M4 5.5 L20 5.5 L20 18.5 L4 18.5 Z M4 11 L20 11 M15 8.2 L16 8.2',
  globe: 'M12 3.5 A8.5 8.5 0 1 1 11.99 3.5 Z M3.5 12 L20.5 12 M12 3.5 C9.5 6 8.5 9 8.5 12 C8.5 15 9.5 18 12 20.5 C14.5 18 15.5 15 15.5 12 C15.5 9 14.5 6 12 3.5 Z',
  shield: 'M12 3.5 L19.5 6.5 L19.5 11.5 C19.5 16 16.5 19 12 20.5 C7.5 19 4.5 16 4.5 11.5 L4.5 6.5 Z',
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, size = 24, color, fill }: { name: IconName; size?: number; color: string; fill?: string }) {
  const scale = size / 24;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale }]}>
          {fill && <Path path={paths[name]} color={fill} style="fill" />}
          <Path path={paths[name]} color={color} style="stroke" strokeWidth={2.2 / scale} strokeCap="round" strokeJoin="round" />
        </Group>
      </Canvas>
    </View>
  );
}
