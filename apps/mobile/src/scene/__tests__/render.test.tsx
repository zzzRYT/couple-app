import { Text } from 'react-native';
import { renderWithI18n } from '../../test/render';
import { RoomScene } from '../RoomScene';
import { estimateLayout, placeNodes } from '../protectedZones';
import type { SceneDocument } from '../../lib/client';
import { Button } from '../../ui/components';
const node = (assetId: string, x: number, y: number, size = 0.12) => ({ assetId, x, y, width: size, height: size, rotationDeg: 0, zIndex: 2, opacity: 1 });
const scene = (objects: SceneDocument['objects']): SceneDocument => ({ schemaVersion: 1, canvasProfile: 'room-portrait-v1', objects, texts: [{ text: 'hi', x: 0.5, y: 0.5, width: 0.3, height: 0.06, rotationDeg: 0, zIndex: 3, styleToken: 'text.primary' }] });
const layout = estimateLayout(390, 844, 1, 'ios');

it('does not draw decorations that cover the toolbar or system areas', () => {
  const placed = placeNodes(scene([node('app_mascot', 0.5, 0.7, 0.2), node('obj_decor_lamp', 0.5, 0.08), node('obj_decor_books', 0.3, 0.5), node('obj_sky_star', 0.5, 0.98)]), layout);
  expect(placed.objects.map((item) => item.assetId)).toEqual(['app_mascot', 'obj_decor_books']);
  expect(placed.hidden).toBe(2);
});

it('recalculates the zones when text is enlarged', () => {
  const nearToolbar = scene([node('obj_decor_books', 0.5, 0.155, 0.04)]);
  expect(placeNodes(nearToolbar, estimateLayout(390, 844, 1, 'ios')).objects).toHaveLength(1);
  expect(placeNodes(nearToolbar, estimateLayout(390, 844, 1.6, 'ios')).objects).toHaveLength(0);
});

it('moves a mascot that intrudes to its default spot', () => {
  const placed = placeNodes(scene([node('app_mascot', 0.5, 0.05, 0.2)]), layout);
  expect(placed.objects[0]).toMatchObject({ assetId: 'app_mascot', x: 0.5, y: 0.72 });
});

it('keeps decorations out of touch and accessibility while native controls stay reachable', async () => {
  const onPress = jest.fn();
  const screen = await renderWithI18n(<RoomScene scene={scene([node('app_mascot', 0.5, 0.7, 0.2), node('obj_decor_books', 0.3, 0.5)])} mode="day" layout={layout} reducedMotion><Button label="control" onPress={onPress} /><Text accessibilityRole="text">dday</Text></RoomScene>);
  expect(screen.queryByTestId('room-decor')).toBeNull();
  const decor = screen.getByTestId('room-decor', { includeHiddenElements: true });
  expect(decor.props.pointerEvents).toBe('none');
  expect(decor.props.accessibilityElementsHidden).toBe(true);
  expect(decor.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(screen.getAllByTestId('skia-image', { includeHiddenElements: true })).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'control' })).toBeTruthy();
  expect(screen.getByTestId('mascot')).toBeTruthy();
});

it.each(['ko-KR', 'en-US', 'ja-JP'] as const)('renders user-written scene text unchanged in %s', async (locale) => {
  const written = '우리의 첫 만남 ☕ {{it}} set.title';
  const room = { ...scene([]), texts: [{ ...scene([]).texts[0]!, text: written }] };
  const screen = await renderWithI18n(<RoomScene scene={room} mode="day" layout={layout} reducedMotion />, locale);
  expect(screen.getByText(written, { includeHiddenElements: true })).toBeTruthy();
});
