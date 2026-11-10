import { useCallback, useEffect, useRef, useState } from 'react';
import { Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, Dialog, Screen, Toast } from '../../ui/components';
import { LoadingScreen } from '../../ui/CycleLoader';
import { CodeBoxes } from '../../ui/CodeBoxes';
import { Icon } from '../../ui/Icon';
import { InlineHint } from '../../ui/InlineNote';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';

const EXPIRING_MS = 30 * 60_000;
type Invitation = { code: string; expiresAt: string };
export const formatInviteCode = (code: string) => { const clean = code.replace(/[^0-9a-z]/gi, '').toUpperCase(); return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`; };
/**
 * S04 invite. The raw code exists only in component state for display/share and is never logged. V0 waits on home with the code visible, so the code stays on screen after sharing or copying.
 * `existingInvitation` is the live code this device made, shown again as is; without it a live invitation shows the pending note. `reissue` makes a new code right away.
 */
export function InviteScreen({ createInvitation, clock = Date.now, memberCount = 1, onJoined, onLater, onBack, copyCode, existingInvitation, existingInvitationExpiresAt, reissue = false, onInvitationCreated }: {
  createInvitation: () => Promise<Invitation>; clock?: () => number; memberCount?: number; onJoined?: () => void; onLater?: () => void; onBack?: () => void; copyCode?: (code: string) => Promise<boolean>;
  existingInvitation?: Invitation | null; existingInvitationExpiresAt?: string | null; reissue?: boolean; onInvitationCreated?: () => Promise<unknown> | void;
}) {
  const color = useAppColor();
  const { t, i18n } = useTranslation();
  const { emphasis } = useType();
  const reopened = reissue ? null : existingInvitation ?? null;
  const [invite, setInvite] = useState<Invitation | null>(reopened);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'pending'>(reopened ? 'ready' : existingInvitationExpiresAt && !reissue ? 'pending' : 'loading');
  const [now, setNow] = useState(clock());
  const [confirmReissue, setConfirmReissue] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const initialized = useRef(false);
  const load = useCallback(async () => {
    setStatus('loading'); setNotice(null);
    try { setInvite(await createInvitation()); setNow(clock()); setStatus('ready'); void Promise.resolve(onInvitationCreated?.()).catch(() => undefined); } catch { setStatus('error'); }
  }, [createInvitation, clock, onInvitationCreated]);
  useEffect(() => {
    if (memberCount >= 2 || initialized.current) return;
    initialized.current = true;
    if (status === 'loading') void load();
  }, [load, status, memberCount]);
  useEffect(() => { const timer = setInterval(() => setNow(clock()), 30_000); return () => clearInterval(timer); }, [clock]);
  useEffect(() => { if (memberCount >= 2) onJoined?.(); }, [memberCount, onJoined]);
  const hideNotice = useCallback(() => setNotice(null), []);
  if (status === 'loading') return <LoadingScreen label={t('invite.generating')} />;
  if (status === 'pending' && existingInvitationExpiresAt) {
    const expiresAt = new Intl.DateTimeFormat(i18n.language, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(existingInvitationExpiresAt));
    const expired = Date.parse(existingInvitationExpiresAt) <= now;
    return <Screen onBack={onBack} footer={<>
      {onLater && <Button label={t('common.next')} variant="ghost" onPress={onLater} />}
      <Button label={t('invite.reissue')} variant="secondary" onPress={() => setConfirmReissue(true)} />
      <Dialog visible={confirmReissue} title={t('invite.reissue.title')} body={t('invite.reissue.body')} onClose={() => setConfirmReissue(false)}>
        <Button label={t('common.confirm')} onPress={() => { setConfirmReissue(false); void load(); }} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirmReissue(false)} />
      </Dialog>
    </>}>
      <AppText variant="title" accessibilityRole="header">{t('invite.waiting.title')}</AppText>
      <Banner kind={expired ? 'warn' : 'info'} icon="people" text={t('invite.waiting.body')} body={t('invite.expiresAt', { date: expiresAt })} />
    </Screen>;
  }
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
    setNotice(result?.action === Share.sharedAction ? null : t('invite.shareCancelled'));
  }
  function copy() {
    if (!copyCode) return;
    void copyCode(code).then((copied) => setNotice(t(copied ? 'invite.copied' : 'invite.err.title'))).catch(() => setNotice(t('invite.err.title')));
  }
  const expiresAt = new Intl.DateTimeFormat(i18n.language, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(invite.expiresAt));
  return (
    <Screen onBack={onBack} footer={<>
      {toast}
        {expired ? <Button label={t('invite.reissue')} onPress={() => setConfirmReissue(true)} /> : <>
        <Button label={t('invite.share')} accessibilityLabel={t('a11y.share')} icon="share" onPress={() => void share()} />
        {copyCode && <Button label={t('invite.copy')} accessibilityLabel={t('a11y.copy')} icon="copy" variant="secondary" onPress={copy} />}
        <Button label={t('invite.reissue')} variant="ghost" onPress={() => setConfirmReissue(true)} />
      </>}
      {onLater && <Button label={t('start.invite.home')} variant="ghost" onPress={onLater} />}
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
      {!expired && <InlineHint text={t('start.invite.hint')} />}
      <Dialog visible={confirmReissue} title={t('invite.reissue.title')} body={t('invite.reissue.body')} onClose={() => setConfirmReissue(false)}>
        <Button label={t('common.confirm')} onPress={() => { setConfirmReissue(false); void load(); }} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirmReissue(false)} />
      </Dialog>
    </Screen>
  );
}
