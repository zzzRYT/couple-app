import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';
import { useDisplayAppearance } from '../settings/preferences';
/** Apple's own button (HIG-compliant asset), so Sign in with Apple needs no G5 replacement. */
export function AppleButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { scheme } = useDisplayAppearance();
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={scheme === 'dark' ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={26}
      style={{ height: 52 }}
      accessibilityLabel={t('auth.apple')}
      testID="apple-sign-in"
      onPress={onPress}
    />
  );
}
