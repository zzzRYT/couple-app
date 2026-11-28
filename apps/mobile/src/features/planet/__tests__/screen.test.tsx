import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, PanResponder } from 'react-native';
import { renderWithI18n } from '../../../test/render';
import { PlanetScreen } from '../PlanetScreen';
import { initialWalker, walkerCoordinates, type Walker } from '../walk';

jest.mock('../planetAsset', () => ({ loadPlanetAsset: async () => ({ clone: () => ({}) }), disposePlanetAsset: jest.fn() }));
let mockPlanet: import('../planetStorage').PlanetData = { maxLevel: 1, placements: [] };
jest.mock('../planetStorage', () => ({ readPlanet: async () => mockPlanet, writePlanet: async (_id: string, value: typeof mockPlanet) => { mockPlanet = value; } }));
beforeEach(() => { mockPlanet = { maxLevel: 1, placements: [] }; });

let mockActive = true;
const mockSceneUnmounted = jest.fn();
const mockCamera = jest.fn();
const mockWalk = jest.fn<void, [{ walker: Walker; walkBlend: number }]>();
jest.mock('../../../config/features', () => ({ V1_FEATURES: { planet: true } }));
jest.mock('../../../ui/motion', () => ({ useLoopActive: () => mockActive }));
jest.mock('../PlanetScene', () => ({ PlanetScene: ({ scene, walker, walkBlend }: { scene: { camera: unknown }; walker: Walker; walkBlend: number }) => {
  mockCamera(scene.camera); mockWalk({ walker, walkBlend });
  jest.requireActual<typeof import('react')>('react').useEffect(() => () => mockSceneUnmounted(), []);
  return null;
} }));

it('V1-F01-AC-05 V1-F01-AC-06 announces the planet and shows the shared day count', async () => {
  const screen = await renderWithI18n(<PlanetScreen spaceId="space-1" anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  expect(screen.getByText('함께한 지 2일째')).toBeTruthy();
  const planet = screen.getByLabelText('감자별, 오브젝트 0개, 아루미가 서 있어요');
  expect(planet.props.accessibilityActions.map((action: { name: string }) => action.name)).toEqual(['increment', 'decrement', 'zoomIn', 'zoomOut']);
  fireEvent(planet, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
});

it('updates the scene camera from drag and pinch touches', async () => {
  const responder = jest.spyOn(PanResponder, 'create');
  await renderWithI18n(<PlanetScreen spaceId="space-1" anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  const handlers = responder.mock.calls.at(-1)![0];
  const move = (touches: { pageX: number; pageY: number }[]) => handlers.onPanResponderMove?.({ nativeEvent: { touches } } as never, {} as never);
  await act(() => { move([{ pageX: 100, pageY: 200 }]); move([{ pageX: 160, pageY: 220 }]); });
  expect(mockCamera.mock.lastCall?.[0]).toMatchObject({ yaw: 0.6, pitch: 0.2, zoom: 1 });
  await act(() => { move([{ pageX: 100, pageY: 200 }, { pageX: 200, pageY: 200 }]); move([{ pageX: 100, pageY: 200 }, { pageX: 250, pageY: 200 }]); });
  expect(mockCamera.mock.lastCall?.[0]).toMatchObject({ yaw: 0.6, pitch: 0.2, zoom: 1.5 });
  responder.mockRestore();
});

it('releases the planet scene when the screen loses focus or the app backgrounds', async () => {
  const props = { spaceId: 'space-1', anniversary: '2026-11-25', timeZone: 'Asia/Seoul', now: '2026-11-26T00:00:00Z' };
  mockActive = true;
  mockSceneUnmounted.mockClear();
  const screen = await renderWithI18n(<PlanetScreen {...props} />);
  mockActive = false;
  await screen.rerender(<PlanetScreen {...props} />);
  expect(mockSceneUnmounted).toHaveBeenCalledTimes(1);
  mockActive = true;
});

it('keeps saved objects when the planet reaches capacity', async () => {
  const screen = await renderWithI18n(<PlanetScreen spaceId="space-1" anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  const add = screen.getByText('개발용 오브젝트 놓기');
  for (let i = 1; i <= 4; i += 1) {
    await waitFor(() => expect(add.parent?.props.accessibilityState?.disabled).not.toBe(true));
    await fireEvent.press(add);
    await waitFor(() => expect(mockPlanet.placements).toHaveLength(i));
  }
  await fireEvent.press(add);
  expect(screen.getByText('별이 가득 찼어요. 다음 성장을 기다려 주세요.')).toBeTruthy();
  expect(mockPlanet.placements).toHaveLength(4);
});

it('keeps the highest reached level after the development entitlement is turned off', async () => {
  const screen = await renderWithI18n(<PlanetScreen spaceId="space-1" anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  await fireEvent.press(await screen.findByText('개발용 확장 · 레벨 1'));
  await waitFor(() => expect(mockPlanet.maxLevel).toBe(4));
  await fireEvent.press(screen.getByText('개발용 확장 · 레벨 4'));
  expect(screen.getByRole('switch').props.accessibilityState).toMatchObject({ checked: false });
  expect(screen.getByText('개발용 확장 · 레벨 4')).toBeTruthy();
});

const props = { spaceId: 'space-1', anniversary: '2026-11-25', timeZone: 'Asia/Seoul', now: '2026-11-26T00:00:00Z' };
const shown = () => mockWalk.mock.lastCall![0];
async function enterWalk(screen: Awaited<ReturnType<typeof renderWithI18n>>) {
  await fireEvent.press(screen.getByText('산책하기'));
  await waitFor(() => expect(shown().walkBlend).toBe(1), { timeout: 3000 });
}

it('zooms smoothly into the walk view and back out to the unchanged overview', async () => {
  const screen = await renderWithI18n(<PlanetScreen {...props} />);
  const camera = mockCamera.mock.lastCall?.[0];
  mockWalk.mockClear();
  await enterWalk(screen);
  const blends = mockWalk.mock.calls.map(([scene]) => scene.walkBlend);
  expect(blends.filter((blend) => blend > 0 && blend < 1).length).toBeGreaterThan(3);
  expect(blends).toEqual([...blends].sort((a, b) => a - b));
  expect(screen.getByText('끌어서 아루미와 걸어 보세요')).toBeTruthy();
  await fireEvent.press(screen.getByText('별 전체 보기'));
  await waitFor(() => expect(shown().walkBlend).toBe(0), { timeout: 3000 });
  expect(mockCamera.mock.lastCall?.[0]).toEqual(camera);
  expect(screen.getByText('끌어서 별을 돌려 보세요')).toBeTruthy();
});

it('jumps between the views without a zoom when reduced motion is on', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
  const screen = await renderWithI18n(<PlanetScreen {...props} />);
  await act(async () => {});
  mockWalk.mockClear();
  await fireEvent.press(screen.getByText('산책하기'));
  expect(new Set(mockWalk.mock.calls.map(([scene]) => scene.walkBlend))).toEqual(new Set([1]));
});

it('walks while a drag is held, leaves the overview camera alone, and stops when the finger lifts', async () => {
  const responder = jest.spyOn(PanResponder, 'create');
  const screen = await renderWithI18n(<PlanetScreen {...props} />);
  const handlers = responder.mock.calls.at(-1)![0]; const camera = mockCamera.mock.lastCall?.[0];
  await enterWalk(screen);
  const drag = (dx: number, dy: number) => act(() => { handlers.onPanResponderMove?.({ nativeEvent: { touches: [{ pageX: 100 + dx, pageY: 200 + dy }] } } as never, { dx, dy } as never); });
  await drag(5, -5);
  await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
  expect(shown().walker).toBe(initialWalker);
  await drag(40, 0);
  await waitFor(() => expect(walkerCoordinates(shown().walker).latitude).toBeLessThan(85));
  expect(walkerCoordinates(shown().walker).longitude).toBeCloseTo(90);
  expect(shown().walker.facing).toBeCloseTo(Math.PI / 2);
  expect(mockCamera.mock.lastCall?.[0]).toEqual(camera);
  await act(() => { handlers.onPanResponderRelease?.({} as never, {} as never); });
  const stopped = shown().walker;
  await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
  expect(shown().walker).toBe(stopped);
  responder.mockRestore();
});

it('offers walk steps as accessibility actions and says when an object is in the way', async () => {
  mockPlanet = { maxLevel: 1, placements: [{ id: 'a', latitude: 0, longitude: 180, heading: 0, radius: 0.31 }] };
  const screen = await renderWithI18n(<PlanetScreen {...props} />);
  const planet = await screen.findByLabelText('감자별, 오브젝트 1개, 아루미가 서 있어요');
  await enterWalk(screen);
  expect(planet.props.accessibilityActions).toEqual([{ name: 'walkForward', label: '앞으로 걷기' }, { name: 'walkRight', label: '오른쪽으로 걷기' }, { name: 'walkBack', label: '뒤로 걷기' }, { name: 'walkLeft', label: '왼쪽으로 걷기' }]);
  // fireEvent drops this event because the pan responder claims touches only in its capture phase.
  const step = (actionName: string) => act(() => { planet.props.onAccessibilityAction({ nativeEvent: { actionName } }); });
  await step('walkForward');
  expect(walkerCoordinates(shown().walker)).toEqual({ latitude: expect.closeTo(90 - 0.3 / 0.94 * 180 / Math.PI, 0), longitude: expect.closeTo(180) });
  for (let i = 0; i < 4; i += 1) await step('walkForward');
  expect(screen.getByText('오브젝트가 있어서 지나갈 수 없어요.')).toBeTruthy();
  expect(walkerCoordinates(shown().walker).latitude).toBeGreaterThan(25);
  await step('walkBack');
  expect(screen.queryByText('오브젝트가 있어서 지나갈 수 없어요.')).toBeNull();
});
