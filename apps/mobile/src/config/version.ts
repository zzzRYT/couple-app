import * as Application from 'expo-application';
import Constants from 'expo-constants';

export function appVersionLabel(): string {
  return `${Application.nativeApplicationVersion ?? Constants.expoConfig?.version} (${Application.nativeBuildVersion ?? '-'})`;
}
