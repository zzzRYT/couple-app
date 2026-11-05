import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, Button } from '../../ui/components';
import { WheelColumn } from '../../ui/DateWheel';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { formatNotifyTime } from '../notifications/labels';

const range = (length: number) => Array.from({ length }, (_, index) => index);
const pad = (value: number) => String(value).padStart(2, '0');
/** Not drawn on the board: an hour and minute wheel in the same sheet and look as the date wheel, in one-minute steps. */
export function NotificationTimeSheet({ visible, time, onClose, onSelect }: { visible: boolean; time: string; onClose: () => void; onSelect: (time: string) => void }) {
  const { t, i18n } = useTranslation();
  const color = useAppColor();
  const [draft, setDraft] = useState(time);
  useEffect(() => { if (visible) setDraft(time); }, [visible, time]);
  const hour = Number(draft.slice(0, 2)), minute = Number(draft.slice(3, 5));
  const hourLabel = (value: number) => new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', hour12: true, timeZone: 'UTC' }).format(Date.UTC(2000, 0, 1, value)).replace(/\s/g, ' ');
  const spoken = formatNotifyTime(draft, i18n.language);
  return <BottomSheet visible={visible} title={t('set.notify.time')} onClose={onClose}>
    <View style={{ flexDirection: 'row', paddingVertical: 4, borderWidth: tokens.border.outline.normal, borderColor: color.line, borderRadius: tokens.radius.card, backgroundColor: color.surface }}>
      <WheelColumn id="hour" values={range(24)} selected={hour} unit={t('set.notify.time')} label={hourLabel} spoken={spoken} onChange={(value) => setDraft(`${pad(value)}:${pad(minute)}`)} />
      <WheelColumn id="minute" values={range(60)} selected={minute} unit={t('set.notify.time')} label={pad} spoken={spoken} onChange={(value) => setDraft(`${pad(hour)}:${pad(value)}`)} />
    </View>
    <Button label={t('common.done')} onPress={() => { onSelect(draft); onClose(); }} />
  </BottomSheet>;
}
