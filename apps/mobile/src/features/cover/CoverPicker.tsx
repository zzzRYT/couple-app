import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import type { HomeCover } from '../../lib/client';
import { useAppColor } from '../../theme/useAppColor';
import { tokens } from '../../theme/tokens';
import { AppText, Banner, BottomSheet, Button, Toast } from '../../ui/components';
import { COVER_ASPECT_RATIO, COVER_PICKER_ASPECT } from './coverCrop';

const MAX_COVER_BYTES = 20 * 1024 * 1024;
type Props = { cover: HomeCover | null; userId: string | null; offline: boolean; open?: boolean; onOpenConsumed?: () => void; dayCount: number; since: string; onUpload: (asset: ImagePicker.ImagePickerAsset) => Promise<void>; onRemove: () => Promise<void>; onLoad: () => Promise<void> };
export function CoverPicker({ cover, userId, offline, open, onOpenConsumed, dayCount, since, onUpload, onRemove, onLoad }: Props) {
  const color = useAppColor();
  const { t } = useTranslation();
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<'upload' | 'invalid' | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const observedVersion = useRef<number | null>(null);
  const [partnerNotice, setPartnerNotice] = useState<string | null>(null);
  useEffect(() => { if (open) { setSheet(true); onOpenConsumed?.(); } }, [open, onOpenConsumed]);
  useEffect(() => {
    if (!cover) return;
    if (observedVersion.current === null) { observedVersion.current = cover.version; return; }
    if (cover.version > observedVersion.current && cover.uploadedBy && cover.uploadedBy !== userId) {
      setPartnerNotice(t(cover.status === 'ready' ? 'cover.partner.changed' : 'cover.partner.removed', { name: t('cover.partner') }));
    }
    observedVersion.current = cover.version;
  }, [cover, t, userId]);
  async function pick() {
    setFailure(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: COVER_PICKER_ASPECT, quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_COVER_BYTES) { setFailure('invalid'); return; }
    setBusy(true);
    try {
      await onUpload(asset);
      setSheet(false);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setFailure(['COVER_TOO_LARGE', 'COVER_FORMAT_UNSUPPORTED', 'COVER_INVALID_IMAGE'].includes(code) ? 'invalid' : 'upload');
    } finally { setBusy(false); }
  }
  async function remove() { setBusy(true); setFailure(null); try { await onRemove(); setSheet(false); } catch { setFailure('upload'); } finally { setBusy(false); } }
  const byName = cover?.uploadedBy === userId ? t('cover.me') : t('cover.partner');
  const showPhoto = cover?.status === 'ready' && cover.signedUrl && !imageFailed;
  return <>
    <View style={{ overflow: 'hidden', width: '100%', aspectRatio: COVER_ASPECT_RATIO, borderRadius: tokens.radius.card, backgroundColor: color.surface, justifyContent: 'center' }}>
      {showPhoto && <Image source={{ uri: cover.signedUrl }} onError={() => setImageFailed(true)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="cover" />}
      {showPhoto && <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20, 14, 12, 0.68)' }} />}
      <View style={{ padding: tokens.spacing[3], gap: tokens.spacing[2] }}>
        <AppText style={{ color: showPhoto ? '#FFFFFF' : color.text2 }}>{t('dday.eyebrow')}</AppText>
        <AppText variant="display" align="center" style={{ color: showPhoto ? '#FFFFFF' : color.text }}>{t('dday.count', { n: dayCount })}</AppText>
        <AppText align="center" style={{ color: showPhoto ? '#FFFFFF' : color.text2 }}>{since}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel={t(showPhoto ? 'a11y.cover.change' : 'a11y.cover.add')} disabled={offline} onPress={() => setSheet(true)} style={{ alignSelf: 'center', minHeight: tokens.touch.minimum, justifyContent: 'center', backgroundColor: showPhoto ? 'rgba(20,14,12,0.72)' : color.surface, paddingHorizontal: tokens.spacing[2], paddingVertical: tokens.spacing[1], borderRadius: tokens.radius.pill }}>
          <AppText style={{ color: showPhoto ? '#FFFFFF' : color.primary }}>{t(showPhoto ? 'a11y.cover.change' : 'cover.add')}</AppText>
        </Pressable>
        {cover?.status === 'ready' && <AppText variant="caption" align="center" style={{ color: showPhoto ? '#FFFFFF' : color.text2 }}>{t('cover.by', { name: byName, time: cover.updatedAt ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(cover.updatedAt)) : '' })}</AppText>}
        {partnerNotice && <Toast text={partnerNotice} onHide={() => setPartnerNotice(null)} />}
        {offline && <AppText variant="caption" align="center" tone="text2">{t('cover.offline')}</AppText>}
        {imageFailed && <Button label={t('common.retry')} variant="ghost" onPress={() => { setImageFailed(false); void onLoad(); }} />}
      </View>
    </View>
    <BottomSheet visible={sheet} title={t('cover.sheet.title')} onClose={() => setSheet(false)}>
      <AppText tone="text2">{t('cover.sheet.note')}</AppText>
      {cover?.status === 'ready' && <AppText variant="caption" tone="text2">{t('cover.by', { name: byName, time: cover.updatedAt ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(cover.updatedAt)) : '' })}</AppText>}
      {failure === 'invalid' && <Banner kind="warn" text={t('cover.rej.title')} body={t('cover.rej.body')} />}
      {failure === 'upload' && <Banner kind="danger" text={t('cover.err.title')} body={t('cover.err.body')} action={{ label: t('common.retry'), onPress: () => void pick() }} />}
      {busy && <Banner kind="info" text={t('cover.up.title')} />}
      <Button label={t('cover.sheet.pick')} loading={busy} disabled={offline} onPress={() => void pick()} />
      {cover?.status === 'ready' && <Button label={t('cover.sheet.remove')} variant="ghost" loading={busy} disabled={offline} onPress={() => void remove()} />}
      <Button label={t('common.cancel')} variant="ghost" disabled={busy} onPress={() => setSheet(false)} />
    </BottomSheet>
  </>;
}
