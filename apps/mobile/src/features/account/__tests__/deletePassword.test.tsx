import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ApiError } from '../../../lib/errors';
import { DeleteAccountScreen, type DeleteCredentials } from '../DeleteAccountScreen';
import { submitDeletion, type ReauthPort, type SubmitResult } from '../deleteAccount';

const options = { apple: 'native' as const, kakao: false, devEmail: false };
const relay = 'x7k2m9qd4t@privaterelay.appleid.com';
const appleCode = { kind: 'ok' as const, reauth: { provider: 'apple' as const, authorizationCode: 'code-1' } };
function reauth(): ReauthPort {
  return { apple: jest.fn().mockResolvedValue(appleCode), kakao: jest.fn(), sendEmailCode: jest.fn(), verifyEmailCode: jest.fn() };
}
function held(overrides: Partial<DeleteCredentials> = {}): DeleteCredentials {
  return { hasPassword: true, apple: true, email: relay, mail: false, password: { verify: jest.fn().mockResolvedValue('ok') }, ...overrides };
}
async function open(credentials: DeleteCredentials, onSubmit: (input: unknown) => Promise<SubmitResult> = jest.fn().mockResolvedValue('accepted'), port = reauth(), onReset = jest.fn()) {
  const onFinished = jest.fn().mockResolvedValue(undefined);
  const screen = await renderWithI18n(<DeleteAccountScreen v0 reauth={port} onSubmit={onSubmit} onFinished={onFinished} onCancel={jest.fn()} onReset={onReset} credentials={credentials} options={options} />);
  await fireEvent.press(screen.getByRole('checkbox', { name: screen.t('set.confirm.check') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.delete.cta') }));
  return { screen, onSubmit, onFinished, port, onReset };
}
async function typeAndConfirm(screen: Awaited<ReturnType<typeof open>>['screen'], label: string) {
  await fireEvent.changeText(screen.getByLabelText(screen.t(label)), 'mopiru2026');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('acct.delete.reauth.submit') }));
}

it('V0-F18-AC-01 V0-del-pw: an Apple account confirms with the app password', async () => {
  const credentials = held();
  const { screen, onSubmit, onFinished } = await open(credentials);
  expect(screen.getByText(screen.t('acct.delete.reauth.body'))).toBeTruthy();
  expect(screen.getByText(screen.t('acct.delete.reauth.account', { provider: 'Apple', email: relay }))).toBeTruthy();
  expect(screen.getByText(screen.t('acct.delete.reauth.apple'))).toBeTruthy();
  await typeAndConfirm(screen, 'set.security.pwLabel');
  await waitFor(() => expect(onFinished).toHaveBeenCalledWith('accepted'));
  expect(credentials.password.verify).toHaveBeenCalledWith('mopiru2026');
  expect(onSubmit).toHaveBeenCalledWith({ provider: 'password' });
});

it('V0-F18-AC-02 V0-del-apple-more: a right password with no stored token asks for Apple once more, then finishes', async () => {
  const onSubmit = jest.fn().mockResolvedValueOnce('appleRequired').mockResolvedValueOnce('accepted');
  const { screen, onFinished, port } = await open(held(), onSubmit);
  await typeAndConfirm(screen, 'set.security.pwLabel');
  expect(await screen.findByText(screen.t('acct.delete.apple.more.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('acct.delete.reauth.forgot.oauth') }));
  await waitFor(() => expect(onFinished).toHaveBeenCalled());
  expect(port.apple).toHaveBeenCalled();
  expect(onSubmit).toHaveBeenLastCalledWith(appleCode.reauth);
});

it('V0-F18-AC-02 the server answer maps to appleRequired and nothing is claimed', async () => {
  expect(await submitDeletion(() => Promise.reject(new ApiError(409, 'APPLE_CONFIRM_REQUIRED')))).toBe('appleRequired');
});

it('V0-F18-AC-03 wrong, then locked: Apple offers the way out; an email account waits', async () => {
  const verify = jest.fn().mockResolvedValueOnce('wrong').mockResolvedValueOnce('locked');
  const { screen, port } = await open(held({ password: { verify } }));
  await typeAndConfirm(screen, 'set.security.pwLabel');
  expect(await screen.findByText(screen.t('acct.delete.reauth.wrong'))).toBeTruthy();
  await typeAndConfirm(screen, 'set.security.pwLabel');
  expect(await screen.findByText(screen.t('acct.delete.reauth.rate'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('acct.delete.reauth.forgot.oauth') }));
  await waitFor(() => expect(port.apple).toHaveBeenCalled());

  const email = await open(held({ apple: false, email: 'haru@example.com', password: { verify: jest.fn().mockResolvedValue('locked') } }));
  await typeAndConfirm(email.screen, 'login.pw.label');
  expect(await email.screen.findByText(email.screen.t('auth.login.rate'))).toBeTruthy();
  expect(email.screen.getByRole('button', { name: email.screen.t('acct.delete.reauth.submit') }).props.accessibilityState.disabled).toBe(true);
});

it('V0-F18-AC-05 forgot: Apple again for an Apple account', async () => {
  const { screen } = await open(held());
  await fireEvent.press(screen.getByRole('button', { name: screen.t('login.pw.forgot') }));
  expect(screen.getByText(screen.t('acct.delete.reauth.forgot.body'))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('acct.delete.reauth.forgot.oauth') })).toBeTruthy();
});

it('V0-F18-AC-05 forgot: reset mail with mail on, contact without', async () => {
  const on = await open(held({ apple: false, email: 'haru@example.com', mail: true }));
  expect(on.screen.getByText(on.screen.t('acct.delete.reauth.body.email'))).toBeTruthy();
  await fireEvent.press(on.screen.getByRole('button', { name: on.screen.t('login.pw.forgot') }));
  await fireEvent.press(on.screen.getByRole('button', { name: on.screen.t('login.reset.send') }));
  expect(on.onReset).toHaveBeenCalled();
  const off = await open(held({ apple: false, email: 'haru@example.com' }));
  await fireEvent.press(off.screen.getByRole('button', { name: off.screen.t('login.pw.forgot') }));
  expect(off.screen.getByText(off.screen.t('acct.delete.reauth.forgot.nomail'))).toBeTruthy();
  expect(off.screen.getByRole('button', { name: `${off.screen.t('set.help.contact')} · ${off.screen.t('auth.support.mail')}` })).toBeTruthy();
});

it('V0-F12-AC-08 an Apple account with no password keeps the Apple confirmation and no sheet', async () => {
  const port = reauth(), onSubmit = jest.fn().mockResolvedValue('accepted');
  const screen = await renderWithI18n(<DeleteAccountScreen v0 reauth={port} onSubmit={onSubmit} onFinished={jest.fn().mockResolvedValue(undefined)} onCancel={jest.fn()} credentials={held({ hasPassword: false })} options={options} />);
  await fireEvent.press(screen.getByRole('checkbox', { name: screen.t('set.confirm.check') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.delete.reauth', { provider: 'Apple' }) }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(appleCode.reauth));
  expect(screen.queryByText(screen.t('acct.delete.reauth.title'))).toBeNull();
});
