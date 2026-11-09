import { act, fireEvent } from '@testing-library/react-native';
import { Share } from 'react-native';
import { renderWithI18n } from '../../../test/render';
import { InviteScreen, formatInviteCode } from '../InviteScreen';
const start = Date.parse('2026-10-27T03:00:00Z');
let clock = start;
beforeEach(() => { clock = start; jest.useFakeTimers(); });
afterEach(() => jest.useRealTimers());
const codeLabel = (t: (key: string, options?: Record<string, unknown>) => string, code: string) => t('a11y.code', { code: code.split('').join(' ') });
const invitation = (code: string, hours = 24) => ({ invitationId: code, code, expiresAt: new Date(clock + hours * 3_600_000).toISOString() });

it('V0-F02-AC-05 keeps the freshly created code when the parent refreshes its snapshot', async () => {
  const created = invitation('AAAABBBB');
  const createInvitation = jest.fn().mockResolvedValue(created);
  const refresh = jest.fn();
  const now = () => clock;
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={now} reducedMotion onInvitationCreated={refresh} />);
  expect(await screen.findByLabelText(codeLabel(screen.t, 'AAAA-BBBB'))).toBeTruthy();
  expect(refresh).toHaveBeenCalledTimes(1);
  await screen.rerender(<InviteScreen createInvitation={createInvitation} clock={now} reducedMotion onInvitationCreated={refresh} existingInvitationExpiresAt={created.expiresAt} />);
  expect(screen.getByLabelText(codeLabel(screen.t, 'AAAA-BBBB'))).toBeTruthy();
  expect(createInvitation).toHaveBeenCalledTimes(1);
});

it('formats codes as 4-4 and shows the remaining time', async () => {
  expect(formatInviteCode('k7m4q9xp')).toBe('K7M4-Q9XP');
  const createInvitation = jest.fn().mockResolvedValue(invitation('K7M4Q9XP'));
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion />);
  expect(await screen.findByLabelText(codeLabel(screen.t, 'K7M4-Q9XP'))).toBeTruthy();
  expect(screen.getByText(screen.t('invite.expires', { h: 24, m: 0 }))).toBeTruthy();
});

it('moves from expiring soon to expired and reissues a new code after confirmation', async () => {
  const createInvitation = jest.fn().mockResolvedValueOnce(invitation('AAAABBBB', 0.5)).mockResolvedValueOnce(invitation('CCCCDDDD'));
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion />);
  expect(await screen.findByText(screen.t('invite.expiring', { m: 30 }))).toBeTruthy();
  clock += 31 * 60_000;
  await act(() => { jest.advanceTimersByTime(30_000); });
  expect(screen.getByText(screen.t('invite.expired.title'))).toBeTruthy();
  expect(screen.queryByLabelText(codeLabel(screen.t, 'AAAA-BBBB'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('invite.reissue') }));
  expect(screen.getByText(screen.t('invite.reissue.body'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.confirm') }));
  expect(await screen.findByLabelText(codeLabel(screen.t, 'CCCC-DDDD'))).toBeTruthy();
  expect(createInvitation).toHaveBeenCalledTimes(2);
});

it('asks before replacing a live code', async () => {
  const createInvitation = jest.fn().mockResolvedValueOnce(invitation('AAAABBBB')).mockResolvedValueOnce(invitation('CCCCDDDD'));
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion />);
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('invite.reissue') }));
  expect(screen.getByText(screen.t('invite.reissue.body'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.confirm') }));
  expect(await screen.findByLabelText(codeLabel(screen.t, 'CCCC-DDDD'))).toBeTruthy();
});

it('does not reveal or reissue an existing valid invite when the screen is reopened', async () => {
  const createInvitation = jest.fn().mockResolvedValue(invitation('CCCCDDDD'));
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion existingInvitationExpiresAt={new Date(clock + 60 * 60_000).toISOString()} />);
  expect(await screen.findByText(screen.t('invite.waiting.title'))).toBeTruthy();
  expect(createInvitation).not.toHaveBeenCalled();
  expect(screen.queryByLabelText(codeLabel(screen.t, 'CCCC-DDDD'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('invite.reissue') }));
  expect(createInvitation).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.confirm') }));
  expect(await screen.findByLabelText(codeLabel(screen.t, 'CCCC-DDDD'))).toBeTruthy();
  expect(createInvitation).toHaveBeenCalledTimes(1);
});

it('retains a confirmed reissue through refresh but not after leaving and reopening', async () => {
  const old = invitation('AAAABBBB', 1);
  const replacement = invitation('CCCCDDDD');
  const createInvitation = jest.fn().mockResolvedValue(replacement);
  const refresh = jest.fn();
  const now = () => clock;
  const props = { createInvitation, clock: now, reducedMotion: true, onInvitationCreated: refresh };
  const screen = await renderWithI18n(<InviteScreen {...props} existingInvitationExpiresAt={old.expiresAt} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('invite.reissue') }));
  expect(createInvitation).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.confirm') }));
  expect(await screen.findByLabelText(codeLabel(screen.t, 'CCCC-DDDD'))).toBeTruthy();
  await screen.rerender(<InviteScreen {...props} existingInvitationExpiresAt={replacement.expiresAt} />);
  expect(screen.getByLabelText(codeLabel(screen.t, 'CCCC-DDDD'))).toBeTruthy();
  await screen.unmount();
  const reopened = await renderWithI18n(<InviteScreen {...props} existingInvitationExpiresAt={replacement.expiresAt} />);
  expect(reopened.getByText(reopened.t('invite.waiting.title'))).toBeTruthy();
  expect(reopened.queryByLabelText(codeLabel(reopened.t, 'CCCC-DDDD'))).toBeNull();
  expect(createInvitation).toHaveBeenCalledTimes(1);
});

it('reports share cancellation and network errors', async () => {
  const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction, activityType: undefined });
  const createInvitation = jest.fn().mockRejectedValueOnce(new TypeError('Network request failed')).mockResolvedValueOnce(invitation('EEEEFFFF'));
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion />);
  expect(await screen.findByText(screen.t('invite.err.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.retry') }));
  expect(await screen.findByLabelText(codeLabel(screen.t, 'EEEE-FFFF'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.share') }));
  expect(share).toHaveBeenCalledWith({ message: screen.t('invite.shareMsg', { code: 'EEEE-FFFF', link: 'https://aroom.jinjinstar.com/i/EEEE-FFFF' }) });
  expect(await screen.findByText(screen.t('invite.shareCancelled'))).toBeTruthy();
});

it('waits for the partner after sharing, returns to the code, and leaves when the partner has joined', async () => {
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
  const onJoined = jest.fn();
  const onLater = jest.fn();
  const createInvitation = jest.fn().mockResolvedValue(invitation('GGGGHHHH'));
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion memberCount={1} onJoined={onJoined} onLater={onLater} />);
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('a11y.share') }));
  expect(await screen.findByText(screen.t('invite.waiting.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('invite.code.label') }));
  expect(screen.getByLabelText(codeLabel(screen.t, 'GGGG-HHHH'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('a11y.share') }));
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('common.next') }));
  expect(onLater).toHaveBeenCalled();
  await screen.rerender(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion memberCount={2} onJoined={onJoined} />);
  expect(onJoined).toHaveBeenCalled();
});


it('copies the displayed invitation code', async () => {
  const copyCode = jest.fn().mockResolvedValue(true);
  const screen = await renderWithI18n(<InviteScreen createInvitation={jest.fn().mockResolvedValue(invitation('AAAABBBB'))} clock={() => clock} reducedMotion copyCode={copyCode} />);
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('a11y.copy') }));
  expect(copyCode).toHaveBeenCalledWith('AAAA-BBBB');
  expect(await screen.findByText(screen.t('invite.copied'))).toBeTruthy();
});

it('V0-F02-AC-05 leaves for the home waiting state through "wait at home" and keeps the code on screen until then', async () => {
  const onLater = jest.fn();
  const screen = await renderWithI18n(<InviteScreen createInvitation={jest.fn().mockResolvedValue(invitation('AAAABBBB'))} clock={() => clock} reducedMotion onLater={onLater} />);
  expect(await screen.findByLabelText(codeLabel(screen.t, 'AAAA-BBBB'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('start.invite.home') }));
  expect(onLater).toHaveBeenCalledTimes(1);
});

it('V0-start-invite says the code also stays on Home', async () => {
  const screen = await renderWithI18n(<InviteScreen createInvitation={jest.fn().mockResolvedValue(invitation('AAAABBBB'))} clock={() => clock} reducedMotion />);
  expect(await screen.findByLabelText(codeLabel(screen.t, 'AAAA-BBBB'))).toBeTruthy();
  expect(screen.getByText(screen.t('start.invite.hint'))).toBeTruthy();
});

it('V0-10 shows the live code this device made again when the invite is reopened', async () => {
  const createInvitation = jest.fn();
  const live = invitation('AAAABBBB', 2);
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion copyCode={jest.fn()} existingInvitation={live} existingInvitationExpiresAt={live.expiresAt} />);
  expect(screen.getByLabelText(codeLabel(screen.t, 'AAAA-BBBB'))).toBeTruthy();
  expect(screen.getByText(screen.t('invite.expires', { h: 2, m: 0 }))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('a11y.share') })).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('a11y.copy') })).toBeTruthy();
  expect(screen.queryByText(screen.t('invite.waiting.title'))).toBeNull();
  expect(createInvitation).not.toHaveBeenCalled();
});

it('makes a new code straight away when opened to reissue an expired one', async () => {
  const createInvitation = jest.fn().mockResolvedValue(invitation('CCCCDDDD'));
  const old = invitation('AAAABBBB', -1);
  const screen = await renderWithI18n(<InviteScreen createInvitation={createInvitation} clock={() => clock} reducedMotion reissue existingInvitation={old} existingInvitationExpiresAt={old.expiresAt} />);
  expect(await screen.findByLabelText(codeLabel(screen.t, 'CCCC-DDDD'))).toBeTruthy();
  expect(createInvitation).toHaveBeenCalledTimes(1);
});
