import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button, TextField } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { ApiError, errorBodyKey, errorKey } from '../../lib/errors';
import { formatAnniversary } from '../../lib/dday';
import { parseInvite } from '../../lib/inviteLink';
import { tokens } from '../../theme/tokens';
const color = tokens.color.app.light.normal;
const JOIN_ERRORS = ['INVITE_EXPIRED', 'INVITE_USED', 'INVITE_INVALID', 'SPACE_FULL', 'ALREADY_IN_SPACE'];
export function maskInviteInput(value: string): string {
  const clean = value.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}
type Problem = { code: string } | { rateMinutes: number } | 'network';
type Step = 'enter' | 'checking' | { found: { anniversaryDate: string } } | 'accepting' | { joined: string };
/** S05 join. The data model has no partner names, so the confirm step shows only the shared date. */
export function JoinScreen({ previewInvitation, acceptInvitation, onJoined, onOpenSpace, readClipboard, initialCode, alreadyInSpace }: {
  previewInvitation: (code: string) => Promise<{ anniversaryDate: string }>; acceptInvitation: (code: string) => Promise<{ spaceId: string }>;
  onJoined: (spaceId: string) => void; onOpenSpace: () => void; readClipboard?: () => Promise<string>; initialCode?: string | null; alreadyInSpace?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState(initialCode ? maskInviteInput(initialCode) : '');
  const [step, setStep] = useState<Step>('enter');
  const [problem, setProblem] = useState<Problem | null>(alreadyInSpace ? { code: 'ALREADY_IN_SPACE' } : null);
  const autoChecked = useRef(false);
  useEffect(() => {
    if (!initialCode || alreadyInSpace || autoChecked.current) return;
    autoChecked.current = true;
    setStep('checking');
    void previewInvitation(initialCode).then((found) => setStep({ found })).catch(fail);
  }, [initialCode, alreadyInSpace, previewInvitation]);
  const code = value.replace('-', '');
  function fail(error: unknown) {
    if (error instanceof ApiError && error.code === 'RATE_LIMITED') setProblem({ rateMinutes: Math.ceil(Number(error.details.retryAfterSeconds ?? 600) / 60) });
    else if (error instanceof ApiError && JOIN_ERRORS.includes(error.code)) setProblem({ code: error.code });
    else setProblem('network');
    setStep('enter');
  }
  async function check() {
    setProblem(null); setStep('checking');
    try { setStep({ found: await previewInvitation(code) }); } catch (error) { fail(error); }
  }
  async function accept() {
    setStep('accepting');
    try { setStep({ joined: (await acceptInvitation(code)).spaceId }); } catch (error) { fail(error); }
  }
  if (typeof step === 'object' && 'joined' in step) {
    return <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('join.ok.title')}</Text>
      <Button label={t('join.ok.next')} onPress={() => onJoined(step.joined)} />
    </View>;
  }
  if (typeof step === 'object') {
    return <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('join.found.heading')}</Text>
      <Text style={{ color: color.text2 }}>{t('join.found.body', { date: formatAnniversary(step.found.anniversaryDate, i18n.language) })}</Text>
      <Button label={t('join.accept')} onPress={() => void accept()} />
      <Button label={t('join.decline')} variant="ghost" onPress={() => setStep('enter')} />
    </View>;
  }
  const busy = step === 'checking' || step === 'accepting';
  const body = problem && typeof problem === 'object' && 'code' in problem ? errorBodyKey(problem.code) : null;
  return (
    <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('join.title')}</Text>
      <Text style={{ color: color.text2 }}>{t('join.body')}</Text>
      <TextField label={t('join.title')} value={value} onChangeText={(next) => setValue(maskInviteInput(next))} autoCapitalize="characters" autoCorrect={false} maxLength={9} style={{ fontSize: 24, letterSpacing: 4 }} />
      {readClipboard && <Button label={t('join.paste')} variant="ghost" onPress={() => void readClipboard().then((text) => setValue(maskInviteInput(parseInvite(text) ?? '')))} />}
      {problem === 'network' && <Banner kind="danger" text={t('join.err')} />}
      {problem && typeof problem === 'object' && 'rateMinutes' in problem && <Banner kind="danger" text={t('login.code.rate', { m: problem.rateMinutes })} />}
      {problem && typeof problem === 'object' && 'code' in problem && <View style={{ gap: 4 }}>
        <Banner kind="warn" text={t(errorKey(problem.code))} />
        {body && <Text style={{ color: color.text2 }}>{t(body)}</Text>}
        {problem.code === 'ALREADY_IN_SPACE' && <Button label={t('join.hasSpace.action')} variant="secondary" onPress={onOpenSpace} />}
      </View>}
      {busy ? <CycleLoader label={t('join.checking')} /> : <Button label={t('join.check')} disabled={code.length !== 8} onPress={() => void check()} />}
    </View>
  );
}
