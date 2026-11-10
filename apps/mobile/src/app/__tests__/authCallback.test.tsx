import { fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithI18n } from '../../test/render';
import { passwordPort, type PasswordPort } from '../../features/auth/passwordPort';
import AuthCallbackRoute from '../auth-callback';

const mockSecure = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecure.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockSecure.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockSecure.delete(key); }),
}));
let mockUrl: string | null = null;
jest.mock('expo-linking', () => ({ useLinkingURL: () => mockUrl, createURL: (path: string) => `aroom://${path}` }));
jest.mock('expo-router', () => ({ Redirect: () => null, router: { replace: jest.fn() } }));
const mockApp: { supabase?: unknown; password?: PasswordPort } = {};
jest.mock('../../lib/AppContext', () => ({ useApp: () => mockApp }));
const mockPassword = { setRecovery: jest.fn() };
jest.mock('../../features/auth/PasswordContext', () => ({ usePassword: () => mockPassword }));

const expired = 'aroom://auth-callback#error=access_denied&error_code=otp_expired';
function wire(sessionError: { message: string } | null = null) {
  const supabase = { auth: { resend: jest.fn().mockResolvedValue({ error: null }), resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }), setSession: jest.fn().mockResolvedValue({ error: sessionError }) } };
  const password = passwordPort(supabase as never, { passwordSignup: jest.fn().mockResolvedValue(undefined) } as never);
  Object.assign(mockApp, { supabase, password });
  return { supabase, password };
}
beforeEach(() => { mockSecure.clear(); jest.clearAllMocks(); });

it('V0-F15-AC-09 an expired link after a sign-up mail is the confirmation variant and resends to that address', async () => {
  const { supabase, password } = wire();
  await password.signUp('haru@example.com', 'mopiru2026');
  mockUrl = expired;
  const screen = await renderWithI18n(<AuthCallbackRoute />);
  expect(await screen.findByText(screen.t('auth.link.confirmExp.title'))).toBeTruthy();
  expect(screen.queryByText(screen.t('auth.link.exp.title'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.link.confirmExp.resend') }));
  expect(supabase.auth.resend).toHaveBeenCalledWith(expect.objectContaining({ type: 'signup', email: 'haru@example.com' }));
  expect(await screen.findByText(screen.t('auth.mail.resent'))).toBeTruthy();
});

it('V0-F15-AC-09 an expired link after a reset mail, or with no mail remembered, keeps the reset variant', async () => {
  const { password } = wire();
  mockUrl = expired;
  const none = await renderWithI18n(<AuthCallbackRoute />);
  expect(await none.findByText(none.t('auth.link.exp.title'))).toBeTruthy();
  await none.unmount();
  await password.signUp('haru@example.com', 'mopiru2026');
  await password.requestReset('haru@example.com');
  const screen = await renderWithI18n(<AuthCallbackRoute />);
  expect(await screen.findByText(screen.t('auth.link.exp.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.reset.send') }));
  expect(router.replace).toHaveBeenCalledWith('/reset');
});

it('V0-F15-AC-09 a confirmation link whose session fails, with no address remembered, sends the person to sign-up', async () => {
  const { supabase } = wire({ message: 'expired' });
  mockUrl = 'aroom://auth-callback#access_token=a&refresh_token=b&type=signup';
  const screen = await renderWithI18n(<AuthCallbackRoute />);
  expect(await screen.findByText(screen.t('auth.link.confirmExp.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.link.confirmExp.resend') }));
  expect(router.replace).toHaveBeenCalledWith('/signup');
  expect(supabase.auth.resend).not.toHaveBeenCalled();
});
