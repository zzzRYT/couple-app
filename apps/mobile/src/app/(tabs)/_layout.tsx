import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { tokens } from '../../theme/tokens';

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <NativeTabs tintColor={tokens.color.app.light.normal.primary} iconColor={tokens.color.app.light.normal.text2} labelStyle={{ color: tokens.color.app.light.normal.text2 }}>
      <NativeTabs.Trigger name="home"><NativeTabs.Trigger.Label>{t('tab.home')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="house" drawable="home" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="room"><NativeTabs.Trigger.Label>{t('tab.room')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="sparkles" drawable="star" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings/index"><NativeTabs.Trigger.Label>{t('tab.settings')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="gearshape" drawable="settings" /></NativeTabs.Trigger>
    </NativeTabs>
  );
}
