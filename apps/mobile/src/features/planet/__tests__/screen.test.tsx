import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { PanResponder } from 'react-native';
import { renderWithI18n } from '../../../test/render';
import { PlanetScreen } from '../PlanetScreen';

jest.mock('../planetAsset', () => ({ loadPlanetAsset: async () => ({ clone: () => ({}) }), disposePlanetAsset: jest.fn() }));
let mockPlanet: import('../planetStorage').PlanetData = { maxLevel: 1, placements: [] };
jest.mock('../planetStorage', () => ({ readPlanet: async () => mockPlanet, writePlanet: async (_id: string, value: typeof mockPlanet) => { mockPlanet = value; } }));
beforeEach(() => { mockPlanet = { maxLevel: 1, placements: [] }; });

let mockActive = true;
const mockSceneUnmounted = jest.fn();
const mockCamera = jest.fn();
jest.mock('../../../config/features', () => ({ V1_FEATURES: { planet: true } }));
jest.mock('../../../ui/motion', () => ({ useLoopActive: () => mockActive }));
jest.mock('../PlanetScene', () => ({ PlanetScene: ({ scene }: { scene: { camera: unknown } }) => {
  mockCamera(scene.camera);
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
