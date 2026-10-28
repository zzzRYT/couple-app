import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Dialog } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import { useReducedMotion } from '../../ui/motion';
import { catalogImages } from '../../scene/catalogImages';
import { tokens } from '../../theme/tokens';
const color = tokens.color.app.light.normal;
const EXPIRING_MS = 30 * 60_000;
type Invitation = { code: string; expiresAt: string };
export const formatInviteCode = (code: string) => { const clean = code.replace(/[^0-9a-z]/gi, '').toUpperCase(); return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`; };
function FloatingLetter({ reduced }: { reduced: boolean }) {
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(lift, { toValue: -8, duration: 1600, useNativeDriver: true }), Animated.timing(lift, { toValue: 0, duration: 1600, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [lift, reduced]);
  return <Animated.Image source={catalogImages.obj_keep_letter} style={{ width: 56, height: 56, transform: [{ translateY: lift }] }} />;
}
/** S04 invite. The raw code exists only in component state for display/share and is never logged. */
export function InviteScreen({ createInvitation, clock = Date.now, reducedMotion, memberCount = 1, onJoined, onLater }: {
  createInvitation: () => Promise<Invitation>; clock?: () => number; reducedMotion?: boolean; memberCount?: number; onJoined?: () => void; onLater?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const systemReduced = useReducedMotion();
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [now, setNow] = useState(clock());
  const [confirmReissue, setConfirmReissue] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const load = useCallback(async () => {
    setStatus('loading'); setNotice(null);
    try { setInvite(await createInvitation()); setNow(clock()); setStatus('ready'); } catch { setStatus('error'); }
  }, [createInvitation, clock]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = setInterval(() => setNow(clock()), 30_000); return () => clearInterval(timer); }, [clock]);
  useEffect(() => { if (memberCount >= 2) onJoined?.(); }, [memberCount, onJoined]);
  if (status === 'loading') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: color.bg }}><CycleLoader label={t('invite.generating')} /><Text style={{ color: color.text }}>{t('invite.generating')}</Text></View>;
  if (status === 'error' || !invite) {
    return <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      <Banner kind="danger" text={t('invite.err.title')} /><Text style={{ color: color.text2 }}>{t('invite.err.body')}</Text>
      <Button label={t('common.retry')} onPress={() => void load()} />
    </View>;
  }
  const code = formatInviteCode(invite.code);
  const left = Date.parse(invite.expiresAt) - now;
  const expired = left <= 0;
  const minutes = Math.max(0, Math.ceil(left / 60_000));
  async function share() {
    const result = await Share.share({ message: t('invite.shareMsg', { code, link: `https://aroom.jinjinstar.com/i/${code}` }) }).catch(() => null);
    setNotice(result?.action === Share.dismissedAction || result === null ? t('invite.shareCancelled') : null);
  }
  const expiresAt = new Intl.DateTimeFormat(i18n.language, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(invite.expiresAt));
  return (
    <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: color.bg }}>
      <Text accessibilityRole="header" style={{ color: color.text, fontSize: 20 }}>{t('invite.title')}</Text>
      <Text style={{ color: color.text2 }}>{t('invite.body')}</Text>
      {expired ? <View style={{ gap: 4 }}><Banner kind="warn" text={t('invite.expired.title')} /><Text style={{ color: color.text2 }}>{t('invite.expired.body')}</Text></View> : <View style={{ gap: 4 }}>
        <Text style={{ color: color.text2 }}>{t('invite.code.label')}</Text>
        <Text accessibilityLabel={t('a11y.code', { code: code.split('').join(' ') })} style={{ color: color.text, fontSize: 32, letterSpacing: 4 }}>{code}</Text>
        <Text style={{ color: color.text2 }}>{t('invite.once')}</Text>
        {left <= EXPIRING_MS ? <Banner kind="warn" text={t('invite.expiring', { m: minutes })} /> : <Text style={{ color: color.text2 }}>{t('invite.expires', { h: Math.floor(minutes / 60), m: minutes % 60 })}</Text>}
        <Text style={{ color: color.text2 }}>{t('invite.expiresAt', { date: expiresAt })}</Text>
        <Button label={t('invite.share')} accessibilityLabel={t('a11y.share')} onPress={() => void share()} />
      </View>}
      {notice && <Banner text={notice} />}
      <Button label={t('invite.reissue')} variant="secondary" onPress={() => setConfirmReissue(true)} />
      <View style={{ alignItems: 'center', gap: 4 }}>
        <FloatingLetter reduced={reducedMotion ?? systemReduced} />
        <Text style={{ color: color.text }}>{t('invite.waiting.title')}</Text>
        <Text style={{ color: color.text2 }}>{t('invite.waiting.body')}</Text>
      </View>
      {onLater && <Button label={t('invite.later')} variant="ghost" onPress={onLater} />}
      <Dialog visible={confirmReissue} title={t('invite.reissue.title')} onClose={() => setConfirmReissue(false)}>
        <Text style={{ color: color.text2 }}>{t('invite.reissue.body')}</Text>
        <Button label={t('common.confirm')} onPress={() => { setConfirmReissue(false); void load(); }} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirmReissue(false)} />
      </Dialog>
    </View>
  );
}
