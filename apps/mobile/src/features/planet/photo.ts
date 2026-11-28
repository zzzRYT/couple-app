import * as Application from 'expo-application';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// The system editor returns only the part the user cropped, so the rest of the photo never reaches the generator.
export async function pickRegion(source: 'camera' | 'library'): Promise<{ uri: string } | 'denied' | 'cancelled'> {
  // shortcut: expo-image-picker 58 aborts the app when there is no camera, which is every iOS simulator; drop this once the picker rejects instead.
  if (source === 'camera' && Platform.OS === 'ios' && await Application.getIosApplicationReleaseTypeAsync() === Application.ApplicationReleaseType.SIMULATOR) throw new Error('No camera on a simulator');
  if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return 'denied';
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', allowsEditing: true, quality: 0.8 };
  const result = await (source === 'camera' ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options));
  const uri = result.canceled ? undefined : result.assets[0]?.uri;
  return uri ? { uri } : 'cancelled';
}
