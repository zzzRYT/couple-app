import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { PlanetScreen } from '../PlanetScreen';

jest.mock('../PlanetScene', () => ({ PlanetScene: () => null }));

it('V1-F01-AC-05 V1-F01-AC-06 announces the planet and shows the shared day count', async () => {
  const screen = await renderWithI18n(<PlanetScreen anniversary="2026-11-25" timeZone="Asia/Seoul" now="2026-11-26T00:00:00Z" />);
  expect(screen.getByText('함께한 지 2일째')).toBeTruthy();
  const planet = screen.getByLabelText('감자별, 오브젝트 0개, 아루미가 서 있어요');
  expect(planet.props.accessibilityActions.map((action: { name: string }) => action.name)).toEqual(['increment', 'decrement', 'zoomIn', 'zoomOut']);
  fireEvent(planet, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
});
