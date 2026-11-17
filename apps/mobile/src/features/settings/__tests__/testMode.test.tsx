import { waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { TestModeSection, testTools } from '../testMode';
const mockRpc = jest.fn();
const mockSupabase = {rpc:mockRpc};
jest.mock('../../../lib/AppContext', () => ({useApp: () => ({userId:'user-1', supabase:mockSupabase})}));
const section = (offline = false) => <TestModeSection userId="user-1" offline={offline} />;
beforeEach(() => mockRpc.mockReset());
it('shows only after server confirms the tester', async () => {
  mockRpc.mockResolvedValue({data:true, error:null});
  const screen = await renderWithI18n(section());
  await waitFor(() => expect(screen.getByText(screen.t('set.test.title'))).toBeTruthy());
  expect(testTools).toEqual(['premium', 'sentry']);
});
it.each([{data:false,error:null}, {data:null,error:{message:'missing function'}}])('hides when unverified or not a tester', async result => {
  mockRpc.mockResolvedValue(result);
  const screen = await renderWithI18n(section());
  await waitFor(() => expect(mockRpc).toHaveBeenCalled());
  expect(screen.queryByText(screen.t('set.test.title'))).toBeNull();
});
it('hides while unknown and offline', async () => {
  mockRpc.mockReturnValue(new Promise(() => {}));
  const screen = await renderWithI18n(section());
  expect(screen.queryByText(screen.t('set.test.title'))).toBeNull();
  await screen.rerender(section(true));
  expect(screen.queryByText(screen.t('set.test.title'))).toBeNull();
});
