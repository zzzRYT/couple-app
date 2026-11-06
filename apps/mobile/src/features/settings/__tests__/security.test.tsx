import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ChangePasswordScreen } from '../ChangePasswordScreen';
import { SecurityScreen } from '../SecurityScreen';

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
