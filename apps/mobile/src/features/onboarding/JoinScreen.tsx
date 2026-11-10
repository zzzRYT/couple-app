import { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import { CodeInput } from '../../ui/CodeBoxes';
import { ApiError, errorBodyKey, errorKey } from '../../lib/errors';
import { dayCount, formatAnniversary } from '../../lib/dday';
import { parseInvite } from '../../lib/inviteLink';
import { mascotPoses } from '../../scene/catalog';

const JOIN_ERRORS = ['INVITE_EXPIRED', 'INVITE_USED', 'INVITE_INVALID', 'SPACE_FULL', 'ALREADY_IN_SPACE'];
export function maskInviteInput(value: string): string {
  const clean = value.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}
type Problem = { code: string } | { rateMinutes: number } | 'network';
type Step = 'enter' | 'checking' | { found: { anniversaryDate: string; displayName?: string | null; timeZone?: string } } | 'accepting' | 'move' | 'moving';
const OWN_CODE = 'OWN_CODE';
/**
 * S05 join with the valid invitation's limited preview. With `moveFromSpace` (V0-10, a person holding a space alone), a valid
 * code answers ALREADY_IN_SPACE, so the screen asks to move into the partner's space instead of showing that error.
 * `myName` is the joiner's stored name (e.g. starting again after a space ended); only then the card draws the names row (ND02).
 */
export function JoinScreen({ previewInvitation, acceptInvitation, onJoined, onOpenSpace, readClipboard, onBack, initialCode, alreadyInSpace, moveFromSpace, ownCode, myName }: {
  previewInvitation: (code: string) => Promise<{ anniversaryDate: string; displayName?: string | null; timeZone?: string }>; acceptInvitation: (code: string) => Promise<{ spaceId: string }>;
  onJoined: (spaceId: string) => void; onOpenSpace: () => void; readClipboard?: () => Promise<string>; onBack?: () => void; initialCode?: string | null; alreadyInSpace?: boolean;
  moveFromSpace?: (code: string) => Promise<void>; ownCode?: string | null; myName?: string | null;
}) {
  const { t, i18n } = useTranslation();
  const color = useAppColor();
  const { emphasis } = useType();
  const [value, setValue] = useState(initialCode ? maskInviteInput(initialCode) : '');
  const [step, setStep] = useState<Step>('enter');
  const [problem, setProblem] = useState<Problem | null>(alreadyInSpace ? { code: 'ALREADY_IN_SPACE' } : null);
  const autoChecked = useRef(false);
  const own = parseInvite(ownCode ?? '');
  useEffect(() => {
    if (!initialCode || alreadyInSpace || autoChecked.current) return;
    autoChecked.current = true;
    if (own && parseInvite(initialCode) === own) { setProblem({ code: OWN_CODE }); return; }
    setStep('checking');
    void previewInvitation(initialCode).then((found) => setStep({ found })).catch(fail);
  }, [initialCode, alreadyInSpace, previewInvitation, own]);
  const code = value.replace('-', '');
  function fail(error: unknown) {
    if (moveFromSpace && error instanceof ApiError && error.code === 'ALREADY_IN_SPACE') { setStep('move'); return; }
    if (error instanceof ApiError && error.code === 'RATE_LIMITED') setProblem({ rateMinutes: Math.ceil(Number(error.details.retryAfterSeconds ?? 600) / 60) });
    else if (error instanceof ApiError && JOIN_ERRORS.includes(error.code)) setProblem({ code: error.code });
    else setProblem('network');
    setStep('enter');
  }
  async function check() {
    setProblem(null);
    if (own && code === own) { setProblem({ code: OWN_CODE }); return; }
    setStep('checking');
    try { setStep({ found: await previewInvitation(code) }); } catch (error) { fail(error); }
  }
  async function accept() {
    setStep('accepting');
    try { onJoined((await acceptInvitation(code)).spaceId); } catch (error) { fail(error); }
  }
  async function move() {
    if (!moveFromSpace) return;
    setStep('moving');
    // On success the gate swaps this screen for the new space, so only a failure comes back here.
    try { await moveFromSpace(code); } catch (error) { fail(error); }
  }
  if (step === 'move' || step === 'moving') {
    return (
      <Screen onBack={step === 'moving' ? undefined : () => setStep('enter')} footer={<>
        <Button label={t('connect.move.submit')} loading={step === 'moving'} onPress={() => void move()} />
        <Button label={t('common.cancel')} variant="ghost" disabled={step === 'moving'} onPress={() => setStep('enter')} />
      </>}>
        <AppText variant="title" accessibilityRole="header">{t('connect.move.title')}</AppText>
        <Card>{(['connect.move.i1', 'connect.move.i2', 'connect.move.i3'] as const).map((key) => <AppText key={key}>• {t(key)}</AppText>)}</Card>
      </Screen>
    );
  }
  if (step === 'accepting' || (typeof step === 'object' && 'found' in step)) {
    const found = typeof step === 'object' ? step.found : null;
    return (
      <Screen onBack={step === 'accepting' ? undefined : () => setStep('enter')} footer={<>
        <Button label={t('join.accept')} loading={step === 'accepting'} onPress={() => void accept()} />
        <Button label={t('join.decline')} variant="ghost" disabled={step === 'accepting'} onPress={() => setStep('enter')} />
      </>}>
        <AppText variant="title" accessibilityRole="header">{t('join.found.title')}</AppText>
        {found && <>
          <Card tone="line" style={{ alignItems: 'center', paddingVertical: 22 }}>
            {myName && found.displayName && <View accessible accessibilityRole="text" accessibilityLabel={t('home.names.a11y', { me: myName, partner: found.displayName })} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
              <AppText style={emphasis(16)}>{myName}</AppText><Icon name="heart" size={16} color={color.primary} fill={color.primary} /><AppText style={emphasis(16)}>{found.displayName}</AppText>
            </View>}
            <AppText variant="heading" align="center">{t('join.found.who', { name: found.displayName ?? t('home.pending.partner') })}</AppText>
            <AppText tone="text2" align="center">{t('start.join.found.body', { date: formatAnniversary(found.anniversaryDate, i18n.language), n: (() => { const result = dayCount(found.anniversaryDate, new Date().toISOString(), found.timeZone ?? 'UTC'); return result.ok ? result.dayCount : 0; })() })}</AppText>
          </Card>
          <Image accessibilityLabel={t('mascot.alt.wave')} source={mascotPoses.wave_main} resizeMode="contain" style={{ width: 130, height: 130, alignSelf: 'center' }} />
        </>}
      </Screen>
    );
  }
  const codeProblem = problem && typeof problem === 'object' && 'code' in problem ? problem.code : null;
  const hasSpace = codeProblem === 'ALREADY_IN_SPACE';
  const body = hasSpace ? 'join.hasSpace.body.v0' : codeProblem && codeProblem !== OWN_CODE ? errorBodyKey(codeProblem) : null;
  const title = moveFromSpace ? t('connect.code.title') : t('join.title');
  return (
    <Screen onBack={onBack} footer={hasSpace ? <>
      <Button label={t('join.hasSpace.action')} onPress={onOpenSpace} />
      {onBack && <Button label={t('common.close')} variant="ghost" onPress={onBack} />}
    </> : <Button label={step === 'checking' ? t('join.checking') : t('join.check')} loading={step === 'checking'} disabled={code.length !== 8} onPress={() => void check()} />}>
      <AppText variant="title" accessibilityRole="header">{title}</AppText>
      <AppText tone="text2">{moveFromSpace ? t('connect.code.body') : t('join.body')}</AppText>
      <CodeInput label={title} value={value} error={!!codeProblem} onChangeText={(next) => { setValue(maskInviteInput(next)); if (problem && !hasSpace) setProblem(null); }} />
      {problem === 'network' && <Banner kind="danger" text={t('join.err')} />}
      {problem && typeof problem === 'object' && 'rateMinutes' in problem && <Banner kind="danger" text={t('login.code.rate', { m: problem.rateMinutes })} />}
      {codeProblem && <Banner kind="warn" text={codeProblem === OWN_CODE ? t('connect.err.own') : t(errorKey(codeProblem))} body={body ? t(body) : null} />}
      {readClipboard && <View style={{ alignItems: 'center' }}>
        <Button label={t('join.paste')} variant="secondary" compact icon="copy" onPress={() => void readClipboard().then((text) => setValue(maskInviteInput(parseInvite(text) ?? parseInvite(text.replace(/\s/g, '')) ?? ''))).catch(() => setProblem('network'))} />
      </View>}
    </Screen>
  );
}
