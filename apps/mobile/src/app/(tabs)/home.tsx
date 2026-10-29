import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import type { ImagePickerAsset } from 'expo-image-picker';
import { HomeScreen } from '../../features/home/HomeScreen';
import { useApp } from '../../lib/AppContext';
import { useSpace } from '../../features/space/SpaceContext';
import { useNow } from '../../lib/useNow';
import { useMilestone } from '../../features/milestone/useMilestone';
import type { HomeCover } from '../../lib/client';
import * as ImageManipulator from 'expo-image-manipulator';
import { COVER_CROP } from '../../features/cover/coverCrop';
const MAX_COVER_BYTES = 20 * 1024 * 1024;
const MAX_COVER_EDGE = 1600;
export default function HomeRoute() {
  const { client, userId } = useApp();
  const { state, refresh, spaceId } = useSpace();
  const params = useLocalSearchParams<{ cover?: string }>();
  const [cover, setCover] = useState<HomeCover | null>(null);
  const milestone = useMilestone(spaceId, userId, !state.offline && state.status !== 'error', client, 'home', state.offline,
    state.snapshot ? `${state.snapshot.space.updatedAt}:${state.snapshot.versionNumber}:${state.snapshot.space.timeZone}:${state.snapshot.space.anniversaryDate}` : '');
  const inviteOpening = useRef(false);
  const focusedOnce = useRef(false);
  useFocusEffect(useCallback(() => { inviteOpening.current = false; if (focusedOnce.current) void milestone.reload(); else focusedOnce.current = true; return () => { inviteOpening.current = false; }; }, [milestone.reload]));
  const openInvite = () => { if (inviteOpening.current) return; inviteOpening.current = true; router.push('/invite'); };
  const now = useNow();
  const space = state.snapshot?.space;
  const loadCover = useCallback(async () => {
    if (!space) return;
    try { setCover(await client.homeCover(space.spaceId)); } catch { /* retain the last verified cover while offline */ }
  }, [client, space?.spaceId]);
  useEffect(() => { void loadCover(); }, [loadCover, state.lastSyncedAt]);
  useEffect(() => {
    if (cover?.status !== 'ready') return;
    const timer = setTimeout(() => { void loadCover(); }, 4 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [cover?.status, cover?.version, loadCover]);
  const uploadCover = useCallback(async (asset: ImagePickerAsset) => {
    if (!space) return;
    let uploadUri = asset.uri;
    let contentType = asset.mimeType?.toLowerCase() ?? 'image/jpeg';
    const oversized = Math.max(asset.width, asset.height) > MAX_COVER_EDGE;
    if (oversized || contentType === 'image/heic' || contentType === 'image/heif') {
      const resize = asset.width >= asset.height ? { width: MAX_COVER_EDGE } : { height: MAX_COVER_EDGE };
      const converted = await ImageManipulator.manipulateAsync(asset.uri, oversized ? [{ resize }] : [], { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG });
      uploadUri = converted.uri;
      contentType = 'image/jpeg';
    }
    if (!['image/jpeg', 'image/png'].includes(contentType)) throw new Error('COVER_FORMAT_UNSUPPORTED');
    const blob = await (await fetch(uploadUri)).blob();
    if (blob.size <= 0 || blob.size > MAX_COVER_BYTES) throw new Error('COVER_TOO_LARGE');
    const ticket = await client.homeCoverUploadUrl(space.spaceId, contentType, blob.size);
    const uploaded = await fetch(ticket.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
    if (!uploaded.ok) throw new Error('COVER_UPLOAD_FAILED');
    await client.finishHomeCoverUpload(space.spaceId, ticket.uploadId, COVER_CROP);
    await loadCover();
  }, [client, loadCover, space]);
  const removeCover = useCallback(async () => { if (space) { await client.removeHomeCover(space.spaceId); await loadCover(); } }, [client, loadCover, space]);
  return <HomeScreen state={state} now={now} onOpenRoom={() => router.navigate('/room')} onOpenInvite={openInvite}
    milestone={milestone.celebration} milestonePreset={milestone.preset} onMilestoneSeen={() => { if (milestone.celebration) void milestone.seen(milestone.celebration); }}
    onMilestoneSuggest={() => { if (milestone.preset?.presetAvailable) router.push({ pathname: '/prompt', params: { milestone: milestone.preset.id, milestoneKey: milestone.preset.key } }); }}
    onRefresh={refresh} cover={cover} userId={userId} openCover={params.cover === '1'} onCoverOpenConsumed={() => router.setParams({ cover: undefined })} onCoverUpload={uploadCover} onCoverRemove={removeCover} onCoverLoad={loadCover}
    onSaveDate={async (date) => { if (space) { await client.updateAnniversary(space.spaceId, date, space.updatedAt); await refresh(); } }} />;
}
