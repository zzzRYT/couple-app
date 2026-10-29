import { useAppColor } from '../../theme/useAppColor';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Banner, Button, Chip, Dialog, GUTTER, IconButton, OccupancyChip } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { useType } from '../../theme/typography';
import { CycleLoader } from '../../ui/CycleLoader';
import type { Conversation, Preview, SceneDocument, Snapshot } from '../../lib/client';
import { isNetworkError } from '../../lib/realtime';
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
/** After a lost response the app asks the server what happened: every 2 s, for about 90 s. */
const RECOVERY_INTERVAL_MS = 2000;
const RECOVERY_ATTEMPTS = 45;
/** A request still queued after this long was lost on the server (the sweep fails it later); it must not lock the panel. */
const GENERATION_STALE_MS = 150_000;
const latestIso = (...values: (string | undefined)[]) => values.filter((value): value is string => !!value).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? null;
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
  const color = useAppColor();
  const { t, i18n } = useTranslation();
  const { type, emphasis } = useType();
  const insets = useSafeAreaInsets();
  const spaceId = snapshot.space.spaceId;
  const me = snapshot.me.userId;
  const partner = partnerLabel(t);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<null | 'sending' | 'checking' | 'applying' | 'undoing'>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const [viewCandidate, setViewCandidate] = useState(true);
  const [applied, setApplied] = useState(false);
  const preview = conversation?.currentPreview ?? null;
  // An open preview keeps the lease alive while the sheet is up (the owner is reading it); the server clock drives every countdown.
  const session = useSession({ api: client, spaceId, me, initial: snapshot.promptSession, serverTime: latestIso(snapshot.serverTime, conversation?.serverTime), hold: !!preview && !applied, clock, settings });
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const load = useCallback(async () => { try { setConversation(await client.conversation(spaceId)); } catch { /* keep the last conversation */ } }, [client, spaceId]);
  useEffect(() => { void load(); }, [load, refreshToken]);
  const partnerMissing = snapshot.space.memberCount < 2 || snapshot.members.length < 2;
  const consentMissing = partnerMissing || snapshot.members.some((member) => member.aiConsentState !== 'granted');
  const status = session.status;
  const owner = status === 'mine' || status === 'mineExpiring';
  const sessionId = session.lease?.sessionId ?? '';
  const last = conversation?.messages.at(-1);
  const generating = last?.kind === 'user_prompt' && last.state === 'queued' && session.serverNow() - Date.parse(last.createdAt) < GENERATION_STALE_MS;
  const fail = (error: unknown) => { const next = noticeFor(error); if (next.key === 'prompt.quota.title') setQuotaUsed(true); setNotice(next); };
  async function start() {
    setNotice(null); setApplied(false);
    try { await session.acquire(); await load(); } catch (error) { fail(error); }
  }
  async function takeover() {
    try { await session.takeover(); await load(); } catch (error) { fail(error); }
  }
  /** The response of a generation request can get lost (backgrounding, network change) while the server finishes; ask the server what became of it. */
  async function recover(text: string, knownIds: Set<string>, original: unknown) {
    setBusy('checking');
    for (let attempt = 0; attempt < RECOVERY_ATTEMPTS && mounted.current; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, RECOVERY_INTERVAL_MS));
      let next: Conversation;
      try { next = await client.conversation(spaceId); } catch { continue; }
      if (!mounted.current) return;
      setConversation(next);
      const sent = next.messages.find((message) => message.kind === 'user_prompt' && message.authorUserId === me && message.bodyText === text && !knownIds.has(message.id));
      if (!sent) { if (attempt === 0) break; continue; }
      if (sent.state === 'queued') continue;
      if (sent.state === 'previewed') { setDraft(''); setViewCandidate(true); return; }
      if (sent.state !== 'cancelled') fail(sent.state === 'rejected' ? new ApiError(422, 'UNSUPPORTED_REQUEST') : original);
      return;
    }
    fail(original);
  }
  async function send() {
    const text = draft.trim();
    const knownIds = new Set(conversation?.messages.map((message) => message.id));
    setBusy('sending'); setNotice(null); session.noteActivity();
    try {
      await client.requestPreview(spaceId, text, sessionId, snapshot.versionNumber); setDraft(''); setViewCandidate(true); await load();
    } catch (error) {
      if (isNetworkError(error) || (error instanceof ApiError && error.code === 'IN_PROGRESS')) await recover(text, knownIds, error); else fail(error);
    } finally { if (mounted.current) setBusy(null); }
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
  const partnerThinking = status === 'partner' && generating;
  const canType = online && owner && !consentMissing && !quotaUsed && busy === null && !generating;
  // Closing the sheet frees the lease unless there is something worth holding: a preview, or a request still being generated.
  const exit = useRef({ client, spaceId, sessionId, owner, keep: false });
  exit.current = { client, spaceId, sessionId, owner, keep: !!preview || generating || busy !== null };
  useEffect(() => () => {
    const { client: api, spaceId: space, sessionId: id, owner: holds, keep } = exit.current;
    if (holds && id && !keep) void api.release(space, id).catch(() => undefined);
  }, []);
  const occupancy = status === 'free' ? t('prompt.free') : owner || status === 'mineExpired' ? t('prompt.mine') : t('prompt.partner', { name: partner });
  const chipState = owner ? 'mine' : status === 'partner' ? 'partner' : 'free';
  const showPreview = !!preview && !applied;
  const shown = showPreview && viewCandidate ? preview.sceneDocument : snapshot.sceneDocument;
  const time = (iso: string) => new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {renderScene && <View style={{ alignItems: 'center', paddingTop: Math.max(insets.top, tokens.spacing[3]), paddingBottom: tokens.spacing[2], gap: tokens.spacing[1] }}>
        <View style={{ overflow: 'hidden', borderRadius: tokens.radius.sheet - 4, borderWidth: tokens.border.outline.normal, borderColor: color.line }}>{renderScene(shown)}</View>
        {showPreview && viewCandidate && <View style={{ marginTop: -tokens.spacing[5] }}><Chip kind="primary" label={t('preview.badge')} /></View>}
      </View>}
      <View style={{ flex: 1, backgroundColor: color.surface, borderTopLeftRadius: tokens.radius.sheet, borderTopRightRadius: tokens.radius.sheet, borderWidth: tokens.border.outline.normal, borderBottomWidth: 0, borderColor: color.divider, paddingTop: renderScene ? 0 : insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: GUTTER, paddingRight: GUTTER - 12, paddingTop: tokens.spacing[2] }}>
          <AppText accessibilityRole="header" style={[emphasis(22), { color: color.text, flexShrink: 1 }]}>{t('prompt.title')}</AppText>
          {onClose && <IconButton plain icon="close" label={t('common.close')} onPress={onClose} />}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: tokens.spacing[3], gap: tokens.spacing[2] }}>
          <View accessible accessibilityLabel={t('a11y.presence', { state: occupancy })} style={{ flexDirection: 'row', gap: tokens.spacing[1], flexWrap: 'wrap' }}>
            <OccupancyChip label={occupancy} state={chipState} />
            {(status === 'partner' || status === 'mineExpiring') && <Chip kind="warn" icon="clock" label={t('prompt.expiring', { s: session.secondsLeft })} />}
            {partnerThinking && <Chip kind="info" label={t('prompt.partner.thinking')} />}
          </View>
          {!online && <Banner kind="offline" text={t('prompt.offline')} />}
          {online && partnerMissing && <Banner kind="info" icon="people" text={t('main.invitePending.title')} />}
          {online && consentMissing && <Banner kind="warn" text={t('prompt.consent.need')} action={{ label: t('prompt.consent.action'), onPress: onOpenConsent }} />}
          {status === 'mineExpiring' && <Banner kind="warn" text={t('prompt.idleHint')} action={{ label: t('prompt.expiring.action'), onPress: () => void session.keepAlive() }} />}
          {status === 'mineExpired' && <View style={{ gap: tokens.spacing[1] }}><Banner kind="warn" text={t('prompt.idle.me.title')} body={t('prompt.idle.me.body')} /><Button label={t('prompt.idle.me.action')} onPress={() => void start()} /></View>}
          {status === 'partnerExpired' && <View style={{ gap: tokens.spacing[1] }}>
            <Banner text={t('prompt.takeover.title', { name: partner })} body={t('prompt.takeover.body')} />
            <Button label={t('prompt.takeover.action')} disabled={!online || consentMissing} onPress={() => void takeover()} />
          </View>}
          {session.lostTakeover && <Banner kind="warn" text={t('prompt.takeover.lost', { name: partner })} />}
          {status === 'free' && <View style={{ gap: tokens.spacing[1] }}>
            <Button label={t('prompt.start')} icon="pencil" disabled={!online || consentMissing || quotaUsed} onPress={() => void start()} />
            <AppText variant="bodySm" tone="text2">{t('prompt.start.help')}</AppText>
          </View>}
          {notice && <Banner kind={notice.kind} text={t(notice.key)} body={notice.body ? t(notice.body) : null} />}
          {applied && <Banner kind="success" text={t('preview.applied.title')} body={t('preview.applied.body')} />}
          {showPreview && <View style={{ gap: tokens.spacing[2] }}>
            <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 4, gap: 4, borderRadius: tokens.radius.pill, borderWidth: tokens.border.outline.normal, borderColor: color.line, backgroundColor: color.surface2 }}>
              {([false, true] as const).map((candidate) => {
                const selected = viewCandidate === candidate;
                const label = t(candidate ? 'preview.view.candidate' : 'preview.view.current');
                return <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={t('a11y.toggle.view', { state: label })} onPress={() => { setViewCandidate(candidate); session.noteActivity(); }}
                  style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.pill, backgroundColor: selected ? color.primary : 'transparent', borderWidth: selected ? tokens.border.outline.normal : 0, borderColor: color.line }}>
                  <AppText style={[emphasis(15), { color: selected ? color.onPrimary : color.text }]}>{label}</AppText>
                </Pressable>;
              })}
            </View>
            <AppText variant="bodySm" tone="text2">{t('preview.shared')}</AppText>
            {owner ? <View style={{ gap: tokens.spacing[1] }}>
              <AppText style={[emphasis(14), { color: color.text }]}>{t('preview.applyHint')}</AppText>
              <View style={{ flexDirection: 'row', gap: tokens.spacing[1] }}>
                <View style={{ flex: 1 }}><Button label={t('preview.apply')} accessibilityLabel={t('a11y.apply')} loading={busy === 'applying'} disabled={!online || generating} onPress={() => { session.noteActivity(); setConfirming(true); }} /></View>
                <View style={{ flex: 1 }}><Button label={t('preview.cancel')} accessibilityLabel={t('a11y.cancel')} variant="secondary" disabled={!online || busy !== null || generating} onPress={() => void cancel()} /></View>
              </View>
              <Button label={t('preview.undo')} accessibilityLabel={t('a11y.undo')} icon="undo" variant="ghost" loading={busy === 'undoing'} disabled={!online || busy !== null || generating} onPress={() => { session.noteActivity(); setConfirmingUndo(true); }} />
            </View> : status === 'partner' ? <Banner kind="info" icon="lock" text={t('preview.partner.wait', { name: partner })} body={t('preview.partner.readonly')} /> : null}
          </View>}
          <View style={{ gap: tokens.spacing[2], paddingTop: tokens.spacing[1] }}>
            {conversation?.messages.length ? conversation.messages.map((message) => {
              if (message.kind === 'status') return <View key={message.id} style={{ alignSelf: 'center' }}><Chip label={message.bodyText ?? ''} /></View>;
              const mine = message.kind === 'user_prompt' && message.authorUserId === me;
              const result = message.kind === 'preview';
              return (
                <View key={message.id} style={{ alignSelf: mine ? 'flex-end' : 'stretch', maxWidth: mine ? '86%' : '100%', gap: 2 }}>
                  {!mine && !result && <AppText variant="caption" tone="text2">{partner}</AppText>}
                  <View style={{ paddingVertical: tokens.spacing[2], paddingHorizontal: tokens.spacing[3], borderRadius: tokens.radius.card, borderBottomRightRadius: mine ? 6 : tokens.radius.card, backgroundColor: mine ? color.primary : result ? color.surface : color.surface2, borderWidth: result ? tokens.border.outline.normal : 0, borderColor: color.border }}>
                    <AppText style={{ color: mine ? color.onPrimary : color.text }}>{result && !message.bodyText ? t('prompt.msg.status.preview') : message.bodyText}</AppText>
                  </View>
                  {onReportMessage && message.kind === 'user_prompt' && !mine && message.authorUserId && <View style={{ alignSelf: 'flex-start' }}><Button label="⋯" variant="ghost" accessibilityLabel={t('report.msg.menu')} onPress={() => setMenuFor(message.id)} /></View>}
                  {mine && <AppText variant="caption" tone="text2" align="right">{time(message.createdAt)}</AppText>}
                </View>
              );
            }) : <AppText variant="bodySm" tone="text2">{t('prompt.history.empty')}</AppText>}
            {partnerThinking && <AppText variant="bodySm" tone="text2">{t('prompt.partner.typing', { name: partner })}</AppText>}
          </View>
        </ScrollView>
        <View style={{ paddingHorizontal: GUTTER, paddingTop: tokens.spacing[1], paddingBottom: Math.max(insets.bottom, tokens.spacing[3]), gap: tokens.spacing[1] }}>
          {status === 'partner' && <View style={{ flexDirection: 'row', gap: tokens.spacing[0], alignItems: 'center' }}><Icon name="lock" size={16} color={color.text2} /><AppText variant="bodySm" tone="text2" style={{ flexShrink: 1 }}>{t('prompt.input.partner', { name: partner })}</AppText></View>}
          {(busy === 'sending' || busy === 'checking' || (owner && generating && busy === null)) && <CycleLoader label={t('prompt.sending')} />}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: tokens.spacing[1] }}>
            <TextInput
              accessibilityLabel={status === 'partner' ? t('a11y.input.ro', { name: partner }) : t('a11y.input')}
              placeholder={t('prompt.placeholder')} placeholderTextColor={color.text2} value={draft}
              onChangeText={(value) => { setDraft(value.slice(0, MAX_PROMPT)); session.noteActivity(); }}
              editable={canType} multiline returnKeyType="default" blurOnSubmit={false} submitBehavior="newline"
              style={[type('body'), { flex: 1, minHeight: tokens.touch.toolbarHeight, maxHeight: 120, borderWidth: tokens.border.outline.normal, borderColor: color.border, color: color.text, backgroundColor: canType ? color.surface : color.surface2, paddingHorizontal: tokens.spacing[3], paddingTop: 13, paddingBottom: 13, borderRadius: tokens.radius.input + 8, textAlignVertical: 'top' }]}
            />
            <Pressable accessibilityRole="button" accessibilityLabel={t('a11y.send')} accessibilityState={{ disabled: !canType || draft.trim().length === 0 }} disabled={!canType || draft.trim().length === 0} onPress={() => void send()}
              style={({ pressed }) => {
                const off = !canType || draft.trim().length === 0;
                return { width: tokens.touch.toolbarHeight, height: tokens.touch.toolbarHeight, borderRadius: tokens.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: off ? color.surface2 : color.primary, borderWidth: tokens.border.outline.normal, borderColor: off ? color.border : color.line, borderStyle: off ? 'dashed' : 'solid', opacity: pressed ? 0.85 : 1 };
              }}>
              <Icon name="send" size={22} color={!canType || draft.trim().length === 0 ? color.text2 : color.onPrimary} />
            </Pressable>
          </View>
          {status === 'mine' && <AppText variant="caption" tone="text2">{t('prompt.idleHint')}</AppText>}
        </View>
      </View>
      <Dialog visible={menuFor !== null} icon="warn" title={t('report.msg.menu')} onClose={() => setMenuFor(null)}>
        <Button label={t('report.msg.menu')} onPress={() => { const id = menuFor; setMenuFor(null); if (id && onReportMessage) onReportMessage(id); }} />
        <Button label={t('report.msg.menu.cancel')} variant="ghost" onPress={() => setMenuFor(null)} />
      </Dialog>
      <Dialog visible={confirmingUndo} icon="undo" title={t('undo.title')} body={t('undo.body')} onClose={() => setConfirmingUndo(false)}>
        <Button label={t('undo.confirm')} onPress={() => { setConfirmingUndo(false); void undo(); }} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirmingUndo(false)} />
      </Dialog>
      <Dialog visible={confirming} icon="sparkle" title={t('preview.confirm.title')} body={t('preview.confirm.body')} onClose={() => setConfirming(false)}>
        <Button label={t('preview.apply')} onPress={() => void apply()} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirming(false)} />
      </Dialog>
    </KeyboardAvoidingView>
  );
}
