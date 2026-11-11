import { Fragment } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useType } from '../../theme/typography';
import { useAppColor } from '../../theme/useAppColor';
import { AppText, Button, Card, Screen } from '../../ui/components';
import type { Occurrence } from '../../lib/anniversaries';
import type { CustomAnniversary } from '../../lib/client';
import { todayIn } from '../../lib/dday';
import { OfflineBand } from '../space/OfflineBand';
import { DeleteAction } from './DeleteAction';
import { KindTile } from './KindTile';
import { formattedDate, formattedMonthDay, formattedYearMonthDay, occurrenceTitle, relativeDate } from './format';
export function AnniversaryDetail({ item, custom, today, startDate, timeZone, partner, userId, notify, notifyDefault, offline, syncedAt = null, onBack, onEdit, onDelete, onSettings, onMe }: { item: Occurrence; custom?: CustomAnniversary; today: string; startDate: string; timeZone: string; partner: string; userId: string; notify: 'default' | 'off'; notifyDefault: string; offline: boolean; syncedAt?: string | null; onBack: () => void; onEdit: () => void; onDelete: () => void; onSettings: () => void; onMe: () => void }) {
  const { t, i18n } = useTranslation(); const { emphasis } = useType(); const color = useAppColor();
  const title = occurrenceTitle(item, partner, t), date = formattedDate(item.date, i18n.language, true);
  const md = formattedMonthDay(item.date, i18n.language);
  const rule = item.kind === 'days' ? `${t('anniv.rule.days', { start: formattedYearMonthDay(startDate, i18n.language), n: item.n })}\n${t('anniv.detail.auto')}` : item.kind === 'years' ? `${t('anniv.rule.years', { md })}\n${t('anniv.detail.auto')}` : item.kind === 'birthday' ? t('anniv.rule.birthday', { md }) : item.kind === 'season' ? `${t('anniv.rule.fixed', { md })}\n${t('anniv.detail.auto.fixed')}` : t('anniv.rule.fixed', { md });
  const notification = notify === 'off' ? t('anniv.notify.off') : notifyDefault;
  const info: [string, string][] = [];
  if (!custom) info.push([t('anniv.detail.rule'), rule]);
  else { info.push([t('anniv.detail.repeat'), t(`anniv.repeat.${custom.repeat}`)]); if (custom.memo) info.push([t('anniv.detail.memo'), custom.memo]); }
  info.push([t('anniv.detail.notify'), notification]);
  const note = { fontSize: 13, lineHeight: 20, paddingHorizontal: 6 };
  return <Screen onBack={onBack} trailing={custom ? { label: t('common.edit'), onPress: onEdit, disabled: offline } : undefined} footer={custom ? <DeleteAction label={t('edit.delete')} disabled={offline} onPress={onDelete} /> : undefined}>
    {offline && <OfflineBand syncedAt={syncedAt} />}
    <View style={{ alignItems: 'center', gap: 6, marginTop: 4 }}><KindTile item={item} size={64} /><AppText variant="heading" align="center" style={{ fontSize: 26, lineHeight: 39 }}>{title}</AppText><AppText tone="text2" style={{ fontSize: 15, lineHeight: 23 }}>{date}</AppText><AppText tone="primary" variant="display" style={{ fontSize: 44, lineHeight: 51 }}>{relativeDate(item.date, today, t)}</AppText></View>
    <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>{info.map(([label, value], index) => <Fragment key={label}>{index > 0 && <View style={{ height: 1, marginLeft: 66, backgroundColor: color.divider }} />}<View style={{ gap: 2, paddingVertical: 12, paddingHorizontal: 16 }}><AppText tone="text2" style={emphasis(13)}>{label}</AppText><AppText>{value}</AppText></View></Fragment>)}</Card>
    {custom ? <><AppText tone="text2" style={note}>{t(custom.createdBy === userId ? 'anniv.detail.byMe' : 'anniv.detail.by', { name: partner, date: formattedMonthDay(todayIn(custom.updatedAt, timeZone), i18n.language) })}</AppText></> : <><AppText tone="text2" style={note}>{t(item.kind === 'birthday' ? 'anniv.detail.birthday.note' : 'anniv.detail.system.note')}</AppText>{item.kind === 'birthday' && item.who === 'me' && <Button variant="secondary" label={t('set.me.edit.title')} onPress={onMe} />}<Button variant="secondary" icon="bell" label={t('anniv.detail.openSettings')} onPress={onSettings} /></>}
  </Screen>;
}
