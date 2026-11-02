import { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Button, Card } from '../../ui/components';
import { CodeBoxes } from '../../ui/CodeBoxes';
import { readV0Invite, type StoredInvite } from '../space/v0LocalData';
export function InvitePendingCard({ spaceId, expiresAt, offline, onOpenInvite }: { spaceId: string; expiresAt: string | null; offline: boolean; onOpenInvite: () => void }) {
  const { t, i18n } = useTranslation();
  const [invite, setInvite] = useState<StoredInvite | null>(null);
  useEffect(() => { let alive = true; void readV0Invite(spaceId).then((value) => { if (alive) setInvite(value); }); return () => { alive = false; }; }, [spaceId, expiresAt]);
  const expired = !invite || Date.parse(invite.expiresAt) <= Date.now() || invite.expiresAt !== expiresAt;
  const share = useCallback(() => { if (invite) void Share.share({ message: t('invite.shareMsg', { code: invite.code, link: `https://aroom.jinjinstar.com/i/${invite.code}` }) }); }, [invite, t]);
  return <Card tone="line"><AppText variant="heading">{t('home.pending.title')}</AppText>
    {!expired && invite && <CodeBoxes code={invite.code} label={t('a11y.code', { code: invite.code.split('').join(' ') })} />}
    {invite && expired && <Banner kind="warn" text={t('invite.expired.title')} body={t('invite.expired.body')} />}
    {expiresAt && <AppText variant="bodySm" tone="text2">{t('invite.expiresAt', { date: new Intl.DateTimeFormat(i18n.language, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(expiresAt)) })}</AppText>}
    {expired ? <Button label={t('invite.reissue')} disabled={offline} onPress={onOpenInvite} /> : <><Button label={t('invite.copy')} variant="secondary" disabled={offline} onPress={() => { if (invite) void Clipboard.setStringAsync(invite.code); }} /><Button label={t('invite.share')} disabled={offline} onPress={share} /></>}
    <AppText variant="bodySm" tone="text2">{t('home.pending.hint')}</AppText>
  </Card>;
}
