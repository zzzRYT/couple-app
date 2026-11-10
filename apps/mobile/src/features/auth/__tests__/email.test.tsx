import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { EmailLoginScreen } from '../EmailLoginScreen';
import { ConfirmLinkExpiredScreen, LinkExpiredScreen, NewPasswordScreen, ResetScreen } from '../ResetScreens';
import { SignupScreen } from '../SignupScreen';
import { expiredLink, readLastMail, rememberMail } from '../lastMail';
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

it('V0-F15-AC-02 shows one message for a wrong email or password and keeps both filled so sign-in can be tried again', async () => {
  const signIn = jest.fn().mockResolvedValue('wrong');
  const screen = await login(port({ signIn }));
  await fill(screen);
  await submit(screen);
  expect(await screen.findByText(screen.t('auth.login.wrong'))).toBeTruthy();
  expect(screen.getByLabelText(screen.t('login.email.label')).props.value).toBe('haru@example.com');
  expect(screen.getByLabelText(screen.t('login.pw.label')).props.value).toBe('mopiru2026');
  expect(screen.getByRole('button', { name: screen.t('login.pw.submit') }).props.accessibilityState.disabled).toBe(false);
  await submit(screen);
  expect(signIn).toHaveBeenCalledTimes(2);
});

it('V0-F15-AC-03 at the lock shows the rate message and offers Apple, with the fields and sign-in closed', async () => {
  const onApple = jest.fn();
  const screen = await login(port({ signIn: jest.fn().mockResolvedValue('locked') }), { onApple });
  await fill(screen);
  await submit(screen);
  expect(await screen.findByText(screen.t('auth.login.rate'))).toBeTruthy();
  expect(screen.getByText(screen.t('auth.login.rate.apple'))).toBeTruthy();
  expect(screen.getByLabelText(screen.t('login.email.label')).props.editable).toBe(false);
  expect(screen.getByLabelText(screen.t('login.pw.label')).props.editable).toBe(false);
  expect(screen.getByLabelText(screen.t('login.pw.label')).props.value).toBe('');
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
  expect(screen.getByRole('button', { name: `${screen.t('set.help.contact')} · ${screen.t('auth.support.mail')}` })).toBeTruthy();
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
  expect(screen.getByRole('button', { name: screen.t('login.mail.resend') }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText(screen.t('auth.mail.resend.wait', { s: 60 }))).toBeTruthy();
});

it('V0-F15-AC-06 resend on the sign-up sent screen goes to the same address once the 60 seconds are over', async () => {
  jest.useFakeTimers();
  const password = port({ mailConnected: jest.fn().mockResolvedValue(true) });
  const screen = await renderWithI18n(<SignupScreen password={password} onBack={jest.fn()} onApple={jest.fn()} />);
  await screen.findByRole('button', { name: screen.t('login.signup.submit') });
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.email.label')), 'haru@example.com');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), 'mopiru2026');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.confirm')), 'mopiru2026');
  await fireEvent.press(screen.getByRole('checkbox', { name: screen.t('login.signup.terms') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.signup.submit') }));
  await screen.findByText(screen.t('login.signup.sent.title'));
  await act(async () => { jest.advanceTimersByTime(60_000); });
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.mail.resend') }));
  expect(password.resendConfirmation).toHaveBeenCalledWith('haru@example.com');
  expect(await screen.findByText(screen.t('auth.mail.resent'))).toBeTruthy();
  jest.useRealTimers();
});

it('sign-up, new-password and app-password failures say the save failed, not the sign-in', async () => {
  const password = port({ mailConnected: jest.fn().mockResolvedValue(true), signUp: jest.fn().mockResolvedValue('error'), set: jest.fn().mockResolvedValue('weak') });
  const signup = await renderWithI18n(<SignupScreen password={password} onBack={jest.fn()} onApple={jest.fn()} />);
  await signup.findByRole('button', { name: signup.t('login.signup.submit') });
  await fireEvent.changeText(signup.getByLabelText(signup.t('login.email.label')), 'haru@example.com');
  await fireEvent.changeText(signup.getByLabelText(signup.t('login.pw.label')), 'mopiru2026');
  await fireEvent.changeText(signup.getByLabelText(signup.t('login.pw.confirm')), 'mopiru2026');
  await fireEvent.press(signup.getByRole('checkbox', { name: signup.t('login.signup.terms') }));
  await fireEvent.press(signup.getByRole('button', { name: signup.t('login.signup.submit') }));
  expect(await signup.findByText(signup.t('auth.save.err.title'))).toBeTruthy();
  expect(signup.getByText(signup.t('auth.save.err.body'))).toBeTruthy();
  expect(signup.queryByText(signup.t('login.error.title'))).toBeNull();
  await signup.unmount();
  const next = await renderWithI18n(<NewPasswordScreen password={password} email="haru@example.com" onSaved={jest.fn()} onExpired={jest.fn()} onBack={jest.fn()} />);
  await fireEvent.changeText(next.getByLabelText(next.t('set.pw.new')), 'cozyroom77');
  await fireEvent.press(next.getByRole('button', { name: next.t('login.pw.new.save') }));
  expect(await next.findByText(next.t('auth.save.err.title'))).toBeTruthy();
  expect(next.queryByText(next.t('login.error.title'))).toBeNull();
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

it('sign-up and reset say they are loading, not signing in, while the mail setting is read', async () => {
  let answer: (value: boolean) => void = () => {};
  const password = port({ mailConnected: jest.fn(() => new Promise<boolean>((resolve) => { answer = resolve; })) });
  const signup = await renderWithI18n(<SignupScreen password={password} onBack={jest.fn()} onApple={jest.fn()} />);
  expect(signup.getByRole('progressbar', { name: signup.t('state.loading') })).toBeTruthy();
  expect(signup.queryByText(signup.t('login.processing'))).toBeNull();
  await act(async () => { answer(false); });
  const reset = await renderWithI18n(<ResetScreen password={password} onBack={jest.fn()} />);
  expect(reset.getByRole('progressbar', { name: reset.t('state.loading') })).toBeTruthy();
  await act(async () => { answer(false); });
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

it('V0-F15-AC-08 a reset mail that could not be sent says so, not that sign-in failed', async () => {
  const password = port({ mailConnected: jest.fn().mockResolvedValue(true), requestReset: jest.fn().mockResolvedValue(false) });
  const screen = await renderWithI18n(<ResetScreen password={password} initialEmail="haru@example.com" onBack={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('login.reset.send') }));
  expect(await screen.findByText(screen.t('auth.send.err.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('auth.send.err.body'))).toBeTruthy();
  expect(screen.queryByText(screen.t('login.error.title'))).toBeNull();
  expect(screen.queryByText(screen.t('login.reset.sent.title'))).toBeNull();
});

it('V0-F15-AC-08 resend on the reset sent screen waits 60 seconds after every mail, says it was sent, and shows a failed send', async () => {
  jest.useFakeTimers();
  const requestReset = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  const screen = await renderWithI18n(<ResetScreen password={port({ mailConnected: jest.fn().mockResolvedValue(true), requestReset })} initialEmail="haru@example.com" onBack={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('login.reset.send') }));
  await screen.findByText(screen.t('login.reset.sent.title'));
  const resend = () => screen.getByRole('button', { name: screen.t('login.mail.resend') });
  const wait = (s: number) => screen.queryByText(screen.t('auth.mail.resend.wait', { s }));
  expect(resend().props.accessibilityState.disabled).toBe(true);
  expect(wait(60)).toBeTruthy();
  await act(async () => { jest.advanceTimersByTime(30_000); });
  expect(wait(30)).toBeTruthy();
  await fireEvent.press(resend());
  expect(requestReset).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(30_000); });
  expect(resend().props.accessibilityState.disabled).toBe(false);
  expect(wait(1)).toBeNull();
  await fireEvent.press(resend());
  expect(await screen.findByText(screen.t('auth.mail.resent'))).toBeTruthy();
  expect(requestReset).toHaveBeenLastCalledWith('haru@example.com');
  expect(resend().props.accessibilityState.disabled).toBe(true);
  await act(async () => { jest.advanceTimersByTime(2_000); });
  expect(screen.queryByText(screen.t('auth.mail.resent'))).toBeNull();
  expect(wait(58)).toBeTruthy();
  await act(async () => { jest.advanceTimersByTime(58_000); });
  await fireEvent.press(resend());
  expect(await screen.findByText(screen.t('auth.send.err.title'))).toBeTruthy();
  expect(requestReset).toHaveBeenCalledTimes(3);
  expect(resend().props.accessibilityState.disabled).toBe(false);
  jest.useRealTimers();
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

it('V0-F15-AC-09 an expired confirmation link resends the confirmation to the remembered address, with the cooldown', async () => {
  const resendConfirmation = jest.fn().mockResolvedValue(true);
  const screen = await renderWithI18n(<ConfirmLinkExpiredScreen password={{ resendConfirmation }} email="haru@example.com" onSignup={jest.fn()} onBack={jest.fn()} />);
  expect(screen.getByText(screen.t('auth.link.confirmExp.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('auth.link.confirmExp.body'))).toBeTruthy();
  const button = () => screen.getByRole('button', { name: screen.t('auth.link.confirmExp.resend') });
  expect(button().props.accessibilityState.disabled).toBe(false);
  await fireEvent.press(button());
  expect(resendConfirmation).toHaveBeenCalledWith('haru@example.com');
  expect(await screen.findByText(screen.t('auth.mail.resent'))).toBeTruthy();
  expect(button().props.accessibilityState.disabled).toBe(true);
});

it('V0-F15-AC-09 an expired confirmation link with no remembered address opens sign-up', async () => {
  const resendConfirmation = jest.fn(), onSignup = jest.fn();
  const screen = await renderWithI18n(<ConfirmLinkExpiredScreen password={{ resendConfirmation }} email={null} onSignup={onSignup} onBack={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.link.confirmExp.resend') }));
  expect(onSignup).toHaveBeenCalled();
  expect(resendConfirmation).not.toHaveBeenCalled();
});

it('V0-F15-AC-09 an error link takes the variant of the last mail sent; a failed link session knows its own kind', async () => {
  const store = new Map<string, string>();
  const storage = { getItemAsync: async (key: string) => store.get(key) ?? null, setItemAsync: async (key: string, value: string) => { store.set(key, value); } };
  expect(await readLastMail(storage)).toBeNull();
  expect(expiredLink(null, null)).toEqual({ kind: 'reset' });
  await rememberMail({ kind: 'signup', email: 'haru@example.com' }, storage);
  const signup = await readLastMail(storage);
  expect(expiredLink(null, signup)).toEqual({ kind: 'confirm', email: 'haru@example.com' });
  expect(expiredLink(true, signup)).toEqual({ kind: 'reset' });
  await rememberMail({ kind: 'reset' }, storage);
  const reset = await readLastMail(storage);
  expect(expiredLink(null, reset)).toEqual({ kind: 'reset' });
  expect(expiredLink(false, reset)).toEqual({ kind: 'confirm', email: null });
  store.set('v0.auth.lastMail', '{not json');
  expect(await readLastMail(storage)).toBeNull();
});

it('the rules match the server on the board examples', () => {
  expect(rulesMet(passwordRules('mopiru2026', 'haru@example.com'))).toBe(true);
  expect(passwordRules('', 'a@b.co')).toEqual({ length: false, mix: false, notEmail: false });
  expect(rulesMet(passwordRules('Haru1234@b.co', 'haru1234@b.co'))).toBe(false);
  void act;
});
