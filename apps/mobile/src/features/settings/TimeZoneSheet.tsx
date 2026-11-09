import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet, ListRow, TextField } from '../../ui/components';
import { InlineError } from '../../ui/InlineNote';
const fallbackZones = ['Asia/Seoul', 'Asia/Tokyo', 'Asia/Taipei', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'Pacific/Auckland'];
const supportedZones = (Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }).supportedValuesOf?.('timeZone') ?? fallbackZones;
export function TimeZoneSheet({ visible, timeZone, disabled, failed = false, onClose, onSelect }: { visible: boolean; timeZone?: string; disabled?: boolean; failed?: boolean; onClose: () => void; onSelect: (zone: string) => void }) {
  const { t } = useTranslation(); const [query, setQuery] = useState('');
  const zones = useMemo(() => [...new Set(query.trim() ? supportedZones : [...fallbackZones, ...(timeZone ? [timeZone] : [])])].filter((zone) => zone.toLowerCase().includes(query.trim().toLowerCase())), [query, timeZone]);
  return <BottomSheet visible={visible} title={t('set.room.tz.pick')} onClose={onClose}>
    <TextField label={t('set.room.tz.search')} value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} />
    {failed && <InlineError text={t('state.error.body')} />}
    {zones.map((zone) => <ListRow key={zone} label={zone} value={timeZone === zone ? '✓' : undefined} disabled={disabled} onPress={() => onSelect(zone)} />)}
  </BottomSheet>;
}
