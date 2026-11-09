import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Chip, Screen } from '../../ui/components';
import { DateField, fromIsoDate, toIsoDate } from '../../ui/DateWheel';
import { InlineError } from '../../ui/InlineNote';
import { useType } from '../../theme/typography';
import { dayCount, todayIn } from '../../lib/dday';
export function V0DateScreen({ initial, now, timeZone, onNext, onBack }: { initial: string | null; now: string; timeZone: string; onNext: (date: string) => void; onBack: () => void }) {
  const { t } = useTranslation();
  const { emphasis } = useType();
  const [date, setDate] = useState(fromIsoDate(initial ?? todayIn(now, timeZone)));
  const check = dayCount(toIsoDate(date), now, timeZone);
  return <Screen onBack={onBack} footer={<Button label={t('common.next')} disabled={!check.ok} onPress={() => onNext(toIsoDate(date))} />}>
    <AppText variant="title">{t('start.date.title')}</AppText><AppText tone="text2">{t('start.date.body')}</AppText>
    <AppText style={emphasis(14)}>{t('start.date.label')}</AppText><DateField value={date} onChange={setDate} maxYear={Number(todayIn(now, timeZone).slice(0, 4))} error={!check.ok} renderPreview={(draft) => { const preview = dayCount(toIsoDate(draft), now, timeZone); return preview.ok ? <Chip kind="success" icon="heart" label={t('start.date.preview', { n: preview.dayCount })} /> : <InlineError text={t('start.date.err.future')} />; }} />
    {check.ok ? <Chip kind="success" icon="heart" label={t('start.date.preview', { n: check.dayCount })} /> : <InlineError text={t(check.code === 'FUTURE_DATE' ? 'start.date.err.future' : 'space.date.invalid')} />}
  </Screen>;
}
