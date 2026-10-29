import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Screen, TextField } from '../../ui/components';
import type { AuthPort } from './authPort';

const RESEND_SECONDS = 60;
type Problem = null | 'wrong' | 'expired' | 'error' | { rateLimitedMinutes: number };
export function EmailCodeScreen({ auth, email, onDone, onBack }: { auth: AuthPort; email: string; onDone: () => void; onBack?: () => void }) {
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
    <Screen onBack={onBack} footer={<>
      <Button label={t('login.code.confirm')} loading={busy} disabled={code.length !== 6 || typeof problem === 'object' && problem !== null} onPress={() => void confirm()} />
      {wait > 0 ? <AppText variant="bodySm" tone="text2" align="center" style={{ paddingVertical: 14 }}>{t('login.code.resendIn', { s: wait })}</AppText> : <Button label={t('login.code.resend')} variant="ghost" onPress={() => void resend()} />}
    </>}>
      <AppText variant="title" accessibilityRole="header">{t('login.code.title')}</AppText>
      <AppText tone="text2">{t('login.code.body', { email })}</AppText>
      <TextField label={t('login.code.label')} value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} autoFocus
        error={message} style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }} />
    </Screen>
  );
}
