import { useEffect } from 'react';
import { View } from 'react-native';
import { useAppColor } from '../../theme/useAppColor';
import { AppText } from '../../ui/components';
import { Icon } from '../../ui/Icon';
export function AnniversaryToast({ text, error = false, onHide }: { text: string; error?: boolean; onHide: () => void }) {
  const color = useAppColor();
  useEffect(() => { const timer = setTimeout(onHide, 3000); return () => clearTimeout(timer); }, [onHide]);
  return <View accessible accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, backgroundColor: color.text, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } }}><Icon name={error ? 'warn' : 'check'} size={20} color={color.surface} /><AppText style={{ color: color.surface, fontSize: 15, fontWeight: '700', flexShrink: 1 }}>{text}</AppText></View>;
}
