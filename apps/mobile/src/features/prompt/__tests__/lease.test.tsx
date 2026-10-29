import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { PARTNER, ME, snapshotFixture } from '../../../test/fixtures';
import { lease, panelClient, previewFixture } from '../../../test/promptClient';
import { PromptPanel } from '../PromptPanel';
import { ApiError } from '../../../lib/errors';
import type { Conversation } from '../../../lib/client';

const start = Date.parse('2026-10-27T03:00:00Z');
let clock = start;
const iso = (ms: number) => new Date(ms).toISOString();
beforeEach(() => { clock = start; jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
const tick = async (ms: number) => { for (let i = 0; i < ms / 1000; i++) { clock += 1000; await act(() => { jest.advanceTimersByTime(1000); }); } };
const message = (overrides: Partial<Conversation['messages'][number]> = {}) => ({ id: 'm1', kind: 'user_prompt' as const, authorUserId: ME, bodyText: 'cozy lamp', previewId: null, state: null, createdAt: iso(start), ...overrides });
const withPreview = (overrides: Partial<Conversation> = {}): Conversation => ({ messages: [message()], session: null, currentPreview: previewFixture(), ...overrides });
const panel = (client: ReturnType<typeof panelClient>, snapshot = snapshotFixture({ promptSession: lease(ME, iso(start + 180_000)) })) =>
  renderWithI18n(<PromptPanel client={client} snapshot={snapshot} online clock={() => clock} onOpenConsent={jest.fn()} />);

it('B1: takes over after losing the acquire race, using the session id the server names', async () => {
  const acquire = jest.fn().mockRejectedValue(new ApiError(409, 'SESSION_OCCUPIED', { retryable: true, sessionId: 'session-9', ownerUserId: PARTNER, expiresAt: iso(start + 5000) }));
  const takeover = jest.fn().mockResolvedValue(lease(ME, iso(start + 200_000), 'session-9'));
  const screen = await panel(panelClient({ acquire, takeover }), snapshotFixture());
  await fireEvent.press(screen.getByRole('button', { name: screen.t('prompt.start') }));
  await tick(6000);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('prompt.takeover.action') }));
  expect(takeover).toHaveBeenCalledWith('space-1', 'session-9', PARTNER);
  expect(screen.getByText(screen.t('prompt.mine'))).toBeTruthy();
});

it('B1: without a session id in the error, start lets the server pick the transition', async () => {
  const acquire = jest.fn()
    .mockRejectedValueOnce(new ApiError(409, 'SESSION_OCCUPIED', { retryable: true, ownerUserId: PARTNER, expiresAt: iso(start + 5000) }))
    .mockResolvedValueOnce(lease(ME, iso(start + 200_000), 'session-9'));
  const client = panelClient({ acquire });
  const screen = await panel(client, snapshotFixture());
  await fireEvent.press(screen.getByRole('button', { name: screen.t('prompt.start') }));
  await tick(6000);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('prompt.takeover.action') }));
  expect(client.takeover).not.toHaveBeenCalled();
  expect(acquire).toHaveBeenCalledTimes(2);
  expect(screen.getByText(screen.t('prompt.mine'))).toBeTruthy();
});

it('B2: reading an open preview keeps the lease alive and Apply stays available past 180 s', async () => {
  const heartbeat = jest.fn(async () => lease(ME, iso(clock + 180_000)));
  const screen = await panel(panelClient({ heartbeat }, withPreview()));
  expect(await screen.findByRole('button', { name: screen.t('a11y.apply') })).toBeTruthy();
  await fireEvent.press(screen.getByRole('tab', { name: screen.t('a11y.toggle.view', { state: screen.t('preview.view.current') }) }));
  await tick(181_000);
  expect(heartbeat.mock.calls.length).toBeGreaterThanOrEqual(8);
  expect(screen.getByRole('button', { name: screen.t('a11y.apply') })).toBeTruthy();
  expect(screen.queryByText(screen.t('preview.partner.wait', { name: screen.t('report.target.partner') }))).toBeNull();
});

it('B2: an expired owner sees "decorate again", never the partner-only wait copy, and start revives the same session', async () => {
  const acquire = jest.fn().mockResolvedValue(lease(ME, iso(start + 180_000)));
  const snapshot = snapshotFixture({ promptSession: { ...lease(ME, iso(start - 1000)), status: 'expired' } });
  const screen = await panel(panelClient({ acquire }, withPreview()), snapshot);
  expect(await screen.findByText(screen.t('prompt.idle.me.title'))).toBeTruthy();
  expect(screen.queryByText(screen.t('preview.partner.wait', { name: screen.t('report.target.partner') }))).toBeNull();
  expect(screen.queryByRole('button', { name: screen.t('a11y.apply') })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('prompt.idle.me.action') }));
  expect(acquire).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole('button', { name: screen.t('a11y.apply') })).toBeTruthy();
});

it('B5: a phone whose clock runs 40 s fast still waits for the server expiry before offering the takeover', async () => {
  clock = start + 40_000;
  const snapshot = snapshotFixture({ promptSession: lease(PARTNER, iso(start + 10_000)) });
  const screen = await panel(panelClient(), snapshot);
  expect(screen.getByText(screen.t('prompt.partner', { name: screen.t('report.target.partner') }))).toBeTruthy();
  expect(screen.queryByRole('button', { name: screen.t('prompt.takeover.action') })).toBeNull();
  await tick(11_000);
  expect(screen.getByRole('button', { name: screen.t('prompt.takeover.action') })).toBeTruthy();
});

it('B12: the warning point comes from the lease, not from a constant', async () => {
  const session = { ...lease(ME, iso(start + 90_000)), warnAt: iso(start + 30_000) };
  const screen = await panel(panelClient(), snapshotFixture({ promptSession: session }));
  await tick(29_000);
  expect(screen.queryByText(screen.t('prompt.expiring', { s: 61 }))).toBeNull();
  await tick(2000);
  expect(screen.getByText(screen.t('prompt.expiring', { s: 59 }))).toBeTruthy();
});

it('B4: while a request is being generated, cancel and apply are disabled', async () => {
  const conversation = withPreview({ messages: [message(), message({ id: 'm2', bodyText: 'more stars', state: 'queued' })] });
  const screen = await panel(panelClient({}, conversation));
  const cancel = await screen.findByRole('button', { name: screen.t('a11y.cancel') });
  expect(cancel.props.accessibilityState.disabled).toBe(true);
  expect(screen.getByRole('button', { name: screen.t('a11y.apply') }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByLabelText(screen.t('a11y.input')).props.editable).toBe(false);
});

it('B8: a lost response is not a failure; the panel asks the server and shows the finished preview', async () => {
  const finished = withPreview({ messages: [message({ id: 'm9', bodyText: 'stars', state: 'previewed' })] });
  const conversation = jest.fn().mockResolvedValueOnce({ messages: [], session: null, currentPreview: null }).mockResolvedValue(finished);
  const requestPreview = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
  const screen = await panel(panelClient({ requestPreview, conversation }));
  await fireEvent.changeText(screen.getByLabelText(screen.t('a11y.input')), 'stars');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.send') }));
  expect(await screen.findByRole('button', { name: screen.t('a11y.apply') })).toBeTruthy();
  expect(screen.queryByText(screen.t('prompt.fail.title'))).toBeNull();
  expect(screen.getByLabelText(screen.t('a11y.input')).props.value).toBe('');
  expect(requestPreview).toHaveBeenCalledTimes(1);
});

it('B8: keeps checking while the server is still generating, then reports a real failure', async () => {
  const queued = { messages: [message({ id: 'm9', bodyText: 'stars', state: 'queued' })], session: null, currentPreview: null };
  const failed = { messages: [message({ id: 'm9', bodyText: 'stars', state: 'failed' })], session: null, currentPreview: null };
  const conversation = jest.fn().mockResolvedValueOnce({ messages: [], session: null, currentPreview: null }).mockResolvedValueOnce(queued).mockResolvedValue(failed);
  const requestPreview = jest.fn().mockRejectedValue(new ApiError(409, 'IN_PROGRESS'));
  const screen = await panel(panelClient({ requestPreview, conversation }));
  await fireEvent.changeText(screen.getByLabelText(screen.t('a11y.input')), 'stars');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.send') }));
  await act(async () => { await jest.advanceTimersByTimeAsync(2500); });
  expect(await screen.findByText(screen.t('prompt.fail.title'))).toBeTruthy();
  expect(requestPreview).toHaveBeenCalledTimes(1);
});

it('D2: closing the sheet releases an empty lease and keeps one that holds a preview', async () => {
  const empty = panelClient();
  const first = await panel(empty);
  await first.unmount();
  expect(empty.release).toHaveBeenCalledWith('space-1', 'session-1');
  const holding = panelClient({}, withPreview());
  const second = await panel(holding);
  await second.findByRole('button', { name: second.t('a11y.apply') });
  await second.unmount();
  expect(holding.release).not.toHaveBeenCalled();
  const partnerView = panelClient();
  const third = await panel(partnerView, snapshotFixture({ promptSession: lease(PARTNER, iso(start + 100_000)) }));
  await third.unmount();
  expect(partnerView.release).not.toHaveBeenCalled();
});

it('B4: a request left queued by a crashed worker stops locking the panel after a while', async () => {
  const conversation = withPreview({ messages: [message({ id: 'm2', bodyText: 'more stars', state: 'queued' })] });
  const screen = await panel(panelClient({ heartbeat: jest.fn(async () => lease(ME, iso(clock + 180_000))) }, conversation));
  expect((await screen.findByRole('button', { name: screen.t('a11y.cancel') })).props.accessibilityState.disabled).toBe(true);
  await tick(151_000);
  expect(screen.getByRole('button', { name: screen.t('a11y.cancel') }).props.accessibilityState.disabled).toBe(false);
});
