import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Dialog } from '../../ui/components';
import { tokens } from '../../theme/tokens';
const color = tokens.color.app.light.normal;
const sections = [['consent.sent.label', 'consent.sent.body'], ['consent.purpose.label', 'consent.purpose.body'], ['consent.processor.label', 'consent.processor.body'], ['consent.keep.label', 'consent.keep.body'], ['consent.couple.label', 'consent.couple.body']] as const;
type ConsentState = 'not_given' | 'granted' | 'revoked';
/** Overseas AI processing consent, recorded per member. The provider retention line stays a legal placeholder until gate G1. */
export function ConsentScreen({ myState, consentedAt, hasUnappliedPreview = false, setConsent, onDone }: { myState: ConsentState; consentedAt?: string; hasUnappliedPreview?: boolean; setConsent: (state: 'granted' | 'revoked') => Promise<unknown>; onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState(myState);
  const [since, setSince] = useState(consentedAt ?? null);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  async function change(next: 'granted' | 'revoked') {
    setFailed(false); setConfirming(false);
    try {
      await setConsent(next);
      setState(next);
      if (next === 'granted') setSince(new Date().toISOString());
      if (next === 'granted') onDone();
      else setNotice(['consent.withdraw.done', ...(hasUnappliedPreview ? ['preview.cancel.toast'] : [])]);
    } catch { setFailed(true); }
  }
  return (
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('consent.title')}</Text>
      <Text style={{ color: color.text2 }}>{t('consent.lead')}</Text>
      {sections.map(([label, body]) => <View key={label} style={{ gap: 4 }}><Text style={{ color: color.text }}>{t(label)}</Text><Text style={{ color: color.text2 }}>{t(body)}</Text></View>)}
      <Text style={{ color: color.text2 }}>{t('consent.provider.keep')}</Text>
      <Text testID="consent-status" style={{ color: color.text }}>{state === 'granted' ? t('consent.status.on', { date: since ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(since)) : '' }) : t('consent.status.off')}</Text>
      {failed && <Banner kind="danger" text={t('sys.server.title')} />}
      {notice?.map((key) => <Banner key={key} kind="info" text={t(key)} />)}
      {state === 'granted' ? <Button label={t('consent.withdraw')} variant="dangerOutline" onPress={() => setConfirming(true)} /> : <>
        <Button label={t('consent.agree')} onPress={() => void change('granted')} />
        <Button label={t('consent.later')} variant="ghost" onPress={onDone} />
        <Text style={{ color: color.text2 }}>{t('consent.later.note')}</Text>
      </>}
      <Dialog visible={confirming} title={t('consent.withdraw.title')} onClose={() => setConfirming(false)}>
        <Text style={{ color: color.text2 }}>{t('consent.withdraw.body')}</Text>
        <Button label={t('consent.withdraw')} variant="danger" onPress={() => void change('revoked')} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirming(false)} />
      </Dialog>
    </ScrollView>
  );
}
