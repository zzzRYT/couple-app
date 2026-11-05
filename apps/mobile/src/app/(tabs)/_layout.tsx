import { NativeTabs } from 'expo-router/native-tabs';
import { usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColor } from '../../theme/useAppColor';

export default function TabLayout() {
  const { t } = useTranslation();
  const color = useAppColor();
  const path = usePathname();
  const label = (key: string, n: number, selected: boolean) => t('a11y.tab', { name: t(key), total: 3, n, sel: selected ? t('a11y.tab.sel') : '' });
  return (
    <NativeTabs tintColor={color.primary} iconColor={color.text2} labelStyle={{ color: color.text2 }}>
      <NativeTabs.Trigger name="home" accessibilityLabel={label('tab.home', 1, path === '/home')}><NativeTabs.Trigger.Label>{t('tab.home')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="home" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="anniversaries/index" accessibilityLabel={label('tab.anniv', 2, path.startsWith('/anniversaries'))}><NativeTabs.Trigger.Label>{t('tab.anniv')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="calendar" drawable="calendar" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings/index" accessibilityLabel={label('tab.settings', 3, path.startsWith('/settings'))}><NativeTabs.Trigger.Label>{t('tab.settings')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} drawable="settings" /></NativeTabs.Trigger>
    </NativeTabs>
  );
}
