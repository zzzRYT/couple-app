import { fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import MeRoute from '../../../app/settings/me';

const mockUseSpace = jest.fn();
const mockClient = { saveMemberProfile: jest.fn(), saveProfilePhoto: jest.fn(), removeProfilePhoto: jest.fn() };
const mockSave = jest.fn();
jest.mock('../../space/SpaceContext', () => ({ useSpace: () => mockUseSpace(), useOptionalSpace: () => mockUseSpace() }));
jest.mock('../../../lib/AppContext', () => ({ useApp: () => ({ client: mockClient }) }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-image-manipulator', () => ({ SaveFormat: { JPEG: 'jpeg' }, ImageManipulator: { manipulate: () => ({ resize: () => ({ renderAsync: async () => ({ saveAsync: mockSave }) }) }) } }));
const refresh = jest.fn();
function space(photo: string | null, offline = false) {
  const snapshot = snapshotFixture(); snapshot.me.photo = photo;
  mockUseSpace.mockReturnValue({ state: { snapshot, offline }, refresh });
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///picked.jpg', width: 900, height: 900 }] });
  mockSave.mockResolvedValue({ uri: 'file:///small.jpg', width: 512, height: 512, base64: 'SMALLJPEG' });
  mockClient.saveProfilePhoto.mockResolvedValue(undefined); mockClient.removeProfilePhoto.mockResolvedValue(undefined);
});

it('uploads a picked photo as a small JPEG at once, then refreshes the profiles', async () => {
  space(null);
  const screen = await renderWithI18n(<MeRoute />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.me.photo') }));
  expect(screen.queryByRole('button', { name: screen.t('set.me.photo.remove') })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.me.photo.choose') }));
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ format: 'jpeg', base64: true }));
  expect(mockClient.saveProfilePhoto).toHaveBeenCalledWith('SMALLJPEG');
  expect(mockClient.saveMemberProfile).not.toHaveBeenCalled();
});

it('removes an existing photo', async () => {
  space('https://cdn/p/me.jpg?token=1');
  const screen = await renderWithI18n(<MeRoute />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.me.photo') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.me.photo.remove') }));
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  expect(mockClient.removeProfilePhoto).toHaveBeenCalled();
});

it('says so when the photo could not be changed, and does nothing when picking is cancelled', async () => {
  space(null); mockClient.saveProfilePhoto.mockRejectedValue(new Error('INVALID_REQUEST'));
  const screen = await renderWithI18n(<MeRoute />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.me.photo') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.me.photo.choose') }));
  expect(await screen.findByRole('alert', { name: screen.t('set.me.photo.failed') })).toBeTruthy();
  expect(refresh).not.toHaveBeenCalled();
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: null });
  mockClient.saveProfilePhoto.mockClear();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.me.photo.choose') }));
  expect(mockClient.saveProfilePhoto).not.toHaveBeenCalled();
});

it('waits offline', async () => {
  space(null, true);
  const screen = await renderWithI18n(<MeRoute />);
  expect(screen.getByRole('button', { name: screen.t('a11y.me.photo') }).props.accessibilityState.disabled).toBe(true);
});
