import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Dialog, Screen } from '../../ui/components';
import { Icon, type IconName } from '../../ui/Icon';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';

const sections: [string, string, IconName][] = [['consent.sent.label', 'consent.sent.body', 'send'], ['consent.purpose.label', 'consent.purpose.body', 'sparkle'], ['consent.processor.label', 'consent.processor.body', 'globe'], ['consent.keep.label', 'consent.keep.body', 'clock'], ['consent.couple.label', 'consent.couple.body', 'people']];
type ConsentState = 'not_given' | 'granted' | 'revoked';
/** S12 overseas AI processing consent, recorded per member. The body scrolls and the agree button stays pinned. The provider retention line stays a legal placeholder until gate G1. */
export function ConsentScreen({ myState, consentedAt, hasUnappliedPreview = false, setConsent, onDone }: { myState: ConsentState; consentedAt?: string; hasUnappliedPreview?: boolean; setConsent: (state: 'granted' | 'revoked') => Promise<unknown>; onDone: () => void }) {
  const color = useAppColor();
  const { t, i18n } = useTranslation();
  const [state, setState] = useState(myState);
  const [since, setSince] = useState(consentedAt ?? null);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  async function change(next: 'granted' | 'revoked') {
    setFailed(false); setConfirming(false); setBusy(true);
    try {
      await setConsent(next);
      setState(next);
      if (next === 'granted') setSince(new Date().toISOString());
      if (next === 'granted') onDone();
      else setNotice(['consent.withdraw.done', ...(hasUnappliedPreview ? ['preview.cancel.toast'] : [])]);
    } catch { setFailed(true); } finally { setBusy(false); }
  }
  const granted = state === 'granted';
  return (
    <>
    <Screen onClose={onDone} footer={granted
      ? <Button label={t('consent.withdraw')} variant="dangerOutline" onPress={() => setConfirming(true)} />
      : <>
        <Button label={t('consent.agree')} loading={busy} onPress={() => void change('granted')} />
        <Button label={t('consent.later')} variant="ghost" disabled={busy} onPress={onDone} />
      </>}>
      <AppText variant="title" accessibilityRole="header">{t('consent.title')}</AppText>
      <AppText tone="text2">{t('consent.lead')}</AppText>
      <View>
        {sections.map(([label, body, icon], index) => (
          <View key={label} style={{ flexDirection: 'row', gap: tokens.spacing[2], paddingVertical: tokens.spacing[3], borderTopWidth: index === 0 ? 0 : 1, borderColor: color.divider }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: color.infoBg }}><Icon name={icon} size={20} color={color.info} /></View>
            <View style={{ flex: 1, gap: 2 }}><AppText variant="label">{t(label)}</AppText><AppText variant="bodySm" tone="text2">{t(body)}</AppText></View>
          </View>
        ))}
      </View>
      <AppText variant="bodySm" tone="text2">{t('consent.provider.keep')}</AppText>
      <View style={{ flexDirection: 'row', gap: tokens.spacing[1], alignItems: 'center' }}>
        <Icon name={granted ? 'check' : 'info'} size={18} color={granted ? color.success : color.text2} />
        <AppText testID="consent-status" variant="label" style={{ color: granted ? color.success : color.text }}>{granted ? t('consent.status.on', { date: since ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(since)) : '' }) : t('consent.status.off')}</AppText>
      </View>
      {!granted && <AppText variant="caption" tone="text2">{t('consent.later.note')}</AppText>}
      {failed && <Banner kind="danger" text={t('sys.server.title')} body={t('sys.server.body')} />}
      {notice?.map((key) => <Banner key={key} kind="info" text={t(key)} />)}
    </Screen>
    <Dialog visible={confirming} icon="warn" title={t('consent.withdraw.title')} body={t('consent.withdraw.body')} onClose={() => setConfirming(false)}>
        <Button label={t('consent.withdraw')} variant="danger" onPress={() => void change('revoked')} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirming(false)} />
      </Dialog>
    </>
  );
}
