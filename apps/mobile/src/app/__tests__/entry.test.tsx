import { render } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';
import Index from '../index';

jest.mock('expo-router', () => ({ Redirect: ({ href }: { href: string }) => <MockText>{href}</MockText> }));
jest.mock('../../lib/AppContext', () => ({ useApp: () => ({ session: { user: { id: 'user' } } }) }));
jest.mock('../../features/space/SpaceContext', () => ({ useSpace: () => ({ entry: 'none', reload: jest.fn() }) }));

it('sends a signed-in user without a space to the create-or-join choice', async () => {
  const screen = await render(<Index />);
  expect(screen.getByText('/choose-space')).toBeTruthy();
});
