import { useCallback, useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Dialog, Screen, Toast } from '../../ui/components';
import { LoadingScreen } from '../../ui/CycleLoader';
import { CodeBoxes } from '../../ui/CodeBoxes';
import { Icon } from '../../ui/Icon';
import { Spot } from '../../ui/Spot';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';

const EXPIRING_MS = 30 * 60_000;
type Invitation = { code: string; expiresAt: string };
export const formatInviteCode = (code: string) => { const clean = code.replace(/[^0-9a-z]/gi, '').toUpperCase(); return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`; };
/** S04 invite. The raw code exists only in component state for display/share and is never logged. Sharing or copying the code moves on to the waiting state (S04-waiting). */
export function InviteScreen({ createInvitation, clock = Date.now, reducedMotion, memberCount = 1, onJoined, onLater, onBack, copyCode }: {
  createInvitation: () => Promise<Invitation>; clock?: () => number; reducedMotion?: boolean; memberCount?: number; onJoined?: () => void; onLater?: () => void; onBack?: () => void; copyCode?: (code: string) => Promise<boolean>;
}) {
  const color = useAppColor();
  const { t, i18n } = useTranslation();
  const { emphasis } = useType();
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [view, setView] = useState<'code' | 'waiting'>('code');
  const [now, setNow] = useState(clock());
  const [confirmReissue, setConfirmReissue] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const load = useCallback(async () => {
    setStatus('loading'); setNotice(null); setView('code');
    try { setInvite(await createInvitation()); setNow(clock()); setStatus('ready'); } catch { setStatus('error'); }
  }, [createInvitation, clock]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = setInterval(() => setNow(clock()), 30_000); return () => clearInterval(timer); }, [clock]);
  useEffect(() => { if (memberCount >= 2) onJoined?.(); }, [memberCount, onJoined]);
  const hideNotice = useCallback(() => setNotice(null), []);
  if (status === 'loading') return <LoadingScreen label={t('invite.generating')} />;
  if (status === 'error' || !invite) {
    return (
      <Screen onBack={onBack} footer={<>
        <Button label={t('common.retry')} onPress={() => void load()} />
        {onLater && <Button label={t('invite.later')} variant="ghost" onPress={onLater} />}
      </>}>
        <AppText variant="title" accessibilityRole="header">{t('invite.title')}</AppText>
        <Banner kind="danger" text={t('invite.err.title')} body={t('invite.err.body')} />
      </Screen>
    );
  }
  const code = formatInviteCode(invite.code);
  const left = Date.parse(invite.expiresAt) - now;
  const expired = left <= 0;
  const expiring = !expired && left <= EXPIRING_MS;
  const minutes = Math.max(0, Math.ceil(left / 60_000));
  const toast = notice ? <Toast text={notice} icon={notice === t('invite.copied') ? 'check' : 'info'} onHide={hideNotice} /> : null;
  async function share() {
    const result = await Share.share({ message: t('invite.shareMsg', { code, link: `https://aroom.jinjinstar.com/i/${code}` }) }).catch(() => null);
    if (result?.action === Share.sharedAction) { setNotice(null); setView('waiting'); } else setNotice(t('invite.shareCancelled'));
  }
  function copy() {
    if (!copyCode) return;
    void copyCode(code).then((copied) => { setNotice(t(copied ? 'invite.copied' : 'invite.err.title')); if (copied) setView('waiting'); }).catch(() => setNotice(t('invite.err.title')));
  }
  if (view === 'waiting' && !expired) {
    return (
      <Screen center footer={<>
        {toast}
        <Button label={t('invite.code.label')} variant="secondary" onPress={() => setView('code')} />
        {onLater && <Button label={t('common.next')} variant="ghost" onPress={onLater} />}
      </>}>
        <Spot kind="waiting" reducedMotion={reducedMotion} />
        <AppText variant="title" accessibilityRole="header" align="center">{t('invite.waiting.title')}</AppText>
        <AppText tone="text2" align="center">{t('invite.waiting.body')}</AppText>
      </Screen>
    );
  }
  const expiresAt = new Intl.DateTimeFormat(i18n.language, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(invite.expiresAt));
  return (
    <Screen onBack={onBack} footer={<>
      {toast}
      {expired ? <Button label={t('invite.reissue')} onPress={() => void load()} /> : <>
        <Button label={t('invite.share')} accessibilityLabel={t('a11y.share')} icon="share" onPress={() => void share()} />
        {copyCode && <Button label={t('invite.copy')} accessibilityLabel={t('a11y.copy')} icon="copy" variant="secondary" onPress={copy} />}
        <Button label={t('invite.reissue')} variant="ghost" onPress={() => setConfirmReissue(true)} />
      </>}
    </>}>
      <AppText variant="title" accessibilityRole="header">{t('invite.title')}</AppText>
      <AppText tone="text2">{t('invite.body')}</AppText>
      {expired ? <Banner kind="warn" text={t('invite.expired.title')} body={t('invite.expired.body')} /> : (
        <Card style={{ alignItems: 'stretch', gap: tokens.spacing[3], paddingVertical: tokens.spacing[5] }}>
          <AppText style={[emphasis(14), { color: color.text2, textAlign: 'center' }]}>{t('invite.code.label')}</AppText>
          <CodeBoxes code={code} label={t('a11y.code', { code: code.split('').join(' ') })} />
          <View style={{ flexDirection: 'row', gap: tokens.spacing[1], alignItems: 'flex-start' }}>
            <Icon name="clock" size={20} color={expiring ? color.warn : color.text2} />
            <View style={{ flex: 1 }}>
              <AppText style={[emphasis(14), { color: expiring ? color.warn : color.text2 }]}>{expiring ? t('invite.expiring', { m: minutes }) : t('invite.expires', { h: Math.floor(minutes / 60), m: minutes % 60 })}</AppText>
              <AppText variant="bodySm" tone="text2">{t('invite.expiresAt', { date: expiresAt })}</AppText>
            </View>
          </View>
        </Card>
      )}
      <Dialog visible={confirmReissue} title={t('invite.reissue.title')} body={t('invite.reissue.body')} onClose={() => setConfirmReissue(false)}>
        <Button label={t('common.confirm')} onPress={() => { setConfirmReissue(false); void load(); }} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirmReissue(false)} />
      </Dialog>
    </Screen>
  );
}
