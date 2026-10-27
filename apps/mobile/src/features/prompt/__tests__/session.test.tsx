import { act, fireEvent } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { renderWithI18n } from '../../../test/render';
import { PARTNER, ME, snapshotFixture } from '../../../test/fixtures';
import { lease, panelClient } from '../../../test/promptClient';
import { PromptPanel } from '../PromptPanel';
const start = Date.parse('2026-10-27T03:00:00Z');
let clock = start;
const iso = (ms: number) => new Date(ms).toISOString();
beforeEach(() => { clock = start; jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
const tick = async (ms: number) => { for (let i = 0; i < ms / 1000; i++) { clock += 1000; await act(() => { jest.advanceTimersByTime(1000); }); } };

it('keeps the partner read-only with the owner and expiry chips', async () => {
  const snapshot = snapshotFixture({ promptSession: lease(PARTNER, iso(start + 120_000)) });
  const screen = await renderWithI18n(<PromptPanel client={panelClient()} snapshot={snapshot} online clock={() => clock} onOpenConsent={jest.fn()} />);
  const partner = screen.t('report.target.partner');
  expect(screen.getByText(screen.t('prompt.partner', { name: partner }))).toBeTruthy();
  expect(screen.getByText(screen.t('prompt.expiring', { s: 120 }))).toBeTruthy();
  expect(screen.getByLabelText(screen.t('a11y.input.ro', { name: partner })).props.editable).toBe(false);
  expect(screen.getByRole('button', { name: screen.t('a11y.send') }).props.accessibilityState.disabled).toBe(true);
  expect(screen.queryByRole('button', { name: screen.t('prompt.start') })).toBeNull();
});

it('lets the partner take over after the lease expires', async () => {
  const takeover = jest.fn().mockResolvedValue(lease(ME, iso(start + 200_000)));
  const snapshot = snapshotFixture({ promptSession: lease(PARTNER, iso(start + 2000)) });
  const screen = await renderWithI18n(<PromptPanel client={panelClient({ takeover })} snapshot={snapshot} online clock={() => clock} onOpenConsent={jest.fn()} />);
  await tick(3000);
  const partner = screen.t('report.target.partner');
  expect(screen.getByText(screen.t('prompt.takeover.title', { name: partner }))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('prompt.takeover.action') }));
  expect(takeover).toHaveBeenCalledWith('space-1', 'session-1', PARTNER);
  expect(screen.getByText(screen.t('prompt.mine'))).toBeTruthy();
});

it('warns the owner 30 seconds before expiry and stops heartbeats in the background', async () => {
  const listeners: ((state: string) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => { listeners.push(listener as (state: string) => void); return { remove: jest.fn() }; });
  const heartbeat = jest.fn(async () => lease(ME, iso(clock + 180_000)));
  const acquire = jest.fn(async () => lease(ME, iso(clock + 180_000)));
  const screen = await renderWithI18n(<PromptPanel client={panelClient({ acquire, heartbeat })} snapshot={snapshotFixture()} online clock={() => clock} onOpenConsent={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('prompt.start') }));
  expect(screen.getByText(screen.t('prompt.mine'))).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText(screen.t('a11y.input')), 'cozy');
  await tick(20_000);
  expect(heartbeat).toHaveBeenCalledTimes(1);
  await act(async () => { for (const listener of listeners) listener('background'); });
  await fireEvent.changeText(screen.getByLabelText(screen.t('a11y.input')), 'cozy lamp');
  await tick(150_000);
  expect(heartbeat).toHaveBeenCalledTimes(1);
  expect(screen.getByText(screen.t('prompt.idleHint'))).toBeTruthy();
  expect(screen.getByText(screen.t('prompt.expiring', { s: 30 }))).toBeTruthy();
  await tick(31_000);
  expect(screen.getByText(screen.t('prompt.idle.me.title'))).toBeTruthy();
  expect(screen.getByLabelText(screen.t('a11y.input')).props.value).toBe('cozy lamp');
});

it('shows that the partner is generating a preview', async () => {
  const snapshot = snapshotFixture({ promptSession: lease(PARTNER, iso(start + 120_000)) });
  const conversation = { messages: [{ id: 'm1', kind: 'user_prompt' as const, authorUserId: PARTNER, bodyText: 'stars', previewId: null, state: 'queued', createdAt: iso(start) }], session: null, currentPreview: null };
  const screen = await renderWithI18n(<PromptPanel client={panelClient({}, conversation)} snapshot={snapshot} online clock={() => clock} onOpenConsent={jest.fn()} />);
  expect(await screen.findByText(screen.t('prompt.partner.thinking'))).toBeTruthy();
  expect(screen.getByText('stars')).toBeTruthy();
});
