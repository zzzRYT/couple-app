import { Linking } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { APP_IDENTITY } from '../../../config/identity';
import { TERMS_URL } from '../helpLinks';
import type { Locale } from '../../../i18n';
import { V0SettingsScreen } from '../V0SettingsScreen';
const mockPreferences: { locale: Locale | null; displayMode: 'system' } = { locale: null, displayMode: 'system' };
jest.mock('../preferences', () => ({ ...jest.requireActual('../preferences'), usePreferences: () => mockPreferences }));
beforeEach(() => { mockPreferences.locale = null; });
const withBirthday = () => { const snapshot = snapshotFixture(); snapshot.me.birthday = { month: 3, day: 14, year: null }; return snapshot; };
it('V0-F12-AC-01 exposes V0 rows and hides room, cover and consent', async () => {
  const navigate = jest.fn();
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />);
  expect(screen.queryByText(screen.t('set.section.me'))).toBeNull();
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
it('V0-NF-02 draws the time-zone row as the board does, not from the engine zone names', async () => {
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />);
  expect(screen.getByText('서울 (UTC+9)')).toBeTruthy();
});
it.each([['ko-KR', '생일 · 3월 14일', '2025년 6월 29일'], ['en-US', 'Birthday · Mar 14', 'Jun 29, 2025'], ['ja-JP', '誕生日 · 3月14日', '2025年6月29日']] as const)('V0-set-main opens my profile from the card and writes dates as the board does in %s', async (locale, birthday, start) => {
  const navigate = jest.fn();
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={withBirthday()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />, locale);
  expect(screen.getByText(birthday)).toBeTruthy();
  expect(screen.getByText(start)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: `하루, ${birthday}` }));
  expect(navigate).toHaveBeenCalledWith('me');
});
it('V0-set-main names a chosen language in that language, not by its code', async () => {
  mockPreferences.locale = 'en-US';
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />);
  expect(screen.getByRole('button', { name: `${screen.t('set.lang')}, English` })).toBeTruthy();
  expect(screen.queryByText('en-US')).toBeNull();
});
it('V0-F12-AC-10 confirms logout without the room line and tells a failure inside the dialog', async () => {
  const onLogout = jest.fn().mockRejectedValueOnce(new Error('offline'));
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={onLogout} onZone={jest.fn()} navigate={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.account.logout') }));
  expect(screen.getByText(screen.t('set.logout.title'))).toBeTruthy();
  expect(screen.queryByText(screen.t('set.logout.body'))).toBeNull();
  await fireEvent.press(screen.getAllByRole('button', { name: screen.t('set.account.logout') }).at(-1)!);
  await waitFor(() => expect(screen.getByRole('alert', { name: screen.t('state.error.body') })).toBeTruthy());
  expect(screen.getByText(screen.t('set.logout.title'))).toBeTruthy();
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
describe('V0-F02-AC-11 partner row (V0-10)', () => {
  it('offers "연결하기" while nobody has joined and opens the connect screen', async () => {
    const navigate = jest.fn();
    const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture({ memberCount: 1 })} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />);
    await fireEvent.press(screen.getByRole('button', { name: `${screen.t('set.us.partner')}, ${screen.t('set.us.connect')}` }));
    expect(navigate).toHaveBeenCalledWith('connect');
  });
  it('is disabled offline', async () => {
    const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture({ memberCount: 1 })} offline version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />);
    expect(screen.getByRole('button', { name: `${screen.t('set.us.partner')}, ${screen.t('set.us.connect')}` }).props.accessibilityState.disabled).toBe(true);
  });
  it('shows only the connected state once the partner joined: no connect action', async () => {
    const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />);
    expect(screen.getByLabelText(`${screen.t('set.us.partner')}, ${screen.t('set.us.connected', { name: '도담' })}`)).toBeTruthy();
    expect(screen.queryByText(screen.t('set.us.connect'))).toBeNull();
  });
});
describe('연결 끊기 is offered only to a connected couple', () => {
  it('hides 연결 끊기 while nobody has joined and keeps 계정 삭제', async () => {
    const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture({ memberCount: 1 })} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={jest.fn()} />);
    expect(screen.queryByRole('button', { name: screen.t('set.account.disconnect') })).toBeNull();
    expect(screen.getByRole('button', { name: screen.t('set.account.delete') })).toBeTruthy();
  });
  it('shows 연결 끊기 once the partner joined', async () => {
    const navigate = jest.fn();
    const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn()} navigate={navigate} />);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.account.disconnect') }));
    expect(navigate).toHaveBeenCalledWith('disconnect');
  });
});
it('a failed time-zone save says it was not saved, inside the sheet', async () => {
  const screen = await renderWithI18n(<V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="0.1" onLogout={jest.fn()} onZone={jest.fn().mockRejectedValue(new Error('offline'))} navigate={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: new RegExp(screen.t('set.us.tz')) }));
  await fireEvent.press(screen.getByRole('button', { name: 'Asia/Tokyo' }));
  await waitFor(() => expect(screen.getByRole('alert', { name: screen.t('set.save.err') })).toBeTruthy());
  expect(screen.getByText(screen.t('set.room.tz.pick'))).toBeTruthy();
});
