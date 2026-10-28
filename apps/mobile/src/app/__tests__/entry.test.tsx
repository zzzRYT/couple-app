import { render } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';
import Index from '../index';

let mockSession: object | null = { user: { id: 'user' } };
let mockPending: string | null = null;
jest.mock('expo-router', () => ({ Redirect: ({ href }: { href: string }) => <MockText>{href}</MockText> }));
jest.mock('../../lib/AppContext', () => ({ useApp: () => ({ session: mockSession, sessionLoaded: true }) }));
jest.mock('../../lib/inviteLink', () => ({ peekPendingInvite: async () => mockPending }));
jest.mock('../../features/space/SpaceContext', () => ({ useSpace: () => ({ entry: 'none', reload: jest.fn() }) }));
beforeEach(() => { mockSession = { user: { id: 'user' } }; mockPending = null; });

it('sends a signed-in user without a space to the create-or-join choice', async () => {
  const screen = await render(<Index />);
  expect(await screen.findByText('/choose-space')).toBeTruthy();
});

it('keeps a pending invite through sign-in and routes to join first', async () => {
  mockSession = null;
  mockPending = 'AB12CD34';
  const screen = await render(<Index />);
  expect(screen.getByText('/welcome')).toBeTruthy();
  mockSession = { user: { id: 'user' } };
  await screen.rerender(<Index />);
  expect(await screen.findByText('/join')).toBeTruthy();
});
