import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { PanResponder } from 'react-native';
import { renderWithI18n } from '../../../test/render';
import { PlanetScreen } from '../PlanetScreen';
import { pickRegion } from '../photo';

jest.mock('../planetAsset', () => ({ loadPlanetAsset: async () => ({ clone: () => ({}) }), disposePlanetAsset: jest.fn() }));
let mockPlanet: import('../planetStorage').PlanetData = { maxLevel: 1, placements: [] };
jest.mock('../planetStorage', () => ({ readPlanet: async () => mockPlanet, writePlanet: async (_id: string, value: typeof mockPlanet) => { mockPlanet = value; } }));
beforeEach(() => { mockPlanet = { maxLevel: 1, placements: [] }; });

jest.mock('../photo', () => ({ pickRegion: jest.fn() }));
let mockActive = true;
const mockSceneUnmounted = jest.fn();
const mockCamera = jest.fn();
const mockPlacements = jest.fn();
const mockPoke = jest.fn();
jest.mock('../../../config/features', () => ({ V1_FEATURES: { planet: true } }));
jest.mock('../../../ui/motion', () => ({ useLoopActive: () => mockActive }));
jest.mock('../SurfaceAnchor', () => ({ SurfaceAnchor: () => null }));
jest.mock('../PlanetScene', () => ({ PlanetScene: ({ scene, placements, poke }: { scene: { camera: unknown }; placements: unknown; poke: unknown }) => {
  mockCamera(scene.camera); mockPlacements(placements); mockPoke(poke);
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

it('passes a tap to the scene so Aroomi can react, and not a drag', async () => {
  const responder = jest.spyOn(PanResponder, 'create');
  await renderWithI18n(<PlanetScreen spaceId="space-1" anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  const release = (dx: number) => responder.mock.calls.at(-1)![0].onPanResponderRelease?.({ nativeEvent: { locationX: 120, locationY: 300 } } as never, { dx, dy: 0 } as never);
  await act(() => { release(40); });
  expect(mockPoke.mock.lastCall?.[0]).toMatchObject({ n: 0 });
  await act(() => { release(2); });
  expect(mockPoke.mock.lastCall?.[0]).toEqual({ x: 120, y: 300, n: 1 });
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

it('creates a sample, previews it and places it on the planet', async () => {
  const screen = await renderWithI18n(<PlanetScreen spaceId="space-1" anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  jest.useFakeTimers();
  await fireEvent.press(await screen.findByLabelText('오브젝트 만들기'));
  await fireEvent.changeText(screen.getByLabelText('별에 무엇을 놓아 볼까요?'), '작은 나무');
  await fireEvent.press(screen.getByLabelText('만들기'));
  expect(screen.getByText('대기 중이에요')).toBeTruthy();
  await act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByText('만드는 중이에요')).toBeTruthy();
  await act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByText('미리 보기 · 버튼이나 드래그로 돌려 보세요')).toBeTruthy();
  expect(mockCamera.mock.lastCall?.[0]).toMatchObject({ yaw: Math.PI, pitch: -0.35 });
  expect(mockPlacements.mock.lastCall?.[0]).toMatchObject([{ assetId: 'sample-tree', latitude: 0, longitude: -180, radius: 0.3, scale: 0.3 / 0.53 }]);
  await fireEvent.press(screen.getByLabelText('별에 놓기'));
  await waitFor(() => expect(screen.getByLabelText('감자별, 오브젝트 1개, 아루미가 서 있어요')).toBeTruthy());
  expect(mockPlanet.placements).toMatchObject([{ assetId: 'sample-tree', radius: 0.3, scale: 0.3 / 0.53 }]);
  jest.useRealTimers();
});

it('creates an object from the cropped part of a photo and places it', async () => {
  jest.mocked(pickRegion).mockResolvedValueOnce('denied').mockRejectedValueOnce(new Error('no camera')).mockResolvedValueOnce('cancelled').mockResolvedValueOnce({ uri: 'file:///region.jpg' });
  const screen = await renderWithI18n(<PlanetScreen spaceId="space-1" anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  await fireEvent.press(await screen.findByLabelText('오브젝트 만들기'));
  await fireEvent.press(screen.getByLabelText('사진 찍기'));
  expect(await screen.findByText('카메라를 쓸 수 없어요. 설정에서 허용해 주세요.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('사진 찍기'));
  expect(await screen.findByText('사진을 가져오지 못했어요.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('사진 고르기'));
  expect(screen.queryByLabelText('사진에서 고른 부분')).toBeNull();
  await fireEvent.press(screen.getByLabelText('사진 고르기'));
  expect((await screen.findByLabelText('사진에서 고른 부분')).props.source).toEqual({ uri: 'file:///region.jpg' });
  jest.useFakeTimers();
  await fireEvent.press(screen.getByLabelText('이 부분으로 만들기'));
  await act(() => { jest.advanceTimersByTime(2000); });
  await act(() => { jest.advanceTimersByTime(1000); });
  await fireEvent.press(screen.getByLabelText('별에 놓기'));
  await waitFor(() => expect(mockPlanet.placements).toMatchObject([{ assetId: 'sample-tree', radius: 0.3 }]));
  expect(screen.queryByLabelText('사진에서 고른 부분')).toBeNull();
  jest.useRealTimers();
});

it('does not start a creation when the planet is already full', async () => {
  mockPlanet = { maxLevel: 1, placements: [0, 1, 2, 3].map((i) => ({ id: `${i}`, latitude: 0, longitude: i * 60 - 180, heading: 0, radius: 0.3 })) };
  const screen = await renderWithI18n(<PlanetScreen spaceId="space-1" anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  await waitFor(() => expect(screen.getByLabelText('감자별, 오브젝트 4개, 아루미가 서 있어요')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('오브젝트 만들기'));
  expect(screen.getByText('별이 가득 찼어요. 다음 성장을 기다려 주세요.')).toBeTruthy();
  expect(screen.queryByLabelText('별에 무엇을 놓아 볼까요?')).toBeNull();
});
