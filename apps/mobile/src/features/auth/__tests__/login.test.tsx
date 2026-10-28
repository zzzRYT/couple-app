import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { LoginScreen } from '../LoginScreen';
import { EmailCodeScreen } from '../EmailCodeScreen';
import type { AuthPort } from '../authPort';
import type { AuthOptions } from '../../../config/auth';
function port(overrides: Partial<AuthPort> = {}): AuthPort {
  return { apple: jest.fn().mockResolvedValue('ok'), oauth: jest.fn().mockResolvedValue('ok'), sendCode: jest.fn().mockResolvedValue('ok'), verifyCode: jest.fn().mockResolvedValue('ok'), signOut: jest.fn().mockResolvedValue(undefined), ...overrides };
}
const product: AuthOptions = { apple: 'native', kakao: false, devEmail: false };
const devBuild: AuthOptions = { ...product, devEmail: true };

it('offers only Sign in with Apple in product builds: no email, Kakao hidden behind its flag', async () => {
  const screen = await renderWithI18n(<LoginScreen auth={port()} lastUsed="apple" options={product} onDone={jest.fn()} onEmail={jest.fn()} />);
  expect(screen.getByRole('button', { name: screen.t('login.apple') })).toBeTruthy();
  expect(screen.getByText(screen.t('onb.lastUsed'))).toBeTruthy();
  expect(screen.queryByRole('button', { name: screen.t('login.kakao') })).toBeNull();
  expect(screen.queryByRole('button', { name: screen.t('login.email') })).toBeNull();
  expect(screen.queryByText(screen.t('login.brandNote'))).toBeNull();
});

it('uses the native Apple flow and shows processing, cancelled with retry, then error', async () => {
  let resolve: (value: 'cancelled') => void = () => {};
  const auth = port({ apple: jest.fn().mockImplementationOnce(() => new Promise((r) => { resolve = r; })).mockResolvedValueOnce('error') });
  const screen = await renderWithI18n(<LoginScreen auth={auth} options={product} onDone={jest.fn()} onEmail={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.apple') }));
  expect(screen.getByRole('progressbar')).toBeTruthy();
  expect(auth.oauth).not.toHaveBeenCalled();
  await act(async () => { resolve('cancelled'); });
  expect(screen.getByText(screen.t('login.cancelled.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.retry') }));
  expect(await screen.findByText(screen.t('login.error.title'))).toBeTruthy();
  expect(auth.apple).toHaveBeenCalledTimes(2);
});

it('completes Apple sign-in', async () => {
  const onDone = jest.fn();
  const screen = await renderWithI18n(<LoginScreen auth={port()} options={product} onDone={onDone} onEmail={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.apple') }));
  expect(onDone).toHaveBeenCalled();
});

it('keeps Kakao behind its flag with the browser redirect states', async () => {
  const auth = port({ oauth: jest.fn().mockResolvedValue('cancelled') });
  const screen = await renderWithI18n(<LoginScreen auth={auth} options={{ ...product, kakao: true }} onDone={jest.fn()} onEmail={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.kakao') }));
  expect(auth.oauth).toHaveBeenCalledWith('kakao');
  expect(await screen.findByText(screen.t('login.cancelled.title'))).toBeTruthy();
});

it('shows no Apple button where the native sheet is unavailable (Android) unless web OAuth is enabled', async () => {
  const none = await renderWithI18n(<LoginScreen auth={port()} options={{ ...product, apple: null }} onDone={jest.fn()} onEmail={jest.fn()} />);
  expect(none.queryByRole('button', { name: none.t('login.apple') })).toBeNull();
  const auth = port();
  const web = await renderWithI18n(<LoginScreen auth={auth} options={{ ...product, apple: 'web' }} onDone={jest.fn()} onEmail={jest.fn()} />);
  await fireEvent.press(web.getByRole('button', { name: web.t('login.apple') }));
  expect(auth.oauth).toHaveBeenCalledWith('apple');
});

it('development builds add the email test login and validate the address before sending a code', async () => {
  const onEmail = jest.fn();
  const auth = port();
  const screen = await renderWithI18n(<LoginScreen auth={auth} options={devBuild} onDone={jest.fn()} onEmail={onEmail} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.email') }));
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.email.label')), 'not-an-email');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.email.send') }));
  expect(screen.getByText(screen.t('login.email.invalid'))).toBeTruthy();
  expect(auth.sendCode).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.email.label')), 'a@example.invalid');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.email.send') }));
  expect(auth.sendCode).toHaveBeenCalledWith('a@example.invalid');
  expect(onEmail).toHaveBeenCalledWith('a@example.invalid');
});

it('handles wrong, expired and rate-limited codes and the resend countdown (development login)', async () => {
  jest.useFakeTimers();
  const verifyCode = jest.fn().mockResolvedValueOnce('wrong').mockResolvedValueOnce('expired').mockResolvedValueOnce({ rateLimitedMinutes: 5 }).mockResolvedValueOnce('ok');
  const auth = port({ verifyCode });
  const onDone = jest.fn();
  const screen = await renderWithI18n(<EmailCodeScreen auth={auth} email="a@example.invalid" onDone={onDone} />);
  expect(screen.getByText(screen.t('login.code.resendIn', { s: 60 }))).toBeTruthy();
  const input = screen.getByLabelText(screen.t('login.code.label'));
  await fireEvent.changeText(input, '12a3456');
  expect(input.props.value).toBe('123456');
  const confirm = () => fireEvent.press(screen.getByRole('button', { name: screen.t('login.code.confirm') }));
  await confirm();
  expect(screen.getByText(screen.t('login.code.wrong'))).toBeTruthy();
  await confirm();
  expect(screen.getByText(screen.t('login.code.expired'))).toBeTruthy();
  await confirm();
  expect(screen.getByText(screen.t('login.code.rate', { m: 5 }))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('login.code.confirm') }).props.accessibilityState.disabled).toBe(true);
  for (let i = 0; i < 60; i++) await act(() => { jest.advanceTimersByTime(1000); });
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.code.resend') }));
  expect(auth.sendCode).toHaveBeenCalledWith('a@example.invalid');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.code.label')), '654321');
  await confirm();
  expect(onDone).toHaveBeenCalled();
  jest.useRealTimers();
});
