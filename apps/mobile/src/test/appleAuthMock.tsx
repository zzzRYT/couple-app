import { Pressable } from 'react-native';
// Native module stand-in for Jest; tests drive signInAsync through this jest.fn.
export const signInAsync = jest.fn();
export const AppleAuthenticationScope = { FULL_NAME: 0, EMAIL: 1 };
export const AppleAuthenticationButtonType = { SIGN_IN: 0, CONTINUE: 1 };
export const AppleAuthenticationButtonStyle = { WHITE: 0, WHITE_OUTLINE: 1, BLACK: 2 };
export function AppleAuthenticationButton({ onPress, accessibilityLabel, testID }: { onPress: () => void; accessibilityLabel?: string; testID?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} testID={testID} onPress={onPress} />;
}
