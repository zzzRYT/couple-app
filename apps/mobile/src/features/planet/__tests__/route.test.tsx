import { render } from '@testing-library/react-native';
import PlanetRoute from '../../../app/(tabs)/planet';

jest.mock('expo-router', () => { const { Text } = jest.requireActual('react-native'); return { Redirect: ({ href }: { href: string }) => <Text>{href}</Text> }; });
jest.mock('../../../config/features', () => ({ V1_FEATURES: { planet: false } }));
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => ({ state: { snapshot: null } }) }));
jest.mock('../../../lib/useNow', () => ({ useNow: () => '2026-11-26T00:00:00Z' }));
jest.mock('../PlanetScreen', () => { const { Text } = jest.requireActual('react-native'); return { PlanetScreen: () => <Text>planet</Text> }; });

it('V1-NF-01 redirects a direct planet route when the flag is off', async () => {
  const screen = await render(<PlanetRoute />);
  expect(screen.getByText('/home')).toBeTruthy();
  expect(screen.queryByText('planet')).toBeNull();
});
