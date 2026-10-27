import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';
/** Apple's own button (HIG-compliant asset), so Sign in with Apple needs no G5 replacement. */
export function AppleButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={{ height: 48 }}
      accessibilityLabel={t('login.apple')}
      testID="apple-sign-in"
      onPress={onPress}
    />
  );
}
