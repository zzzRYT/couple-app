import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { useAppColor } from '../../theme/useAppColor';

export default function TabLayout() {
  const { t } = useTranslation();
  const color = useAppColor();
  return (
    <NativeTabs tintColor={color.primary} iconColor={color.text2} labelStyle={{ color: color.text2 }}>
      <NativeTabs.Trigger name="home"><NativeTabs.Trigger.Label>{t('tab.home')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="home" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="room"><NativeTabs.Trigger.Label>{t('tab.room')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf={{ default: 'square.split.1x2', selected: 'square.split.1x2.fill' }} drawable="star" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings/index"><NativeTabs.Trigger.Label>{t('tab.settings')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="slider.horizontal.3" drawable="settings" /></NativeTabs.Trigger>
    </NativeTabs>
  );
}
