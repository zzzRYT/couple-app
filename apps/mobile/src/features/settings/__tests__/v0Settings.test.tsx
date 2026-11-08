import { Linking } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { APP_IDENTITY } from '../../../config/identity';
import { TERMS_URL } from '../helpLinks';
import { V0SettingsScreen } from '../V0SettingsScreen';
it('V0-F12-AC-01 exposes V0 rows and hides room, cover and consent', async () => {
  const navigate = jest.fn();
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />);
  expect(screen.getByText(screen.t('set.section.me'))).toBeTruthy();
  expect(screen.getByText(screen.t('set.section.us'))).toBeTruthy();
  expect(screen.getByText(screen.t('set.section.display'))).toBeTruthy();
  expect(screen.queryByText(screen.t('set.cover'))).toBeNull();
  expect(screen.queryByText(screen.t('set.ai.consent'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: /사귄 날/ }));
  expect(navigate).toHaveBeenCalledWith('start-date');
});
it('V0-F13-AC-03 disables shared edits while offline', async () => {
  const navigate = jest.fn();
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />);
  expect(screen.getByRole('button', { name: /사귄 날/ }).props.accessibilityState.disabled).toBe(true);
});
it('asks before signing out without mentioning a room, which V0 does not have', async () => {
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: '로그아웃' }));
  expect(screen.getByText('로그아웃해도 공간은 그대로예요.')).toBeTruthy();
});
it('V0-NF-02 draws the time-zone row as the board does, not from the engine zone names', async () => {
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />);
  expect(screen.getByText('서울 (UTC+9)')).toBeTruthy();
});
describe('V0-F12-AC-09 help rows', () => {
  const open = jest.spyOn(Linking, 'openURL');
  beforeEach(() => { open.mockReset(); open.mockImplementation(async () => true as never); });
  const render = (locale: 'ko-KR' | 'en-US' | 'ja-JP', props: { supportEmail?: string | null; version?: string } = {}) =>
    renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version={props.version ?? '1.0.0 (12)'} supportEmail={props.supportEmail} onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />, locale);
  it('hides the contact row while no support email is decided, and shows the other three', async () => {
    const screen = await render('ko-KR', { supportEmail: null });
    expect(screen.queryByRole('button', { name: screen.t('set.help.contact') })).toBeNull();
    for (const key of ['set.help.privacy', 'set.help.terms']) expect(screen.getByRole('button', { name: new RegExp(screen.t(key)) })).toBeTruthy();
    expect(screen.getByText('1.0.0 (12)')).toBeTruthy();
  });
  it('shows the contact row with the public support email by default', async () => {
    const screen = await render('ko-KR');
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.help.contact') }));
    expect(open).toHaveBeenCalledWith(`mailto:${APP_IDENTITY.supportEmail}`);
  });
  it('opens a mailto link once a support email is set', async () => {
    const screen = await render('ko-KR', { supportEmail: 'help@example.com' });
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.help.contact') }));
    expect(open).toHaveBeenCalledWith('mailto:help@example.com');
  });
  it.each([['ko-KR', 'https://aroom.jinjinstar.com/privacy/'], ['en-US', 'https://aroom.jinjinstar.com/en/privacy/'], ['ja-JP', 'https://aroom.jinjinstar.com/ja/privacy/']] as const)('opens the %s privacy page', async (locale, url) => {
    const screen = await render(locale);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.help.privacy') }));
    expect(open).toHaveBeenCalledWith(url);
  });
  it('opens the standard EULA from the terms row and keeps the version row static', async () => {
    const screen = await render('ko-KR');
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.help.terms') }));
    expect(open).toHaveBeenCalledWith(TERMS_URL);
    expect(screen.queryByRole('button', { name: new RegExp(screen.t('set.help.version')) })).toBeNull();
  });
  it('shows the partner as a plain row and the sign-in method as the value of the V0-08 security row', async () => {
    const screen = await render('ko-KR');
    expect(screen.getByText(screen.t('set.us.partner'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: new RegExp(screen.t('set.us.partner')) })).toBeNull();
    expect(screen.getByRole('button', { name: new RegExp(`${screen.t('set.security.title')}.*${screen.t('set.account.apple')}`) })).toBeTruthy();
  });
  it('does not crash when the link cannot be opened', async () => {
    open.mockRejectedValue(new Error('no handler'));
    const screen = await render('en-US');
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.help.privacy') }));
    expect(screen.getByText(screen.t('set.help.privacy'))).toBeTruthy();
  });
});
