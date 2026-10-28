import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ME, PARTNER, snapshotFixture } from '../../../test/fixtures';
import { lease, panelClient } from '../../../test/promptClient';
import { ApiError } from '../../../lib/errors';
import { createClient } from '../../../lib/client';
import { EndSpaceScreen } from '../EndSpaceScreen';
import { EndedScreen } from '../EndedScreen';
import { leaveSpace } from '../leave';
import { ReportScreen } from '../../report/ReportScreen';
import { DisconnectDialog } from '../../report/DisconnectDialog';
import { SettingsScreen } from '../../settings/SettingsScreen';
import { PromptPanel } from '../../prompt/PromptPanel';

const LOCALES = ['ko-KR', 'en-US', 'ja-JP'] as const;
const resource = (locale: string) => JSON.parse(readFileSync(resolve(__dirname, '../../../i18n/locales', `${locale}.json`), 'utf8')) as Record<string, string>;
// Nothing about a retention period or restoring may reach the person (the server keeps its own schedule).
const RETENTION = { 'ko-KR': /복구|복원|30일|일간|며칠|남은/, 'en-US': /restor|recover|\b30\b|\bdays\b|days left/i, 'ja-JP': /復元|復旧|30日|日間|残り/ } as const;

it('keeps retention periods and restore wording out of the end, disconnect and settings copy in every language', () => {
  for (const locale of LOCALES) {
    const entries = Object.entries(resource(locale)).filter(([key]) => /^(end\.|set\.end|report\.block)/.test(key));
    expect(entries.length).toBeGreaterThan(20);
    for (const [key, value] of entries) expect({ key, hit: RETENTION[locale].test(value) }).toEqual({ key, hit: false });
  }
});

const ended = (overrides = {}) => ({ kind: 'ended' as const, by: 'me' as const, at: '2026-10-29T00:00:00Z', ...overrides });
const noop = () => Promise.resolve();

describe('end space confirmation', () => {
  it('states the consequences without a period and enables the button only after the checkmark', async () => {
    const onEnd = jest.fn().mockResolvedValue(undefined);
    const screen = await renderWithI18n(<EndSpaceScreen onEnd={onEnd} onCancel={jest.fn()} />);
    for (const key of ['end.title', 'end.body', 'end.b1', 'end.b2', 'end.b3']) expect(screen.getByText(new RegExp(screen.t(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeTruthy();
    const button = screen.getByRole('button', { name: screen.t('end.confirm') });
    await fireEvent.press(button);
    expect(onEnd).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('checkbox', { name: screen.t('end.check') }));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('end.confirm') }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('shows the failure and lets the person try again without losing the checkmark', async () => {
    const onEnd = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined);
    const screen = await renderWithI18n(<EndSpaceScreen onEnd={onEnd} onCancel={jest.fn()} />);
    await fireEvent.press(screen.getByRole('checkbox', { name: screen.t('end.check') }));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('end.confirm') }));
    expect(await screen.findByText(screen.t('end.err.title'))).toBeTruthy();
    expect(screen.getByText(screen.t('end.err.body'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('common.retry') }));
    await waitFor(() => expect(onEnd).toHaveBeenCalledTimes(2));
  });

  it('can be cancelled', async () => {
    const onCancel = jest.fn();
    const screen = await renderWithI18n(<EndSpaceScreen onEnd={noop} onCancel={onCancel} />);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('end.cancel') }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('ended notice', () => {
  it.each([
    [ended(), 'end.done.title'],
    [ended({ by: 'partner' }), 'end.byPartner'],
    [ended({ by: 'partner', kind: 'disconnect' }), 'end.byPartnerDisconnect'],
    [ended({ by: 'partner', kind: 'account_deleted' }), 'end.byPartnerDeleted'],
  ])('shows the right headline and the shared body for %j', async (notice, titleKey) => {
    const screen = await renderWithI18n(<EndedScreen ended={notice} hasActiveSpace={false} partnerName="상대" onContinue={noop} />);
    expect(screen.getByText(screen.t(titleKey, { name: '상대' }))).toBeTruthy();
    expect(screen.getByText(screen.t('end.done.body'))).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: screen.t('end.newSpace') })).toBeTruthy();
  });

  it('never names the person who deleted their account', async () => {
    const screen = await renderWithI18n(<EndedScreen ended={ended({ by: 'partner', kind: 'account_deleted' })} hasActiveSpace={false} partnerName="상대" onContinue={noop} />);
    expect(screen.queryByText(/상대님/)).toBeNull();
  });

  it('acknowledges through the continue action and reports a failure', async () => {
    const onContinue = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const screen = await renderWithI18n(<EndedScreen ended={ended()} hasActiveSpace={false} partnerName="상대" onContinue={onContinue} />);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('end.newSpace') }));
    expect(await screen.findByText(screen.t('sys.server.title'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('end.newSpace') }));
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(2));
  });

  it('only asks for an OK when a new space is already open', async () => {
    const screen = await renderWithI18n(<EndedScreen ended={ended({ by: 'partner' })} hasActiveSpace partnerName="상대" onContinue={noop} />);
    expect(screen.queryByRole('button', { name: screen.t('end.newSpace') })).toBeNull();
    expect(screen.getByRole('button', { name: screen.t('common.confirm') })).toBeTruthy();
  });
});

describe('disconnect confirmation', () => {
  it('tells the consequences before anything happens and only then disconnects', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const screen = await renderWithI18n(<DisconnectDialog visible partnerName="상대" onConfirm={onConfirm} onClose={jest.fn()} />);
    expect(screen.getByText(screen.t('report.block.title', { name: '상대' }))).toBeTruthy();
    expect(screen.getByText('연결을 끊으면 상대님은 이 공간의 방과 대화를 볼 수 없고, 이 공간이 종료돼요. 함께 쓰던 데이터는 삭제돼요.')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.block.confirm') }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open with an error when disconnecting fails', async () => {
    const screen = await renderWithI18n(<DisconnectDialog visible partnerName="상대" onConfirm={jest.fn().mockRejectedValue(new Error('x'))} onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.block.confirm') }));
    expect(await screen.findByText(screen.t('end.err.title'))).toBeTruthy();
  });
});

describe('report flow', () => {
  const choose = async (screen: Awaited<ReturnType<typeof renderWithI18n>>, target = 'report.target.partner', reason = 'report.reason.harass') => {
    await fireEvent.press(screen.getByRole('radio', { name: screen.t(target) }));
    await fireEvent.press(screen.getByRole('radio', { name: screen.t(reason) }));
  };
  const props = (overrides = {}) => ({ partnerName: '상대', onSubmit: jest.fn().mockResolvedValue(undefined), onDisconnect: jest.fn().mockResolvedValue(undefined), onDone: jest.fn(), ...overrides });

  it('offers partner, shared text and room scene only; there is no photo target', async () => {
    const screen = await renderWithI18n(<ReportScreen {...props()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(7);
    for (const key of ['report.target.partner', 'report.target.text', 'report.target.scene', 'report.reason.harass', 'report.reason.inappropriate', 'report.reason.privacy', 'report.reason.other']) expect(screen.getByRole('radio', { name: screen.t(key) })).toBeTruthy();
    expect(screen.queryByText(/사진/)).toBeNull();
  });

  it('sends target, reason and the optional note, then shows the confirmation without any result promise', async () => {
    const p = props();
    const screen = await renderWithI18n(<ReportScreen {...p} />);
    expect(screen.getByRole('button', { name: screen.t('report.submit') }).props.accessibilityState.disabled).toBe(true);
    await choose(screen, 'report.target.scene', 'report.reason.privacy');
    await fireEvent.changeText(screen.getByLabelText(screen.t('report.detail')), '  자세히  ');
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.submit') }));
    await waitFor(() => expect(p.onSubmit).toHaveBeenCalledWith({ target: 'room_scene', reason: 'privacy', detail: '자세히' }));
    expect(await screen.findByText(screen.t('report.done.title'))).toBeTruthy();
    expect(screen.getByText(screen.t('report.done.body'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('common.done') }));
    expect(p.onDone).toHaveBeenCalled();
  });

  it('keeps what was typed when sending fails, and shows the daily limit message', async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error('x')).mockRejectedValueOnce(new ApiError(429, 'REPORT_RATE_LIMITED')).mockResolvedValue(undefined);
    const screen = await renderWithI18n(<ReportScreen {...props({ onSubmit })} />);
    await choose(screen);
    await fireEvent.changeText(screen.getByLabelText(screen.t('report.detail')), '내용');
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.submit') }));
    expect(await screen.findByText(screen.t('report.fail.title'))).toBeTruthy();
    expect(screen.getByText(screen.t('report.fail.body'))).toBeTruthy();
    expect(screen.getByDisplayValue('내용')).toBeTruthy();
    expect(screen.getByRole('radio', { name: screen.t('report.reason.harass') }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.submit') }));
    expect(await screen.findByText(screen.t('report.obj.limit'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.submit') }));
    expect(await screen.findByText(screen.t('report.done.title'))).toBeTruthy();
  });

  it('passes the message id for a reported message and starts on shared text', async () => {
    const p = props({ initialTarget: 'shared_text', messageId: 'msg-1' });
    const screen = await renderWithI18n(<ReportScreen {...p} />);
    await fireEvent.press(screen.getByRole('radio', { name: screen.t('report.reason.other') }));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.submit') }));
    await waitFor(() => expect(p.onSubmit).toHaveBeenCalledWith({ target: 'shared_text', reason: 'other', messageId: 'msg-1' }));
  });

  it('keeps disconnecting separate: it asks first, never sends a report, and is not needed to report', async () => {
    const p = props();
    const screen = await renderWithI18n(<ReportScreen {...p} />);
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.block', { name: '상대' }) }));
    expect(screen.getByText(screen.t('report.block.body', { name: '상대' }))).toBeTruthy();
    expect(p.onDisconnect).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('report.block.confirm') }));
    await waitFor(() => expect(p.onDisconnect).toHaveBeenCalledTimes(1));
    expect(p.onSubmit).not.toHaveBeenCalled();
  });
});

describe('leaving a space', () => {
  const deps = (overrides = {}) => ({
    close: jest.fn().mockResolvedValue({ status: 'ended' }), releaseSession: jest.fn().mockResolvedValue(undefined),
    snapshot: snapshotFixture(), userId: ME, resetSpace: jest.fn(), reload: jest.fn().mockResolvedValue(undefined), ...overrides,
  });

  it('releases a lease this person holds, closes the space, then clears caches and re-reads the entry state', async () => {
    const d = deps({ snapshot: snapshotFixture({ promptSession: lease(ME, '2026-10-27T03:03:00Z') }) });
    await leaveSpace(d);
    expect(d.releaseSession).toHaveBeenCalledWith('space-1', 'session-1');
    expect(d.close).toHaveBeenCalledWith('space-1');
    const order = [d.releaseSession, d.close, d.resetSpace, d.reload].map((fn) => fn.mock.invocationCallOrder[0]!);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("leaves the partner's lease alone and still closes the space when the release fails", async () => {
    const theirs = deps({ snapshot: snapshotFixture({ promptSession: lease(PARTNER, '2026-10-27T03:03:00Z') }) });
    await leaveSpace(theirs);
    expect(theirs.releaseSession).not.toHaveBeenCalled();
    const flaky = deps({ snapshot: snapshotFixture({ promptSession: lease(ME, '2026-10-27T03:03:00Z') }), releaseSession: jest.fn().mockRejectedValue(new Error('offline')) });
    await leaveSpace(flaky);
    expect(flaky.close).toHaveBeenCalled();
  });

  it('treats 404 as "already ended" and moves on, but keeps caches when the call really fails', async () => {
    const gone = deps({ close: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND')) });
    await leaveSpace(gone);
    expect(gone.resetSpace).toHaveBeenCalled();
    expect(gone.reload).toHaveBeenCalled();
    const down = deps({ close: jest.fn().mockRejectedValue(new ApiError(503, 'SERVER_ERROR')) });
    await expect(leaveSpace(down)).rejects.toThrow('SERVER_ERROR');
    expect(down.resetSpace).not.toHaveBeenCalled();
  });
});

describe('settings entries', () => {
  it('opens contact/reports and end space from their own rows, with the help text and no period', async () => {
    const onOpenReport = jest.fn(), onOpenEndSpace = jest.fn();
    const screen = await renderWithI18n(<SettingsScreen onLogout={noop} onOpenReport={onOpenReport} onOpenEndSpace={onOpenEndSpace} />);
    expect(screen.getByText(screen.t('set.end.help'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.support') }));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('set.end') }));
    expect(onOpenReport).toHaveBeenCalledTimes(1);
    expect(onOpenEndSpace).toHaveBeenCalledTimes(1);
  });
});

describe('message report menu', () => {
  const conversation = { messages: [
    { id: 'm-mine', kind: 'user_prompt' as const, authorUserId: ME, bodyText: 'mine', previewId: null, state: null, createdAt: '2026-10-27T03:00:00Z' },
    { id: 'm-theirs', kind: 'user_prompt' as const, authorUserId: PARTNER, bodyText: 'theirs', previewId: null, state: null, createdAt: '2026-10-27T03:00:01Z' },
  ], session: null, currentPreview: null };

  it("offers 'report this message' only for the partner's messages and hands the id over", async () => {
    const onReportMessage = jest.fn();
    const screen = await renderWithI18n(<PromptPanel client={panelClient({}, conversation)} snapshot={snapshotFixture()} online onOpenConsent={jest.fn()} onReportMessage={onReportMessage} />);
    const menus = await screen.findAllByLabelText(screen.t('report.msg.menu'));
    expect(menus).toHaveLength(1);
    await fireEvent.press(menus[0]!);
    await fireEvent.press(screen.getAllByRole('button', { name: screen.t('report.msg.menu') }).at(-1)!);
    expect(onReportMessage).toHaveBeenCalledWith('m-theirs');
  });

  it('shows no menu when the host gives no report handler', async () => {
    const screen = await renderWithI18n(<PromptPanel client={panelClient({}, conversation)} snapshot={snapshotFixture()} online onOpenConsent={jest.fn()} />);
    await screen.findByText('theirs');
    expect(screen.queryByLabelText(screen.t('report.msg.menu'))).toBeNull();
  });
});

describe('client calls', () => {
  it('uses the contract endpoints; disconnect keeps the name block', async () => {
    const api = { json: jest.fn().mockResolvedValue({}) };
    const client = createClient(api as never);
    await client.endSpace('s1');
    await client.disconnect('s1');
    await client.ackEnded();
    await client.submitReport('s1', { target: 'partner', reason: 'other' });
    expect(api.json.mock.calls).toEqual([
      ['spaces/spaces/s1/end', { method: 'POST', body: { confirm: true } }],
      ['spaces/spaces/s1/block', { method: 'POST', body: { confirm: true } }],
      ['spaces/spaces/mine/ended/ack', { method: 'POST', body: {} }],
      ['reports/spaces/s1/reports', { method: 'POST', body: { target: 'partner', reason: 'other' } }],
    ]);
  });
});
