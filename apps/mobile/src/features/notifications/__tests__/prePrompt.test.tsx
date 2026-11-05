import { act, fireEvent, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import ConnectedRoute from '../../../app/connected';
import { ME, PARTNER, snapshotFixture } from '../../../test/fixtures';
import { renderWithI18n } from '../../../test/render';
import { PrePromptScreen } from '../PrePromptScreen';
import { readNotifyPrefs, updateNotifyPrefs } from '../preferences';

let mockFile: string | null = null;
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  readAsStringAsync: jest.fn(async () => { if (mockFile === null) throw new Error('missing'); return mockFile; }),
  writeAsStringAsync: jest.fn(async (_: string, value: string) => { mockFile = value; }),
  deleteAsync: jest.fn(async () => { mockFile = null; }),
}));
jest.mock('expo-notifications', () => ({ requestPermissionsAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn() }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn(), dismissTo: jest.fn() } }));
const mockIdentity = { userId: ME as string };
jest.mock('../../../lib/AppContext', () => ({ useApp: () => mockIdentity }));
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => ({ spaceId: 'space-1', state: { snapshot: mockSnapshot } }) }));
const mockSnapshot = snapshotFixture();

const request = Notifications.requestPermissionsAsync as jest.Mock;
const replace = router.replace as jest.Mock, dismissTo = router.dismissTo as jest.Mock;
beforeEach(() => { mockFile = null; jest.clearAllMocks(); });

describe('V0-F10-AC-01 after V0-start-connected', () => {
  it.each([['creator', ME], ['joiner', PARTNER]])('shows the pre-prompt once to the %s', async (_, userId) => {
    mockIdentity.userId = userId;
    const screen = await renderWithI18n(<ConnectedRoute />);
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: screen.t('start.connected.cta') })); });
    await waitFor(() => { expect(replace).toHaveBeenCalledWith('/notify-intro'); });
    expect(dismissTo).not.toHaveBeenCalled();
  });
  it('goes straight home once it was seen', async () => {
    mockIdentity.userId = ME;
    await updateNotifyPrefs(ME, { prePromptSeen: true });
    const screen = await renderWithI18n(<ConnectedRoute />);
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: screen.t('start.connected.cta') })); });
    await waitFor(() => { expect(dismissTo).toHaveBeenCalledWith('/home'); });
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('V0-start-notify', () => {
  const open = async () => {
    const onDone = jest.fn();
    const screen = await renderWithI18n(<PrePromptScreen userId="me" onDone={onDone} />);
    await waitFor(async () => { expect((await readNotifyPrefs('me')).prePromptSeen).toBe(true); });
    return { screen, onDone };
  };
  it('shows the drawn copy and the mock notification', async () => {
    const { screen } = await open();
    expect(screen.getByText(screen.t('notify.pre.title'))).toBeTruthy();
    expect(screen.getByText(screen.t('notify.pre.body'))).toBeTruthy();
    expect(screen.getByText(screen.t('notify.sample.body'))).toBeTruthy();
    expect(screen.getByLabelText(`${screen.t('app.name')}, ${screen.t('notify.sample.body')}`)).toBeTruthy();
  });
  it('allow asks iOS and turns reminders on when granted', async () => {
    request.mockResolvedValue({ granted: true });
    const { screen, onDone } = await open();
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: screen.t('notify.pre.allow') })); });
    await waitFor(() => { expect(onDone).toHaveBeenCalled(); });
    expect(request).toHaveBeenCalledTimes(1);
    expect(await readNotifyPrefs('me')).toMatchObject({ enabled: true, prePromptSeen: true });
  });
  it('allow still goes home, with reminders off, when iOS is refused', async () => {
    request.mockResolvedValue({ granted: false });
    const { screen, onDone } = await open();
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: screen.t('notify.pre.allow') })); });
    await waitFor(() => { expect(onDone).toHaveBeenCalled(); });
    expect(await readNotifyPrefs('me')).toMatchObject({ enabled: false, prePromptSeen: true });
  });
  it('later goes home without asking iOS and is never shown again', async () => {
    const { screen, onDone } = await open();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('notify.pre.later') }));
    expect(onDone).toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
    expect(await readNotifyPrefs('me')).toMatchObject({ enabled: false, prePromptSeen: true });
  });
});
