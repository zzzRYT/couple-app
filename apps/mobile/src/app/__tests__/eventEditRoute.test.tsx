import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithI18n } from '../../test/render';
import { snapshotFixture } from '../../test/fixtures';
import EventEditRoute from '../event-edit';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() }, useLocalSearchParams: () => ({ date: '2026-11-27' }) }));
jest.mock('../../features/notifications/permissions', () => ({ notificationPermission: jest.fn(async () => 'granted'), requestNotificationPermission: jest.fn(async () => true) }));
const mockApp = { client: { createEvent: jest.fn(async () => undefined) } };
jest.mock('../../lib/AppContext', () => ({ useApp: () => mockApp }));
const mockSpace = { state: { status: 'ready', snapshot: snapshotFixture(), offline: false, lastSyncedAt: null }, refresh: jest.fn(async () => undefined) };
jest.mock('../../features/space/SpaceContext', () => ({ useSpace: () => mockSpace, useOptionalSpace: () => mockSpace }));
jest.mock('../../lib/useNow', () => ({ useNow: () => '2026-11-25T03:00:00Z' }));

it('returns to the calendar tab already below the sheet instead of stacking another one', async () => {
  const screen = await renderWithI18n(<EventEditRoute />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('edit.field.title')), '저녁 데이트');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.save') }));
  await waitFor(() => expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/(tabs)/calendar', params: { toast: 'saved', date: '2026-11-27', at: expect.any(String) } }));
  expect(router.replace).not.toHaveBeenCalled();
});
