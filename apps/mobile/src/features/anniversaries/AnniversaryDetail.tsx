import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Screen } from '../../ui/components';
import type { Occurrence } from '../../lib/anniversaries';
import type { CustomAnniversary } from '../../lib/client';
import { KindTile } from './KindTile';
import { formattedDate, formattedMonthDay, occurrenceTitle, relativeDate } from './format';
export function AnniversaryDetail({ item, custom, today, startDate, partner, userId, notify, notifyDefault, offline, onBack, onEdit, onDelete, onSettings, onMe }: { item: Occurrence; custom?: CustomAnniversary; today: string; startDate: string; partner: string; userId: string; notify: 'default' | 'off'; notifyDefault: string; offline: boolean; onBack: () => void; onEdit: () => void; onDelete: () => void; onSettings: () => void; onMe: () => void }) {
  const { t, i18n } = useTranslation();
  const title = occurrenceTitle(item, partner, t), date = formattedDate(item.date, i18n.language, true);
  const md = formattedMonthDay(item.date, i18n.language);
  const rule = item.kind === 'days' ? `${t('anniv.rule.days', { start: formattedDate(startDate, i18n.language, true), n: item.n })}\n${t('anniv.detail.auto')}` : item.kind === 'years' ? `${t('anniv.rule.years', { md })}\n${t('anniv.detail.auto')}` : item.kind === 'birthday' ? t('anniv.rule.birthday', { md }) : t('anniv.rule.fixed', { md });
  const notification = notify === 'off' ? t('anniv.notify.off') : notifyDefault;
  const info = (label: string, value: string) => <View style={{ gap: 2, paddingVertical: 8 }}><AppText tone="text2" style={{ fontWeight: '700', fontSize: 13 }}>{label}</AppText><AppText>{value}</AppText></View>;
  return <Screen onBack={onBack} footer={custom ? <Button variant="ghost" label={t('edit.delete')} disabled={offline} onPress={onDelete} /> : undefined}>
    <View style={{ alignItems: 'center', gap: 6 }}><KindTile item={item} large /><AppText variant="heading">{title}</AppText><AppText tone="text2">{date}</AppText><AppText tone="primary" variant="display">{relativeDate(item.date, today, t)}</AppText></View>
    <Card>{info(t('anniv.detail.when'), date)}{custom ? <>{info(t('anniv.detail.repeat'), t(`anniv.repeat.${custom.repeat}`))}{custom.memo ? info(t('anniv.detail.memo'), custom.memo) : null}</> : info(t('anniv.detail.rule'), rule)}{info(t('anniv.detail.notify'), notification)}</Card>
    {custom ? <><AppText tone="text2" variant="bodySm">{t(custom.createdBy === userId ? 'anniv.detail.byMe' : 'anniv.detail.by', { name: partner, date: formattedMonthDay(custom.updatedAt.slice(0, 10), i18n.language) })}</AppText><Button variant="secondary" label={t('common.edit')} disabled={offline} onPress={onEdit} /></> : <><AppText tone="text2" variant="bodySm">{t(item.kind === 'birthday' ? 'anniv.detail.birthday.note' : 'anniv.detail.system.note')}</AppText>{item.kind === 'birthday' && item.who === 'me' && <Button variant="secondary" label={t('set.me.edit.title')} onPress={onMe} />}<Button variant="secondary" label={t('anniv.detail.openSettings')} onPress={onSettings} /></>}
  </Screen>;
}
