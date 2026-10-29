import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ApiError } from '../../../lib/errors';
import { createApi } from '../../../lib/api';
import { createClient } from '../../../lib/client';
import { routes } from '../../../lib/routes';
import { SettingsScreen } from '../../settings/SettingsScreen';
import { LoginScreen } from '../../auth/LoginScreen';
import { EndedScreen } from '../../lifecycle/EndedScreen';
import { DeleteAccountScreen, reauthChoices } from '../DeleteAccountScreen';
import { clearDeviceAfterDeletion, farewell, submitDeletion, type ReauthPort, type SubmitResult } from '../deleteAccount';
import type { AuthPort } from '../../auth/authPort';

const LOCALES = ['ko-KR', 'en-US', 'ja-JP'] as const;
const resource = (locale: string) => JSON.parse(readFileSync(resolve(__dirname, '../../../i18n/locales', `${locale}.json`), 'utf8')) as Record<string, string>;
const RETENTION = { 'ko-KR': /복구|복원|유예|\d+\s*일|며칠|남은/, 'en-US': /restor|recover|grace|\d+\s*days?|days left/i, 'ja-JP': /復元|復旧|猶予|\d+\s*日|残り/ } as const;
const escape = (text: string) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const appleOnly = { apple: 'native' as const, kakao: false, devEmail: false };
function port(overrides: Partial<ReauthPort> = {}): ReauthPort {
  return {
    apple: jest.fn().mockResolvedValue({ kind: 'ok', reauth: { provider: 'apple', authorizationCode: 'code-1' } }),
    kakao: jest.fn().mockResolvedValue({ kind: 'cancelled' }),
    sendEmailCode: jest.fn().mockResolvedValue(true),
    verifyEmailCode: jest.fn().mockResolvedValue({ kind: 'ok', reauth: { provider: 'email' } }),
    ...overrides,
  };
}
async function open(onSubmit: (input: unknown) => Promise<SubmitResult>, reauth = port(), onFinished = jest.fn().mockResolvedValue(undefined)) {
  const screen = await renderWithI18n(<DeleteAccountScreen reauth={reauth} onSubmit={onSubmit} onFinished={onFinished} onCancel={jest.fn()} provider="apple" options={appleOnly} />);
  return { screen, reauth, onFinished };
}
async function checkAndConfirm(screen: Awaited<ReturnType<typeof renderWithI18n>>) {
  await fireEvent.press(screen.getByRole('checkbox', { name: screen.t('end.check') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('acct.delete.confirm') }));
}

it('keeps days, restore and grace wording out of every account deletion string, and the partner notice has no name', () => {
  for (const locale of LOCALES) {
    const strings = resource(locale);
    const entries = Object.entries(strings).filter(([key]) => /^(acct\.|set\.account\.)/.test(key) || key === 'end.byPartnerDeleted');
    expect(entries.length).toBe(17);
    for (const [key, value] of entries) expect({ key, hit: RETENTION[locale].test(value) }).toEqual({ key, hit: false });
    expect(strings['end.byPartnerDeleted']).not.toMatch(/\{\{/);
  }
});

describe('settings entry', () => {
  it('shows "Delete account" in the danger zone, with or without a space, and opens the flow', async () => {
    const onOpen = jest.fn();
    const screen = await renderWithI18n(<SettingsScreen onLogout={jest.fn()} onOpenDeleteAccount={onOpen} />);
    expect(screen.getByText(screen.t('set.sec.danger'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: `${screen.t('set.account.delete')}, ${screen.t('set.account.delete.sub')}` }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('S13 account deletion', () => {
  it('explains the result and keeps the red button inactive until the checkmark (S13-delete-explain/checked)', async () => {
    const onSubmit = jest.fn();
    const { screen, reauth } = await open(onSubmit);
    for (const key of ['acct.delete.title', 'acct.delete.lead', 'acct.delete.b1', 'acct.delete.b2', 'acct.delete.b3']) expect(screen.getByText(escape(screen.t(key)))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('acct.delete.confirm') }));
    expect(screen.queryByText(screen.t('acct.delete.reauth.title'))).toBeNull();
    await checkAndConfirm(screen);
    expect(screen.getByText(screen.t('acct.delete.reauth.title'))).toBeTruthy();
    expect(screen.getByText(screen.t('acct.delete.reauth.body'))).toBeTruthy();
    expect(reauth.apple).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('signs in again with the same login UI, sends the Apple code, shows progress, then hands over to local sign-out', async () => {
    let finish!: (value: SubmitResult) => void;
    const onSubmit = jest.fn(() => new Promise<SubmitResult>((resolve) => { finish = resolve; }));
    const { screen, onFinished } = await open(onSubmit);
    await checkAndConfirm(screen);
    await fireEvent.press(screen.getByTestId('apple-sign-in'));
    expect(onSubmit).toHaveBeenCalledWith({ provider: 'apple', authorizationCode: 'code-1' });
    expect(screen.getByText(screen.t('acct.delete.progress'))).toBeTruthy();
    await act(async () => { finish('accepted'); });
    await waitFor(() => expect(onFinished).toHaveBeenCalledWith('accepted'));
  });

  it('a failed or refused re-authentication shows S13-delete-reauth-fail and sends nothing', async () => {
    const onSubmit = jest.fn();
    const { screen } = await open(onSubmit, port({ apple: jest.fn().mockResolvedValue({ kind: 'error' }) }));
    await checkAndConfirm(screen);
    await fireEvent.press(screen.getByTestId('apple-sign-in'));
    expect(screen.getByText(screen.t('acct.delete.reauth.fail'))).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('a server REAUTH_REQUIRED goes back to identity check with the failure line', async () => {
    const { screen, onFinished } = await open(jest.fn().mockResolvedValue('reauthFailed'));
    await checkAndConfirm(screen);
    await fireEvent.press(screen.getByTestId('apple-sign-in'));
    await waitFor(() => expect(screen.getByText(screen.t('acct.delete.reauth.fail'))).toBeTruthy());
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('offline: only the notice, no queue and no second attempt (S13-delete-offline)', async () => {
    const onSubmit = jest.fn().mockResolvedValue('offline');
    const { screen, onFinished } = await open(onSubmit);
    await checkAndConfirm(screen);
    await fireEvent.press(screen.getByTestId('apple-sign-in'));
    await waitFor(() => expect(screen.getByText(screen.t('acct.delete.offline'))).toBeTruthy());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('a failure before acceptance says nothing was deleted and offers a retry (S13-delete-fail)', async () => {
    const { screen, onFinished } = await open(jest.fn().mockResolvedValue('failed'));
    await checkAndConfirm(screen);
    await fireEvent.press(screen.getByTestId('apple-sign-in'));
    await waitFor(() => expect(screen.getByText(screen.t('acct.delete.fail.title'))).toBeTruthy());
    expect(screen.getByText(screen.t('acct.delete.fail.body'))).toBeTruthy();
    expect(screen.getByRole('button', { name: screen.t('common.retry') })).toBeTruthy();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('offers the development email code only in development builds and verifies the code', async () => {
    const reauth = port();
    const onSubmit = jest.fn().mockResolvedValue('accepted');
    const screen = await renderWithI18n(<DeleteAccountScreen reauth={reauth} onSubmit={onSubmit} onFinished={jest.fn().mockResolvedValue(undefined)} onCancel={jest.fn()} provider="email" options={{ apple: null, kakao: false, devEmail: true }} />);
    await checkAndConfirm(screen);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('login.email') }));
    await fireEvent.changeText(screen.getByLabelText(screen.t('login.code.label')), '123456');
    await fireEvent.press(screen.getByRole('button', { name: screen.t('login.code.confirm') }));
    expect(reauth.verifyEmailCode).toHaveBeenCalledWith('123456');
    expect(onSubmit).toHaveBeenCalledWith({ provider: 'email' });
  });

  it('offers the account\'s own provider when available, otherwise what the build offers', () => {
    expect(reauthChoices(appleOnly, 'apple')).toEqual(['apple']);
    expect(reauthChoices({ apple: 'native', kakao: true, devEmail: true }, 'kakao')).toEqual(['kakao']);
    expect(reauthChoices({ apple: 'native', kakao: false, devEmail: true }, 'kakao')).toEqual(['apple', 'email']);
  });
});

describe('request and local clean-up', () => {
  it('posts to the deletion alias once, with confirm and the re-authentication, and no automatic retry', async () => {
    const call = jest.fn().mockResolvedValue({ status: 503, json: async () => ({ error: { code: 'SERVER_ERROR' } }) });
    const client = createClient(createApi(call, () => 'key-1'));
    await expect(client.deleteAccount({ provider: 'apple', authorizationCode: 'c' })).rejects.toBeInstanceOf(ApiError);
    expect(call).toHaveBeenCalledTimes(1);
    expect(call.mock.calls[0][0]).toBe(routes.deleteAccount());
    expect(JSON.parse(call.mock.calls[0][1].body)).toEqual({ confirm: true, reauth: { provider: 'apple', authorizationCode: 'c' } });
    expect(call.mock.calls[0][1].headers['Idempotency-Key']).toBe('key-1');
  });

  it('maps server answers: 202 and 409 ACCOUNT_DELETING are accepted, 401 signs out, network errors are offline', async () => {
    expect(await submitDeletion(async () => ({ state: 'requested' }))).toBe('accepted');
    expect(await submitDeletion(async () => { throw new ApiError(409, 'ACCOUNT_DELETING'); })).toBe('accepted');
    expect(await submitDeletion(async () => { throw new ApiError(401, 'REAUTH_REQUIRED'); })).toBe('reauthFailed');
    expect(await submitDeletion(async () => { throw new ApiError(401, 'UNAUTHORIZED'); })).toBe('signedOut');
    expect(await submitDeletion(async () => { throw new ApiError(503, 'PROVIDER_NOT_CONFIGURED'); })).toBe('failed');
    expect(await submitDeletion(async () => { throw new TypeError('Network request failed'); })).toBe('offline');
  });

  it('after acceptance cancels every scheduled notification, clears local caches, signs out and shows the done notice', async () => {
    const order: string[] = [];
    const deps = {
      signOut: jest.fn(async () => { order.push(`signOut:${farewell.get()}`); }),
      cancelNotifications: jest.fn(async () => { order.push('notifications'); }),
      clearPendingInvite: jest.fn(async () => { order.push('invite'); }),
      resetSpace: jest.fn(() => { order.push('space'); }),
    };
    await clearDeviceAfterDeletion('accepted', deps);
    expect(order).toEqual(['notifications', 'invite', 'space', 'signOut:true']);
    farewell.set(false);
    await clearDeviceAfterDeletion('signedOut', { ...deps, cancelNotifications: jest.fn().mockRejectedValue(new Error('x')) });
    expect(farewell.get()).toBe(false);
    expect(deps.signOut).toHaveBeenCalledTimes(2);
  });

  it('the sign-in screen shows "Your account was deleted" (S13-delete-done)', async () => {
    const auth = { apple: jest.fn(), oauth: jest.fn(), sendCode: jest.fn(), verifyCode: jest.fn(), signOut: jest.fn() } as unknown as AuthPort;
    const screen = await renderWithI18n(<LoginScreen auth={auth} onDone={jest.fn()} onEmail={jest.fn()} notice="" options={appleOnly} />);
    expect(screen.queryByText(screen.t('acct.delete.done'))).toBeNull();
    const shown = await renderWithI18n(<LoginScreen auth={auth} onDone={jest.fn()} onEmail={jest.fn()} notice={screen.t('acct.delete.done')} options={appleOnly} />);
    expect(shown.getByText(shown.t('acct.delete.done'))).toBeTruthy();
  });

  it('the partner sees "your partner deleted their account" without a name (S14-partner-deleted)', async () => {
    for (const locale of LOCALES) {
      const screen = await renderWithI18n(<EndedScreen ended={{ kind: 'account_deleted', by: 'partner', at: '2026-11-02T00:00:00Z' }} hasActiveSpace={false} partnerName="Mina" onContinue={jest.fn()} />, locale);
      expect(screen.getByText(screen.t('end.byPartnerDeleted'))).toBeTruthy();
      expect(screen.queryByText(/Mina/)).toBeNull();
    }
  });
});
