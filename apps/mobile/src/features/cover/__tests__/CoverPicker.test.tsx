import { fireEvent } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { renderWithI18n } from '../../../test/render';
import { CoverPicker } from '../CoverPicker';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const imageAsset = { uri: 'file:///cover.jpg', fileSize: 1200, mimeType: 'image/jpeg', width: 640, height: 640 } as ImagePicker.ImagePickerAsset;
const common = () => ({ cover: null, userId: 'me', offline: false, dayCount: 12, since: 'Jan 1', onUpload: jest.fn().mockResolvedValue(undefined), onRemove: jest.fn().mockResolvedValue(undefined), onLoad: jest.fn().mockResolvedValue(undefined) });

it('opens the system picker without requesting the library permission and sends the selected asset to upload', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [imageAsset] });
  const props = common();
  const screen = await renderWithI18n(<CoverPicker {...props} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.cover.add') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('cover.sheet.pick') }));
  expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsEditing: true, aspect: [1, 1] }));
  expect(props.onUpload).toHaveBeenCalledWith(imageAsset);
});

it('disables cover changes while offline', async () => {
  const screen = await renderWithI18n(<CoverPicker {...common()} offline />);
  expect(screen.getByRole('button', { name: screen.t('a11y.cover.add') }).props.accessibilityState.disabled).toBe(true);
  expect(screen.queryByText(screen.t('cover.sheet.title'))).toBeNull();
});
