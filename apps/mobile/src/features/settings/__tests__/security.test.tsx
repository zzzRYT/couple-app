import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithI18n } from '../../../test/render';
import SecurityRoute from '../../../app/settings/security';
import ChangePasswordRoute from '../../../app/settings/change-password';
import { ChangePasswordScreen } from '../ChangePasswordScreen';
import { SecurityScreen } from '../SecurityScreen';

const mockParams: { saved?: string; forgot?: string } = {};
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), dismissTo: jest.fn() }, useFocusEffect: jest.fn(), useLocalSearchParams: () => mockParams }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('../../auth/PasswordContext', () => ({ usePassword: () => ({ state: { hasPassword: true, promptSeen: true, email: 'x7k2m9qd4t@privaterelay.appleid.com' }, apple: true, reload: jest.fn() }) }));
jest.mock('../../../lib/AppContext', () => ({ useApp: () => ({ supabase: {}, client: {}, password: { set: jest.fn() } }) }));
jest.mock('../../../lib/reauth', () => ({ supabaseReauth: () => ({ apple: jest.fn() }) }));
beforeEach(() => { delete mockParams.saved; delete mockParams.forgot; });

const relay = 'x7k2m9qd4t@privaterelay.appleid.com';
const open = (state: { hasPassword: boolean; email: string | null } | null, apple: boolean, onAction = jest.fn()) =>
  renderWithI18n(<SecurityScreen state={state && { ...state, promptSeen: true }} apple={apple} copy={jest.fn()} onAction={onAction} onBack={jest.fn()} />);

it('V0-F17-AC-01 V0-sec-apple-nopw: not set, with the way to make one', async () => {
  const onAction = jest.fn();
  const screen = await open({ hasPassword: false, email: relay }, true, onAction);
  expect(screen.getByText(screen.t('set.security.pwNone.value'))).toBeTruthy();
  expect(screen.getByText(screen.t('set.security.noneNote'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.setpw.cta') }));
  expect(onAction).toHaveBeenCalledWith('create');
});

it('V0-F17-AC-01 V0-sec-apple-pw: both methods, the address with copy, change and forgot', async () => {
  const onAction = jest.fn();
  const screen = await open({ hasPassword: true, email: relay }, true, onAction);
  expect(screen.getByText(screen.t('set.security.method.email'))).toBeTruthy();
  expect(screen.getByText(relay)).toBeTruthy();
  expect(screen.getByText(screen.t('set.security.relay'))).toBeTruthy();
  expect(screen.getByText(screen.t('set.security.pwNote'))).toBeTruthy();
  await fireEvent.press(screen.getByText(screen.t('set.security.pwChange')));
  await fireEvent.press(screen.getByText(screen.t('set.security.pwForgot')));
  expect(onAction.mock.calls).toEqual([['change'], ['forgot']]);
});

it('V0-F17-AC-01 V0-sec-email: email and password with the storage line', async () => {
  const screen = await open({ hasPassword: true, email: 'haru@example.com' }, false);
  expect(screen.getByText(screen.t('set.security.method.emailOnly'))).toBeTruthy();
  expect(screen.getByText('haru@example.com')).toBeTruthy();
  expect(screen.getByText(screen.t('set.security.pwChange.email'))).toBeTruthy();
  expect(screen.getByText(screen.t('auth.pw.stored'))).toBeTruthy();
});

it('V0-F16-AC-05 an account with no email is not offered a password', async () => {
  const screen = await open({ hasPassword: false, email: null }, true);
  expect(screen.queryByRole('button', { name: screen.t('auth.setpw.cta') })).toBeNull();
});

const change = (set: jest.Mock, handlers: { onSaved?: () => void; onForgot?: () => void } = {}, apple = true) =>
  renderWithI18n(<ChangePasswordScreen password={{ set }} email="haru@example.com" apple={apple} onSaved={handlers.onSaved ?? jest.fn()} onForgot={handlers.onForgot ?? jest.fn()} onBack={jest.fn()} />);
async function fill(screen: Awaited<ReturnType<typeof change>>) {
  await fireEvent.changeText(screen.getByLabelText(screen.t('set.pw.current')), 'mopiru2026');
  await fireEvent.changeText(screen.getByLabelText(screen.t('set.pw.new')), 'cozyroom77');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.save') }));
}

it('V0-F17-AC-02 saves with the current password', async () => {
  const set = jest.fn().mockResolvedValue('ok'), onSaved = jest.fn();
  const screen = await change(set, { onSaved });
  await fill(screen);
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(set).toHaveBeenCalledWith('cozyroom77', 'mopiru2026');
});

it('V0-F17-AC-02 the toast shows after the change', async () => {
  const screen = await renderWithI18n(<SecurityScreen state={{ hasPassword: true, promptSeen: true, email: relay }} apple saved copy={jest.fn()} onAction={jest.fn()} onBack={jest.fn()} />);
  expect(screen.getByText(screen.t('set.pw.saved'))).toBeTruthy();
});

it('V0-F17-AC-03 wrong and locked', async () => {
  const wrong = await change(jest.fn().mockResolvedValue('wrong'));
  await fill(wrong);
  expect(await wrong.findByText(wrong.t('set.pw.wrong'))).toBeTruthy();
  const locked = await change(jest.fn().mockResolvedValue('locked'));
  await fill(locked);
  expect(await locked.findByText(locked.t('auth.login.rate'))).toBeTruthy();
  expect(locked.getByRole('button', { name: locked.t('common.save') }).props.accessibilityState.disabled).toBe(true);
  // V0-sec-change-rate: neither field can be typed in while locked.
  expect(locked.getByLabelText(locked.t('set.pw.current')).props.editable).toBe(false);
  expect(locked.getByLabelText(locked.t('set.pw.new')).props.editable).toBe(false);
});

it.each(['error', 'weak', 'reauth'] as const)('V0-F17-AC-02 a %s save failure says the password was not saved, not that the screen failed to load', async (result) => {
  const screen = await change(jest.fn().mockResolvedValue(result));
  await fill(screen);
  expect(await screen.findByText(screen.t('set.save.err'))).toBeTruthy();
  expect(screen.queryByText(screen.t('state.error.title'))).toBeNull();
  expect(screen.queryByText(screen.t('set.pw.wrong'))).toBeNull();
});

it('V0-F17-AC-02 the toast shows when the change screen returns to a Security screen that is still open', async () => {
  const screen = await renderWithI18n(<SecurityRoute />);
  expect(screen.queryByText(screen.t('set.pw.saved'))).toBeNull();
  mockParams.saved = '1731100000000';
  await screen.rerender(<SecurityRoute />);
  expect(screen.getByText(screen.t('set.pw.saved'))).toBeTruthy();
});

it('V0-F17-AC-04 the forgot link of an Apple account opens the V0-sec-forgot sheet on Security', async () => {
  const change = await renderWithI18n(<ChangePasswordRoute />);
  await fireEvent.press(change.getByRole('button', { name: change.t('login.pw.forgot') }));
  expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/settings/security', params: { forgot: expect.any(String) } });
  mockParams.forgot = (router.dismissTo as jest.Mock).mock.calls[0][0].params.forgot;
  const security = await renderWithI18n(<SecurityRoute />);
  expect(security.getByText(security.t('set.pw.forgot.body'))).toBeTruthy();
  expect(security.getByRole('button', { name: security.t('acct.delete.reauth.forgot.oauth') })).toBeTruthy();
});

it('V0-F17-AC-04 the forgot link leaves for the Apple check', async () => {
  const onForgot = jest.fn();
  const screen = await change(jest.fn(), { onForgot });
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.pw.forgot') }));
  expect(onForgot).toHaveBeenCalled();
});

it('V0-F17-AC-05 an email account uses the plain title; forgot goes the same way', async () => {
  const onForgot = jest.fn();
  const screen = await change(jest.fn(), { onForgot }, false);
  expect(screen.getByText(screen.t('set.security.pwChange.email'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.pw.forgot') }));
  expect(onForgot).toHaveBeenCalled();
});
