import { useAppColor } from '../../theme/useAppColor';
import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { tokens } from '../../theme/tokens';
import type { AuthPort } from './authPort';

const RESEND_SECONDS = 60;
type Problem = null | 'wrong' | 'expired' | 'error' | { rateLimitedMinutes: number };
export function EmailCodeScreen({ auth, email, onDone }: { auth: AuthPort; email: string; onDone: () => void }) {
  const color = useAppColor();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<Problem>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  async function confirm() {
    setBusy(true);
    const result = await auth.verifyCode(email, code).catch(() => 'error' as const);
    setBusy(false);
    if (result === 'ok') { setProblem(null); onDone(); } else setProblem(result);
  }
  async function resend() {
    setProblem(null); setCode(''); setWait(RESEND_SECONDS);
    const result = await auth.sendCode(email).catch(() => 'error' as const);
    if (result !== 'ok') setProblem(result);
  }
  const message = problem === null ? null : typeof problem === 'object' ? t('login.code.rate', { m: problem.rateLimitedMinutes }) : t(problem === 'error' ? 'login.error.body' : `login.code.${problem}`);
  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: tokens.spacing[5], gap: tokens.spacing[2] }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('login.code.title')}</Text>
      <Text style={{ color: color.text2 }}>{t('login.code.body', { email })}</Text>
      <TextField label={t('login.code.label')} value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} />
      {message && <Banner kind={problem === 'wrong' ? 'warn' : 'danger'} text={message} />}
      {busy ? <CycleLoader label={t('login.processing')} /> : <Button label={t('login.code.confirm')} disabled={code.length !== 6 || typeof problem === 'object' && problem !== null} onPress={() => void confirm()} />}
      {wait > 0 ? <Text style={{ color: color.text2 }}>{t('login.code.resendIn', { s: wait })}</Text> : <Button label={t('login.code.resend')} variant="ghost" onPress={() => void resend()} />}
    </ScrollView>
  );
}
