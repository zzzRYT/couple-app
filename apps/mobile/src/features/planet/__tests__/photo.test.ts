import * as Application from 'expo-application';
import * as ImagePicker from 'expo-image-picker';
import { pickRegion } from '../photo';

jest.mock('expo-image-picker', () => ({ requestCameraPermissionsAsync: jest.fn(), launchCameraAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-application', () => ({ ApplicationReleaseType: { SIMULATOR: 1, APP_STORE: 4 }, getIosApplicationReleaseTypeAsync: jest.fn(async () => 4) }));
const picker = jest.mocked(ImagePicker);
const picked = { canceled: false, assets: [{ uri: 'file:///region.jpg' }] } as ImagePicker.ImagePickerResult;

it('returns only the region the user cropped from the library', async () => {
  picker.launchImageLibraryAsync.mockResolvedValueOnce(picked);
  expect(await pickRegion('library')).toEqual({ uri: 'file:///region.jpg' });
  expect(picker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ mediaTypes: 'images', allowsEditing: true }));
  expect(picker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
});

it('opens the camera only after permission and reports a cancelled pick', async () => {
  picker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false } as ImagePicker.CameraPermissionResponse);
  expect(await pickRegion('camera')).toBe('denied');
  expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  picker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: true } as ImagePicker.CameraPermissionResponse);
  picker.launchCameraAsync.mockResolvedValueOnce({ canceled: true, assets: null });
  expect(await pickRegion('camera')).toBe('cancelled');
  expect(picker.launchCameraAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsEditing: true }));
});

it('refuses the camera on an iOS simulator instead of launching it', async () => {
  jest.mocked(Application.getIosApplicationReleaseTypeAsync).mockResolvedValueOnce(Application.ApplicationReleaseType.SIMULATOR);
  picker.launchCameraAsync.mockClear();
  await expect(pickRegion('camera')).rejects.toThrow('No camera on a simulator');
  expect(picker.launchCameraAsync).not.toHaveBeenCalled();
});
