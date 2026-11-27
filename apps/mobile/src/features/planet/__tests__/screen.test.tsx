import { act, fireEvent } from '@testing-library/react-native';
import { PanResponder } from 'react-native';
import { renderWithI18n } from '../../../test/render';
import { PlanetScreen } from '../PlanetScreen';

let mockActive = true;
const mockSceneUnmounted = jest.fn();
const mockCamera = jest.fn();
jest.mock('../../../ui/motion', () => ({ useLoopActive: () => mockActive }));
jest.mock('../SurfaceAnchor', () => ({ SurfaceAnchor: () => null }));
jest.mock('../PlanetScene', () => ({ PlanetScene: ({ scene }: { scene: { camera: unknown } }) => {
  mockCamera(scene.camera);
  jest.requireActual<typeof import('react')>('react').useEffect(() => () => mockSceneUnmounted(), []);
  return null;
} }));

it('V1-F01-AC-05 V1-F01-AC-06 announces the planet and shows the shared day count', async () => {
  const screen = await renderWithI18n(<PlanetScreen anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  expect(screen.getByText('함께한 지 2일째')).toBeTruthy();
  const planet = screen.getByLabelText('감자별, 오브젝트 0개, 아루미가 서 있어요');
  expect(planet.props.accessibilityActions.map((action: { name: string }) => action.name)).toEqual(['increment', 'decrement', 'zoomIn', 'zoomOut']);
  fireEvent(planet, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
});

it('updates the scene camera from drag and pinch touches', async () => {
  const responder = jest.spyOn(PanResponder, 'create');
  await renderWithI18n(<PlanetScreen anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  const handlers = responder.mock.calls.at(-1)![0];
  const move = (touches: { pageX: number; pageY: number }[]) => handlers.onPanResponderMove?.({ nativeEvent: { touches } } as never, {} as never);
  await act(() => { move([{ pageX: 100, pageY: 200 }]); move([{ pageX: 160, pageY: 220 }]); });
  expect(mockCamera.mock.lastCall?.[0]).toMatchObject({ yaw: 0.6, pitch: 0.2, zoom: 1 });
  await act(() => { move([{ pageX: 100, pageY: 200 }, { pageX: 200, pageY: 200 }]); move([{ pageX: 100, pageY: 200 }, { pageX: 250, pageY: 200 }]); });
  expect(mockCamera.mock.lastCall?.[0]).toMatchObject({ yaw: 0.6, pitch: 0.2, zoom: 1.5 });
  responder.mockRestore();
});

it('releases the planet scene when the screen loses focus or the app backgrounds', async () => {
  const props = { anniversary: '2026-11-25', timeZone: 'Asia/Seoul', now: '2026-11-26T00:00:00Z' };
  mockActive = true;
  mockSceneUnmounted.mockClear();
  const screen = await renderWithI18n(<PlanetScreen {...props} />);
  mockActive = false;
  await screen.rerender(<PlanetScreen {...props} />);
  expect(mockSceneUnmounted).toHaveBeenCalledTimes(1);
  mockActive = true;
});


it('creates a sample, previews it and places it on the planet', async () => {
  const screen = await renderWithI18n(<PlanetScreen anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  jest.useFakeTimers();
  await fireEvent.press(screen.getByLabelText('오브젝트 만들기'));
  await fireEvent.changeText(screen.getByLabelText('별에 무엇을 놓아 볼까요?'), '작은 나무');
  await fireEvent.press(screen.getByLabelText('만들기'));
  expect(screen.getByText('대기 중이에요')).toBeTruthy();
  await act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByText('만드는 중이에요')).toBeTruthy();
  await act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByText('미리 보기 · 버튼이나 드래그로 돌려 보세요')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('별에 놓기'));
  expect(screen.getByLabelText('감자별, 오브젝트 1개, 아루미가 서 있어요')).toBeTruthy();
  jest.useRealTimers();
});
