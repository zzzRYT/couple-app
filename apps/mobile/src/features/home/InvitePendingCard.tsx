import { useCallback, useEffect, useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card, IconButton } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import { CodeBoxes } from '../../ui/CodeBoxes';
import { readV0Invite, type StoredInvite } from '../space/v0LocalData';

const EXPIRING_MS = 30 * 60_000;
/** V0-home-pending invite card. The code itself only exists on the device that made it; elsewhere the card offers a new one. */
export function InvitePendingCard({ spaceId, expiresAt, now, offline, onOpenInvite, onHaveCode, onCopied }: { spaceId: string; expiresAt: string | null; now: string; offline: boolean; onOpenInvite: () => void; onHaveCode?: () => void; onCopied: (copied: boolean) => void }) {
  const { t } = useTranslation(); const color = useAppColor(); const { emphasis } = useType();
  const [invite, setInvite] = useState<StoredInvite | null>(null);
  useEffect(() => { let alive = true; void readV0Invite(spaceId).then((value) => { if (alive) setInvite(value); }); return () => { alive = false; }; }, [spaceId, expiresAt]);
  const left = expiresAt ? Date.parse(expiresAt) - Date.parse(now) : 0;
  const usable = !!invite && invite.expiresAt === expiresAt && left > 0;
  const share = useCallback(() => { if (invite) void Share.share({ message: t('invite.shareMsg', { code: invite.code, link: `https://aroom.jinjinstar.com/i/${invite.code}` }) }); }, [invite, t]);
  const copy = () => { if (invite) void Clipboard.setStringAsync(invite.code).then(onCopied, () => onCopied(false)); };
  const minutes = Math.max(0, Math.ceil(left / 60_000)), expiring = left <= EXPIRING_MS;
  const expiry = left > 0 ? <AppText style={[emphasis(13), { color: expiring ? color.warn : color.text2, flexShrink: 1 }]}>{expiring ? t('invite.expiring', { m: minutes }) : t('invite.expires', { h: Math.floor(minutes / 60), m: minutes % 60 })}</AppText> : null;
  return <Card tone="line" style={{ gap: 10, paddingVertical: 14 }}><AppText accessibilityRole="header" style={emphasis(16)}>{t('home.pending.title')}</AppText>
    {usable && <CodeBoxes compact code={invite.code} label={t('a11y.code', { code: invite.code.split('').join(' ') })} />}
    {invite && !usable && <Banner kind="warn" text={t('invite.expired.title')} body={t('invite.expired.body')} />}
    {usable ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>{expiry}<View style={{ flexDirection: 'row', gap: 6 }}>
      <IconButton compact tone="secondary" icon="copy" label={t('invite.copy')} disabled={offline} onPress={copy} />
      <IconButton compact tone="primary" icon="share" label={t('invite.share')} disabled={offline} onPress={share} />
    </View></View> : <>{expiry}<Button label={t('invite.reissue')} disabled={offline} onPress={onOpenInvite} /></>}
    <AppText variant="bodySm" tone="text2">{t('home.pending.hint')}</AppText>
    {/* V0-10: the partner may have sent their code instead; entering it moves this person into the partner's space. */}
    {onHaveCode && <><View style={{ height: 1, backgroundColor: color.divider }} /><Pressable accessibilityRole="button" accessibilityLabel={t('home.pending.haveCode')} accessibilityState={{ disabled: offline }} disabled={offline} onPress={onHaveCode}
      style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, opacity: offline ? 0.5 : pressed ? 0.7 : 1 })}><AppText tone="primary" style={{ fontWeight: '700', flex: 1 }}>{t('home.pending.haveCode')}</AppText><Icon name="forward" size={18} color={color.primary} /></Pressable></>}
  </Card>;
}
