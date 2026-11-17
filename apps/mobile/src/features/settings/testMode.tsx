import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../lib/AppContext';
import { AppText, Card, ListRow, SectionLabel, SwitchRow } from '../../ui/components';

export const testTools = ['premium', 'sentry'] as const;
export const showTestMode = (verified: boolean | null, offline: boolean) => verified === true && !offline;
const masterKey = 'testModeEnabled';
const premiumKey = 'testModePremium';
/** Local override only; premium entitlement is not implemented yet. */
export async function getTestPremiumOverride(): Promise<boolean> {
  try { return await SecureStore.getItemAsync(masterKey) === 'true' && await SecureStore.getItemAsync(premiumKey) === 'true'; }
  catch { return false; }
}
export function TestModeSection({ userId, offline }: { userId: string; offline: boolean }) {
  const { supabase, userId: sessionUserId } = useApp();
  const { t } = useTranslation();
  const [verification, setVerification] = useState<{userId:string; allowed:boolean} | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [premium, setPremium] = useState(false);
  useEffect(() => {
    let active = true;
    setVerification(null);
    if (!offline && userId === sessionUserId) {
      void supabase.rpc('is_tester').then(({data, error}) => { if (active) setVerification({userId, allowed: !error && data === true}); }, () => {});
    }
    return () => { active = false; };
  }, [supabase, userId, sessionUserId, offline]);
  useEffect(() => {
    let active = true;
    void Promise.all([SecureStore.getItemAsync(masterKey), SecureStore.getItemAsync(premiumKey)]).then(([m,p]) => { if (active) { setEnabled(m === 'true'); setPremium(p === 'true'); } }).catch(() => {});
    return () => { active = false; };
  }, []);
  const save = (key: string, value: boolean, setter: (v:boolean) => void) => { void SecureStore.setItemAsync(key, String(value)).then(() => setter(value)).catch(() => {}); };
  if (!showTestMode(verification?.userId === userId && userId === sessionUserId ? verification.allowed : null, offline)) return null;
  return <><SectionLabel text={t('set.test.title')} /><Card>
    <SwitchRow label={t('set.test.enabled')} value={enabled} last={!enabled} onValueChange={value => save(masterKey, value, setEnabled)} />
    {enabled && testTools.map((tool, index) => tool === 'premium'
      ? <SwitchRow key={tool} label={t('set.test.premium')} value={premium} last={index === testTools.length - 1} onValueChange={value => save(premiumKey, value, setPremium)} />
      : <ListRow key={tool} label={t('set.test.sentry')} value={t('set.test.sentry.note')} disabled trailing="none" onPress={() => {}} />)}
  </Card>{enabled && <AppText variant="bodySm" tone="text2">{t('set.test.premium.note')}</AppText>}</>;
}
