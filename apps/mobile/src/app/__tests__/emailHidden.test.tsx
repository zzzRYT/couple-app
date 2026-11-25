import { renderWithI18n } from '../../test/render';
import EmailLoginRoute from '../(auth)/email-login';
import SignupRoute from '../(auth)/signup';
import ResetRoute from '../(auth)/reset';
import NewPasswordRoute from '../new-password';
import ChangePasswordRoute from '../settings/change-password';
import ResetPasswordRoute from '../settings/reset-password';
import SetPasswordRoute from '../settings/set-password';

const mockRedirect = jest.fn();
let mockDevEmail = false;
jest.mock('../../config/auth', () => ({ authOptions: { get devEmail() { return mockDevEmail; } } }));
jest.mock('expo-router', () => ({ Redirect: (props: { href: string }) => { mockRedirect(props.href); return null; }, router: {}, useLocalSearchParams: () => ({}) }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('../../lib/AppContext', () => ({ useApp: () => ({ auth: {}, password: { mailConnected: () => Promise.resolve(false) }, session: null }) }));
jest.mock('../../features/auth/PasswordContext', () => ({ usePassword: () => ({ state: null, apple: false, setRecovery: jest.fn(), setPendingReset: jest.fn(), reload: jest.fn(), markPromptSeen: jest.fn() }) }));
beforeEach(() => { mockRedirect.mockClear(); });

const routes = [
  ['email-login', EmailLoginRoute, '/login'], ['signup', SignupRoute, '/login'], ['reset', ResetRoute, '/login'], ['new-password', NewPasswordRoute, '/login'],
  ['settings/change-password', ChangePasswordRoute, '/settings/security'], ['settings/reset-password', ResetPasswordRoute, '/settings/security'], ['settings/set-password', SetPasswordRoute, '/settings/security'],
] as const;

it.each(routes)('product builds redirect %s away', async (_name, Route, target) => {
  mockDevEmail = false;
  await renderWithI18n(<Route />);
  expect(mockRedirect).toHaveBeenCalledWith(target);
});

it.each(routes)('development builds keep %s', async (_name, Route) => {
  mockDevEmail = true;
  await renderWithI18n(<Route />);
  expect(mockRedirect).not.toHaveBeenCalled();
});
