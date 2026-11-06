import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { EmailLoginScreen } from '../EmailLoginScreen';
import { LinkExpiredScreen, NewPasswordScreen, ResetScreen } from '../ResetScreens';
import { SignupScreen } from '../SignupScreen';
import { parseAuthLink, type PasswordPort } from '../passwordPort';
import { passwordRules, rulesMet } from '../passwordRules';

function port(overrides: Partial<PasswordPort> = {}) {
  return {
    mailConnected: jest.fn().mockResolvedValue(false), signIn: jest.fn().mockResolvedValue('ok'), signUp: jest.fn().mockResolvedValue('ok'), requestReset: jest.fn().mockResolvedValue(true),
    resendConfirmation: jest.fn().mockResolvedValue(true), state: jest.fn(), set: jest.fn().mockResolvedValue('ok'), verify: jest.fn(), promptSeen: jest.fn(), ...overrides,
  } as jest.Mocked<PasswordPort>;
}
async function login(password = port(), handlers: Partial<{ onDone: () => void; onApple: () => void; onSignup: () => void; onForgot: (email: string) => void }> = {}) {
  const screen = await renderWithI18n(<EmailLoginScreen password={password} onDone={handlers.onDone ?? jest.fn()} onBack={jest.fn()} onApple={handlers.onApple ?? jest.fn()} onSignup={handlers.onSignup ?? jest.fn()} onForgot={handlers.onForgot ?? jest.fn()} />);
  return screen;
}
async function fill(screen: Awaited<ReturnType<typeof login>>, email = 'haru@example.com', secret = 'mopiru2026') {
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.email.label')), email);
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), secret);
}
const submit = async (screen: Awaited<ReturnType<typeof login>>) => { await fireEvent.press(screen.getByRole('button', { name: screen.t('login.pw.submit') })); };

it('V0-F15-AC-01 takes email and password on one screen, hidden by default with show and hide, and AutoFill on', async () => {
  const screen = await login();
  const field = () => screen.getByLabelText(screen.t('login.pw.label'));
  expect(field().props.secureTextEntry).toBe(true);
  expect(field().props.textContentType).toBe('password');
  await fireEvent.press(screen.getByRole('button', { name: `${screen.t('login.pw.show')} · ${screen.t('login.pw.label')}` }));
  expect(field().props.secureTextEntry).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: `${screen.t('login.pw.hide')} · ${screen.t('login.pw.label')}` }));
  expect(field().props.secureTextEntry).toBe(true);
});

it('V0-F15-AC-02 shows one message for a wrong email or password and clears the password', async () => {
  const screen = await login(port({ signIn: jest.fn().mockResolvedValue('wrong') }));
  await fill(screen);
  await submit(screen);
  expect(await screen.findByText(screen.t('auth.login.wrong'))).toBeTruthy();
  expect(screen.getByLabelText(screen.t('login.pw.label')).props.value).toBe('');
});

it('V0-F15-AC-03 at the lock shows the rate message and offers Apple, with sign-in closed', async () => {
  const onApple = jest.fn();
  const screen = await login(port({ signIn: jest.fn().mockResolvedValue('locked') }), { onApple });
  await fill(screen);
  await submit(screen);
  expect(await screen.findByText(screen.t('auth.login.rate'))).toBeTruthy();
  expect(screen.getByText(screen.t('auth.login.rate.apple'))).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), 'mopiru2026');
  expect(screen.getByRole('button', { name: screen.t('login.pw.submit') }).props.accessibilityState.disabled).toBe(true);
  expect(screen.queryByRole('button', { name: screen.t('login.signup.link') })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.apple') }));
  expect(onApple).toHaveBeenCalled();
});

it('V0-F15-AC-05 until mail is connected sign-up is V0-auth-signup-nomail, with Apple and contact', async () => {
  const onApple = jest.fn();
  const password = port();
  const screen = await renderWithI18n(<SignupScreen password={password} onBack={jest.fn()} onApple={onApple} />);
  expect(await screen.findByText(screen.t('auth.signup.nomail.title'))).toBeTruthy();
  expect(screen.queryByText(screen.t('login.signup.sent.title'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.apple') }));
  expect(onApple).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: screen.t('set.help.contact') })).toBeTruthy();
  expect(password.signUp).not.toHaveBeenCalled();
});

it('V0-F15-AC-06 with mail on, the rules change as the person types and terms and the match are required', async () => {
  const password = port({ mailConnected: jest.fn().mockResolvedValue(true) });
  const screen = await renderWithI18n(<SignupScreen password={password} onBack={jest.fn()} onApple={jest.fn()} />);
  const submitButton = async () => await screen.findByRole('button', { name: screen.t('login.signup.submit') });
  await submitButton();
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.email.label')), 'haru@example.com');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), 'short');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.confirm')), 'other');
  expect(screen.getByText(screen.t('login.pw.mismatch'))).toBeTruthy();
  expect((await submitButton()).props.accessibilityState.disabled).toBe(true);
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), 'mopiru2026');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.confirm')), 'mopiru2026');
  expect((await submitButton()).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByRole('checkbox', { name: screen.t('login.signup.terms') }));
  expect(screen.getByText(screen.t('auth.pw.stored'))).toBeTruthy();
  await fireEvent.press(await submitButton());
  expect(password.signUp).toHaveBeenCalledWith('haru@example.com', 'mopiru2026');
  expect(await screen.findByText(screen.t('login.signup.sent.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.mail.resend') }));
  expect(password.resendConfirmation).toHaveBeenCalledWith('haru@example.com');
});

it('V0-F15-AC-05 a sign-up refused by the server falls back to the closed screen', async () => {
  const password = port({ mailConnected: jest.fn().mockResolvedValue(true), signUp: jest.fn().mockResolvedValue('closed') });
  const screen = await renderWithI18n(<SignupScreen password={password} onBack={jest.fn()} onApple={jest.fn()} />);
  await screen.findByRole('button', { name: screen.t('login.signup.submit') });
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.email.label')), 'haru@example.com');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), 'mopiru2026');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.confirm')), 'mopiru2026');
  await fireEvent.press(screen.getByRole('checkbox', { name: screen.t('login.signup.terms') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.signup.submit') }));
  expect(await screen.findByText(screen.t('auth.signup.nomail.title'))).toBeTruthy();
});

it('V0-F15-AC-07 until mail is connected reset is V0-auth-reset-nomail and no mail is requested', async () => {
  const password = port();
  const screen = await renderWithI18n(<ResetScreen password={password} onBack={jest.fn()} onApple={jest.fn()} />);
  expect(await screen.findByText(screen.t('auth.reset.nomail.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('auth.reset.nomail.apple.title'))).toBeTruthy();
  expect(screen.getByRole('button', { name: `${screen.t('set.help.contact')} · ${screen.t('auth.support.mail')}` })).toBeTruthy();
  expect(screen.queryByText(screen.t('login.reset.sent.title'))).toBeNull();
  expect(password.requestReset).not.toHaveBeenCalled();
});

it('V0-F15-AC-08 with mail on, the sent screen reads the same for any address, and a new password saves from the link', async () => {
  const password = port({ mailConnected: jest.fn().mockResolvedValue(true) });
  const screen = await renderWithI18n(<ResetScreen password={password} initialEmail="haru@example.com" onBack={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('login.reset.send') }));
  expect(await screen.findByText(screen.t('login.reset.sent.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('login.reset.sent.body', { email: 'haru@example.com' }))).toBeTruthy();
  expect(password.requestReset).toHaveBeenCalledWith('haru@example.com');

  const onSaved = jest.fn();
  const next = await renderWithI18n(<NewPasswordScreen password={password} email="haru@example.com" onSaved={onSaved} onExpired={jest.fn()} onBack={jest.fn()} />);
  expect(next.getByRole('button', { name: next.t('login.pw.new.save') }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.changeText(next.getByLabelText(next.t('set.pw.new')), 'cozyroom77');
  await fireEvent.press(next.getByRole('button', { name: next.t('login.pw.new.save') }));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(password.set).toHaveBeenCalledWith('cozyroom77');
});

it('V0-F15-AC-09 a link that went stale shows V0-auth-link-exp and offers a new mail', async () => {
  expect(parseAuthLink('aroom://auth-callback#error=access_denied&error_code=otp_expired&error_description=x')).toEqual({ kind: 'expired' });
  expect(parseAuthLink('aroom://auth-callback#access_token=a&refresh_token=b&type=recovery')).toEqual({ kind: 'session', accessToken: 'a', refreshToken: 'b', recovery: true });
  expect(parseAuthLink('aroom://auth-callback#access_token=a&refresh_token=b&type=signup')).toMatchObject({ recovery: false });
  expect(parseAuthLink('aroom://auth-callback?code=1')).toEqual({ kind: 'none' });
  expect(parseAuthLink(null)).toEqual({ kind: 'none' });
  const onResend = jest.fn();
  const screen = await renderWithI18n(<LinkExpiredScreen onResend={onResend} onBack={jest.fn()} />);
  expect(screen.getByText(screen.t('auth.link.exp.body'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.reset.send') }));
  expect(onResend).toHaveBeenCalled();
  const expired = jest.fn();
  const next = await renderWithI18n(<NewPasswordScreen password={port({ set: jest.fn().mockResolvedValue('reauth') })} email="a@b.co" onSaved={jest.fn()} onExpired={expired} onBack={jest.fn()} />);
  await fireEvent.changeText(next.getByLabelText(next.t('set.pw.new')), 'cozyroom77');
  await fireEvent.press(next.getByRole('button', { name: next.t('login.pw.new.save') }));
  await waitFor(() => expect(expired).toHaveBeenCalled());
});

it('the rules match the server on the board examples', () => {
  expect(rulesMet(passwordRules('mopiru2026', 'haru@example.com'))).toBe(true);
  expect(passwordRules('', 'a@b.co')).toEqual({ length: false, mix: false, notEmail: false });
  expect(rulesMet(passwordRules('Haru1234@b.co', 'haru1234@b.co'))).toBe(false);
  void act;
});
