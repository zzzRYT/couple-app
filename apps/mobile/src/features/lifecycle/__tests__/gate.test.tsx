import { render } from '@testing-library/react-native';
import { EndedGate } from '../EndedGate';

const mockReplace = jest.fn();
let mockEntry = 'active';
let mockUser: string | null = 'u1';
jest.mock('expo-router', () => ({ router: { replace: (...args: unknown[]) => mockReplace(...args) } }));
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => ({ entry: mockEntry }) }));
jest.mock('../../../lib/AppContext', () => ({ useApp: () => ({ userId: mockUser }) }));

const setup = async (entry: string) => { mockEntry = entry; return render(<EndedGate />); };
beforeEach(() => { mockReplace.mockClear(); mockUser = 'u1'; });

it('sends the person back through the entry screen once when an open space stops being active', async () => {
  const view = await setup('active');
  mockEntry = 'loading'; await view.rerender(<EndedGate />);
  expect(mockReplace).not.toHaveBeenCalled();
  mockEntry = 'ended'; await view.rerender(<EndedGate />);
  expect(mockReplace).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/');
  mockEntry = 'none'; await view.rerender(<EndedGate />);
  expect(mockReplace).toHaveBeenCalledTimes(1);
});

it('does nothing when there never was an active space (first launch, create-or-join)', async () => {
  const view = await setup('loading');
  mockEntry = 'none'; await view.rerender(<EndedGate />);
  mockEntry = 'ended'; await view.rerender(<EndedGate />);
  expect(mockReplace).not.toHaveBeenCalled();
});

it('forgets an old active space when the signed-in user changes', async () => {
  const view = await setup('active');
  mockUser = 'u2'; mockEntry = 'none'; await view.rerender(<EndedGate />);
  expect(mockReplace).not.toHaveBeenCalled();
});
