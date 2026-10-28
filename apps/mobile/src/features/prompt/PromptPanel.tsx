import { useAppColor } from '../../theme/useAppColor';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Button, Chip, Dialog, OccupancyChip } from '../../ui/components';
import { CycleLoader } from '../../ui/CycleLoader';
import type { Conversation, Preview, SceneDocument, Snapshot } from '../../lib/client';
import { ApiError } from '../../lib/errors';
import { tokens } from '../../theme/tokens';
import { defaultSessionSettings, useSession, type SessionApi, type SessionSettings } from './useSession';

export type PanelClient = SessionApi & {
  conversation(spaceId: string): Promise<Conversation>;
  requestPreview(spaceId: string, prompt: string, sessionId: string, baseVersion: number): Promise<Preview>;
  confirmPreview(spaceId: string, previewId: string, sessionId: string, baseVersion: number): Promise<{ appliedVersion: number }>;
  cancelPreview(spaceId: string, previewId: string, sessionId: string): Promise<void>;
  undo(spaceId: string, sessionId: string, expectedPreviewId: string): Promise<{ previewId: string | null }>;
};
type Notice = { key: string; body?: string | null; kind: 'info' | 'success' | 'warn' | 'danger' };
const MAX_PROMPT = 500;
/** The data model stores no display names, so the partner is referred to generically. */
export const partnerLabel = (t: (key: string) => string) => t('report.target.partner');
function noticeFor(error: unknown): Notice {
  if (!(error instanceof ApiError)) return { key: 'prompt.fail.title', body: 'prompt.fail.body', kind: 'danger' };
  switch (error.code) {
    case 'DAILY_LIMIT_REACHED': return { key: 'prompt.quota.title', body: 'prompt.quota.body', kind: 'warn' };
    case 'UNSUPPORTED_REQUEST': case 'ROOM_FULL': return { key: 'prompt.unsupported.title', body: 'prompt.unsupported.body', kind: 'warn' };
    case 'VERSION_CONFLICT': return { key: 'preview.conflict.title', body: 'preview.conflict.body', kind: 'warn' };
    case 'NOTHING_TO_UNDO': case 'ALREADY_APPLIED': return { key: 'undo.none.title', body: 'undo.none.body', kind: 'info' };
    case 'PREVIEW_CHANGED': return { key: 'undo.conflict.title', body: 'undo.conflict.body', kind: 'info' };
    case 'CONSENT_REQUIRED': return { key: 'prompt.consent.need', kind: 'warn' };
    default: return { key: 'prompt.fail.title', body: 'prompt.fail.body', kind: 'danger' };
  }
}
/** S08 shared prompt panel: one owner types, requests and applies; the partner watches read-only. Offline requests are never queued. */
export function PromptPanel({ client, snapshot, online, refreshToken = 0, onOpenConsent, onClose, onApplied, renderScene, clock, settings = defaultSessionSettings, onReportMessage }: {
  client: PanelClient; snapshot: Snapshot; online: boolean; refreshToken?: number; onOpenConsent: () => void; onClose?: () => void; onApplied?: (version: number) => void;
  renderScene?: (scene: SceneDocument) => ReactNode; clock?: () => number; settings?: SessionSettings;
  /** Opens the report flow for a partner's message; omit to hide the message menu. */
  onReportMessage?: (messageId: string) => void;
}) {
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const color = useAppColor();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const spaceId = snapshot.space.spaceId;
  const me = snapshot.me.userId;
  const partner = partnerLabel(t);
  const session = useSession({ api: client, spaceId, me, initial: snapshot.promptSession, clock, settings });
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<null | 'sending' | 'applying' | 'undoing'>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const [applied, setApplied] = useState(false);
  const [viewCandidate, setViewCandidate] = useState(true);
  const load = useCallback(async () => { try { setConversation(await client.conversation(spaceId)); } catch { /* keep the last conversation */ } }, [client, spaceId]);
  useEffect(() => { void load(); }, [load, refreshToken]);
  const partnerMissing = snapshot.space.memberCount < 2 || snapshot.members.length < 2;
  const consentMissing = partnerMissing || snapshot.members.some((member) => member.aiConsentState !== 'granted');
  const status = session.status;
  const owner = status === 'mine' || status === 'mineExpiring';
  const sessionId = session.lease?.sessionId ?? '';
  const preview = conversation?.currentPreview ?? null;
  const fail = (error: unknown) => { const next = noticeFor(error); if (next.key === 'prompt.quota.title') setQuotaUsed(true); setNotice(next); };
  async function start() {
    setNotice(null); setApplied(false);
    try { await session.acquire(); } catch (error) { fail(error); }
  }
  async function send() {
    setBusy('sending'); setNotice(null); session.noteActivity();
    try { await client.requestPreview(spaceId, draft.trim(), sessionId, snapshot.versionNumber); setDraft(''); setViewCandidate(true); await load(); } catch (error) { fail(error); } finally { setBusy(null); }
  }
  async function apply() {
    if (!preview) return;
    setConfirming(false); setBusy('applying');
    try { const result = await client.confirmPreview(spaceId, preview.previewId, sessionId, snapshot.versionNumber); setApplied(true); session.clear(); await load(); onApplied?.(result.appliedVersion); } catch (error) { fail(error); } finally { setBusy(null); }
  }
  async function cancel() {
    if (!preview) return;
    try { await client.cancelPreview(spaceId, preview.previewId, sessionId); session.clear(); setNotice({ key: 'preview.cancel.toast', kind: 'info' }); await load(); } catch (error) { fail(error); }
  }
  async function undo() {
    if (!preview) return;
    setBusy('undoing'); session.noteActivity();
    try { await client.undo(spaceId, sessionId, preview.previewId); setNotice({ key: 'undo.done.title', body: 'undo.done.body', kind: 'success' }); await load(); } catch (error) { fail(error); await load(); } finally { setBusy(null); }
  }
  const last = conversation?.messages.at(-1);
  const partnerThinking = status === 'partner' && last?.kind === 'user_prompt' && last.state === 'queued';
  const canType = online && owner && !consentMissing && !quotaUsed && busy === null;
  const occupancy = status === 'free' ? t('prompt.free') : owner || status === 'mineExpired' ? t('prompt.mine') : t('prompt.partner', { name: partner });
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing[3], paddingTop: Math.max(insets.top, tokens.spacing[3]), gap: tokens.spacing[1] }}>
      {!preview && renderScene && <View style={{ alignSelf: 'center', overflow: 'hidden', borderRadius: tokens.radius.card, borderWidth: tokens.border.outline.normal, borderColor: color.line }}>{renderScene(snapshot.sceneDocument)}</View>}
      <View style={{ gap: tokens.spacing[1] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: tokens.spacing[1] }}><Text accessibilityRole="header" style={{ flexShrink: 1, color: color.text, fontSize: tokens.typography.scale.heading.size }}>{t('prompt.title')}</Text>{onClose && <Button label={t('common.close')} variant="ghost" onPress={onClose} />}</View>
        <View accessibilityLabel={t('a11y.presence', { state: occupancy })} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <OccupancyChip label={occupancy} />
          {(status === 'partner' || status === 'mineExpiring') && <Chip label={t('prompt.expiring', { s: session.secondsLeft })} />}
          {partnerThinking && <Chip label={t('prompt.partner.thinking')} />}
        </View>
        {!online && <Banner kind="offline" text={t('prompt.offline')} />}
        {online && partnerMissing && <Banner kind="info" text={t('main.invitePending.title')} />}
        {online && consentMissing && <View style={{ gap: 4 }}><Banner kind="warn" text={t('prompt.consent.need')} /><Button label={t('prompt.consent.action')} variant="secondary" onPress={onOpenConsent} /></View>}
        {status === 'mineExpiring' && <View style={{ gap: 4 }}><Banner kind="warn" text={t('prompt.idleHint')} /><Button label={t('prompt.expiring.action')} variant="secondary" onPress={() => void session.keepAlive()} /></View>}
        {status === 'mineExpired' && <View style={{ gap: 4 }}><Banner kind="warn" text={t('prompt.idle.me.title')} /><Text style={{ color: color.text2 }}>{t('prompt.idle.me.body')}</Text><Button label={t('prompt.idle.me.action')} onPress={() => void start()} /></View>}
        {status === 'partnerExpired' && <View style={{ gap: 4 }}>
          <Banner text={t('prompt.takeover.title', { name: partner })} /><Text style={{ color: color.text2 }}>{t('prompt.takeover.body')}</Text>
          <Button label={t('prompt.takeover.action')} disabled={!online || consentMissing} onPress={() => void session.takeover().catch(fail)} />
        </View>}
        {session.lostTakeover && <Banner kind="warn" text={t('prompt.takeover.lost', { name: partner })} />}
        {status === 'free' && <View style={{ gap: 4 }}>
          <Button label={t('prompt.start')} disabled={!online || consentMissing || quotaUsed} onPress={() => void start()} />
          <Text style={{ color: color.text2 }}>{t('prompt.start.help')}</Text><Text style={{ color: color.text2 }}>{t('prompt.idleHint')}</Text>
        </View>}
        {notice && <View style={{ gap: 4 }}><Banner kind={notice.kind} text={t(notice.key)} />{notice.body && <Text style={{ color: color.text2 }}>{t(notice.body)}</Text>}</View>}
        {applied && <View style={{ gap: 4 }}><Banner kind="success" text={t('preview.applied.title')} /><Text style={{ color: color.text2 }}>{t('preview.applied.body')}</Text></View>}
      </View>
      <View style={{ gap: tokens.spacing[1] }}>
        {conversation?.messages.length ? conversation.messages.map((message) => (
          <View key={message.id} style={{ alignSelf: message.authorUserId === me ? 'flex-end' : 'flex-start', padding: 8, backgroundColor: message.kind === 'status' ? 'transparent' : color.surface, borderWidth: message.kind === 'status' ? 0 : 1, borderColor: color.divider }}>
            <Text style={{ color: message.kind === 'status' ? color.text2 : color.text }}>{message.kind === 'preview' && !message.bodyText ? t('prompt.msg.status.preview') : message.bodyText}</Text>
            {onReportMessage && message.kind === 'user_prompt' && message.authorUserId && message.authorUserId !== me && <Button label="⋯" variant="ghost" accessibilityLabel={t('report.msg.menu')} onPress={() => setMenuFor(message.id)} />}
          </View>
        )) : <Text style={{ color: color.text2 }}>{t('prompt.history.empty')}</Text>}
        {preview && !applied && <View style={{ gap: 8, borderWidth: 2, borderColor: color.line, borderRadius: tokens.radius.card, padding: tokens.spacing[1] }}>
          <Chip label={t('preview.badge')} />
          <Text style={{ color: color.text2 }}>{t('preview.shared')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing[1] }}>
            <Button label={t('preview.view.current')} variant={viewCandidate ? 'ghost' : 'secondary'} accessibilityLabel={t('a11y.toggle.view', { state: t('preview.view.current') })} onPress={() => setViewCandidate(false)} />
            <Button label={t('preview.view.candidate')} variant={viewCandidate ? 'secondary' : 'ghost'} accessibilityLabel={t('a11y.toggle.view', { state: t('preview.view.candidate') })} onPress={() => setViewCandidate(true)} />
          </View>
          {renderScene?.(viewCandidate ? preview.sceneDocument : snapshot.sceneDocument)}
          {owner ? <View style={{ gap: 8 }}>
            <Text style={{ color: color.text2 }}>{t('preview.applyHint')}</Text>
            {busy === 'applying' ? <CycleLoader label={t('preview.applying')} /> : <Button label={t('preview.apply')} accessibilityLabel={t('a11y.apply')} disabled={!online} onPress={() => setConfirming(true)} />}
            <Button label={t('preview.undo')} accessibilityLabel={t('a11y.undo')} variant="secondary" disabled={!online || busy !== null} onPress={() => setConfirmingUndo(true)} />
            <Button label={t('preview.cancel')} accessibilityLabel={t('a11y.cancel')} variant="ghost" disabled={!online} onPress={() => void cancel()} />
          </View> : <View style={{ gap: 4 }}><Text style={{ color: color.text2 }}>{t('preview.partner.wait', { name: partner })}</Text><Text style={{ color: color.text2 }}>{t('preview.partner.readonly')}</Text></View>}
        </View>}
      </View>
      </ScrollView>
      <Dialog visible={menuFor !== null} title={t('report.msg.menu')} onClose={() => setMenuFor(null)}>
        <Button label={t('report.msg.menu')} onPress={() => { const id = menuFor; setMenuFor(null); if (id && onReportMessage) onReportMessage(id); }} />
        <Button label={t('report.msg.menu.cancel')} variant="ghost" onPress={() => setMenuFor(null)} />
      </Dialog>
      <View style={{ padding: tokens.spacing[3], paddingBottom: Math.max(insets.bottom, tokens.spacing[3]), gap: tokens.spacing[1], borderTopWidth: 1, borderColor: color.divider }}>
        {status === 'partner' && <Text style={{ color: color.text2 }}>{t('prompt.input.partner', { name: partner })}</Text>}
        {busy === 'sending' && <CycleLoader label={t('prompt.sending')} />}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: tokens.spacing[1] }}>
        <TextInput
          accessibilityLabel={status === 'partner' ? t('a11y.input.ro', { name: partner }) : t('a11y.input')}
          placeholder={t('prompt.placeholder')} placeholderTextColor={color.text2} value={draft}
          onChangeText={(value) => { setDraft(value.slice(0, MAX_PROMPT)); session.noteActivity(); }}
          editable={canType} multiline returnKeyType="default" blurOnSubmit={false} submitBehavior="newline"
          style={{ flex: 1, minHeight: tokens.touch.minimum, maxHeight: tokens.spacing[8] * 2, borderWidth: 1, borderColor: color.border, color: color.text, padding: tokens.spacing[2], borderRadius: tokens.radius.input, textAlignVertical: 'top', opacity: canType ? 1 : 0.6 }}
        />
        <Button label={t('prompt.send')} accessibilityLabel={t('a11y.send')} disabled={!canType || draft.trim().length === 0} onPress={() => void send()} />
        </View>
      </View>
      <Dialog visible={confirmingUndo} title={t('undo.title')} onClose={() => setConfirmingUndo(false)}>
        <Text style={{ color: color.text2 }}>{t('undo.body')}</Text>
        <Button label={t('undo.confirm')} onPress={() => { setConfirmingUndo(false); void undo(); }} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirmingUndo(false)} />
      </Dialog>
      <Dialog visible={confirming} title={t('preview.confirm.title')} onClose={() => setConfirming(false)}>
        <Text style={{ color: color.text2 }}>{t('preview.confirm.body')}</Text>
        <Button label={t('preview.apply')} onPress={() => void apply()} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirming(false)} />
      </Dialog>
    </KeyboardAvoidingView>
  );
}
