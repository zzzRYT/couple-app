import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ME, snapshotFixture } from '../../../test/fixtures';
import { lease, panelClient, previewFixture } from '../../../test/promptClient';
import { PromptPanel } from '../PromptPanel';
import { ApiError } from '../../../lib/errors';
const owned = () => snapshotFixture({ promptSession: lease(ME, '2026-10-27T03:03:00Z') });
const clock = () => Date.parse('2026-10-27T03:00:00Z');
const withPreview = (previewId = 'preview-1') => ({ messages: [{ id: 'm1', kind: 'user_prompt' as const, authorUserId: ME, bodyText: 'cozy lamp', previewId: null, state: null, createdAt: '2026-10-27T03:00:00Z' }], session: null, currentPreview: previewFixture(previewId) });

it('submits only through the send button and keeps newline as the keyboard key', async () => {
  const client = panelClient({ requestPreview: jest.fn().mockResolvedValue(previewFixture()) });
  const screen = await renderWithI18n(<PromptPanel client={client} snapshot={owned()} online clock={clock} onOpenConsent={jest.fn()} />);
  const input = screen.getByLabelText(screen.t('a11y.input'));
  expect(input.props.multiline).toBe(true);
  expect(input.props.submitBehavior).toBe('newline');
  await fireEvent.changeText(input, 'cozy lamp');
  await fireEvent(input, 'submitEditing');
  expect(client.requestPreview).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.send') }));
  expect(client.requestPreview).toHaveBeenCalledWith('space-1', 'cozy lamp', 'session-1', 1);
});

it('applies only after the irreversible confirmation and then offers no undo', async () => {
  const client = panelClient({ confirmPreview: jest.fn().mockResolvedValue({ appliedVersion: 2 }) }, withPreview());
  const onApplied = jest.fn();
  const screen = await renderWithI18n(<PromptPanel client={client} snapshot={owned()} online clock={clock} onOpenConsent={jest.fn()} onApplied={onApplied} />);
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('a11y.apply') }));
  expect(client.confirmPreview).not.toHaveBeenCalled();
  expect(screen.getByText(screen.t('preview.confirm.body'))).toBeTruthy();
  expect(screen.t('preview.confirm.body')).toContain('되돌릴 수 없어요');
  await fireEvent.press(screen.getAllByRole('button', { name: screen.t('preview.apply') }).at(-1)!);
  expect(client.confirmPreview).toHaveBeenCalledWith('space-1', 'preview-1', 'session-1', 1);
  expect(await screen.findByText(screen.t('preview.applied.title'))).toBeTruthy();
  expect(screen.queryByRole('button', { name: screen.t('a11y.undo') })).toBeNull();
  expect(onApplied).toHaveBeenCalledWith(2);
});

it('cancels a preview and undoes within the open conversation', async () => {
  const client = panelClient({ undo: jest.fn().mockResolvedValue({ previewId: null }) }, withPreview());
  const screen = await renderWithI18n(<PromptPanel client={client} snapshot={owned()} online clock={clock} onOpenConsent={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('a11y.undo') }));
  expect(client.undo).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('undo.confirm') }));
  expect(client.undo).toHaveBeenCalledWith('space-1', 'session-1', 'preview-1');
  expect(await screen.findByText(screen.t('undo.done.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.cancel') }));
  expect(client.cancelPreview).toHaveBeenCalledWith('space-1', 'preview-1', 'session-1');
  expect(await screen.findByText(screen.t('preview.cancel.toast'))).toBeTruthy();
});

it('requires consent from both members before any request', async () => {
  const onOpenConsent = jest.fn();
  const client = panelClient();
  const screen = await renderWithI18n(<PromptPanel client={client} snapshot={snapshotFixture({ consent: 'not_given' })} online clock={clock} onOpenConsent={onOpenConsent} />);
  expect(screen.getByText(screen.t('prompt.consent.need'))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('prompt.start') }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('prompt.consent.action') }));
  expect(onOpenConsent).toHaveBeenCalled();
  expect(client.acquire).not.toHaveBeenCalled();
});

it('shows the daily limit state and blocks further requests', async () => {
  const client = panelClient({ requestPreview: jest.fn().mockRejectedValue(new ApiError(429, 'DAILY_LIMIT_REACHED')) });
  const screen = await renderWithI18n(<PromptPanel client={client} snapshot={owned()} online clock={clock} onOpenConsent={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('a11y.input')), 'stars');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.send') }));
  expect(await screen.findByText(screen.t('prompt.quota.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('prompt.quota.body'))).toBeTruthy();
  expect(screen.t('prompt.quota.body')).toMatch(/3/);
  expect(screen.getByLabelText(screen.t('a11y.input')).props.editable).toBe(false);
});

it('disables input offline without queueing anything', async () => {
  const client = panelClient();
  const screen = await renderWithI18n(<PromptPanel client={client} snapshot={owned()} online={false} clock={clock} onOpenConsent={jest.fn()} />);
  expect(screen.getByText(screen.t('prompt.offline'))).toBeTruthy();
  expect(screen.getByLabelText(screen.t('a11y.input')).props.editable).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.send') }));
  await waitFor(() => expect(client.requestPreview).not.toHaveBeenCalled());
});

it('explains unsupported requests', async () => {
  const client = panelClient({ requestPreview: jest.fn().mockRejectedValue(new ApiError(422, 'UNSUPPORTED_REQUEST')) });
  const screen = await renderWithI18n(<PromptPanel client={client} snapshot={owned()} online clock={clock} onOpenConsent={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('a11y.input')), 'change the mascot color');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.send') }));
  expect(await screen.findByText(screen.t('prompt.unsupported.title'))).toBeTruthy();
});


it('waits for a partner even when the sole member has consented', async () => {
  const client = panelClient();
  const screen = await renderWithI18n(<PromptPanel client={client} snapshot={snapshotFixture({ memberCount: 1 })} online clock={clock} onOpenConsent={jest.fn()} />);
  expect(screen.getByText(screen.t('main.invitePending.title'))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('prompt.start') }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByLabelText(screen.t('a11y.input')).props.editable).toBe(false);
  expect(client.acquire).not.toHaveBeenCalled();
});
