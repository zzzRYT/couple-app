import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { LoginScreen } from '../LoginScreen';
import { EmailCodeScreen } from '../EmailCodeScreen';
import type { AuthPort } from '../authPort';
function port(overrides: Partial<AuthPort> = {}): AuthPort {
  return { oauth: jest.fn().mockResolvedValue('ok'), sendCode: jest.fn().mockResolvedValue('ok'), verifyCode: jest.fn().mockResolvedValue('ok'), ...overrides };
}

it('highlights the last used method and marks the provider buttons as placeholders', async () => {
  const screen = await renderWithI18n(<LoginScreen auth={port()} lastUsed="kakao" onDone={jest.fn()} onEmail={jest.fn()} />);
  expect(screen.getByRole('button', { name: screen.t('login.kakao') })).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('login.apple') })).toBeTruthy();
  expect(screen.getByText(screen.t('onb.lastUsed'))).toBeTruthy();
  expect(screen.getAllByText(screen.t('login.brandNote')).length).toBe(2);
});

it('shows processing, then cancelled with retry, then error states for OAuth', async () => {
  let resolve: (value: 'cancelled') => void = () => {};
  const auth = port({ oauth: jest.fn().mockImplementationOnce(() => new Promise((r) => { resolve = r; })).mockResolvedValueOnce('error') });
  const screen = await renderWithI18n(<LoginScreen auth={auth} onDone={jest.fn()} onEmail={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.kakao') }));
  expect(screen.getByText(screen.t('login.redirect.title'))).toBeTruthy();
  expect(screen.getByRole('progressbar')).toBeTruthy();
  await act(async () => { resolve('cancelled'); });
  expect(screen.getByText(screen.t('login.cancelled.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.retry') }));
  expect(await screen.findByText(screen.t('login.error.title'))).toBeTruthy();
});

it('completes OAuth and validates the email address before sending a code', async () => {
  const onDone = jest.fn();
  const onEmail = jest.fn();
  const auth = port();
  const screen = await renderWithI18n(<LoginScreen auth={auth} onDone={onDone} onEmail={onEmail} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.apple') }));
  expect(onDone).toHaveBeenCalled();
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

it('handles wrong, expired and rate-limited codes and the resend countdown', async () => {
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
