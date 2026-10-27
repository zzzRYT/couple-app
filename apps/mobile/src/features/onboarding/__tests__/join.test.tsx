import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { JoinScreen, maskInviteInput } from '../JoinScreen';
import { ApiError } from '../../../lib/errors';
async function setup(previewInvitation: jest.Mock, acceptInvitation = jest.fn().mockResolvedValue({ spaceId: 's1', memberCount: 2 })) {
  const onJoined = jest.fn(); const onOpenSpace = jest.fn();
  const screen = await renderWithI18n(<JoinScreen previewInvitation={previewInvitation} acceptInvitation={acceptInvitation} onJoined={onJoined} onOpenSpace={onOpenSpace} />);
  const input = () => screen.getByLabelText(screen.t('join.title'));
  const check = () => fireEvent.press(screen.getByRole('button', { name: screen.t('join.check') }));
  return { screen, input, check, onJoined, onOpenSpace, acceptInvitation };
}

it('masks input as 4-4 and ignores case, spaces and hyphens', () => {
  expect(maskInviteInput('k7m4 q9xp')).toBe('K7M4-Q9XP');
  expect(maskInviteInput('K7M4-Q9XP-EXTRA')).toBe('K7M4-Q9XP');
  expect(maskInviteInput('k7')).toBe('K7');
});

it('confirms the space and accepts the invitation', async () => {
  const preview = jest.fn().mockResolvedValue({ anniversaryDate: '2025-06-29', memberCount: 1 });
  const { screen, input, check, onJoined, acceptInvitation } = await setup(preview);
  await fireEvent.changeText(input(), 'k7m4q9xp');
  await check();
  expect(preview).toHaveBeenCalledWith('K7M4Q9XP');
  expect(await screen.findByText(screen.t('join.found.heading'))).toBeTruthy();
  expect(screen.getByText(screen.t('join.found.body', { date: '2025년 6월 29일' }))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.accept') }));
  expect(acceptInvitation).toHaveBeenCalledWith('K7M4Q9XP');
  expect(await screen.findByText(screen.t('join.ok.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.ok.next') }));
  expect(onJoined).toHaveBeenCalledWith('s1');
});

it.each([
  ['INVITE_EXPIRED', 410, 'join.expired.title'], ['INVITE_USED', 409, 'join.used.title'], ['INVITE_INVALID', 404, 'join.invalid.title'],
  ['SPACE_FULL', 409, 'join.full.title'], ['ALREADY_IN_SPACE', 409, 'join.hasSpace.title'],
])('maps %s to its message', async (code, status, key) => {
  const { screen, input, check } = await setup(jest.fn().mockRejectedValue(new ApiError(status, code)));
  await fireEvent.changeText(input(), 'AAAABBBB');
  await check();
  expect(await screen.findByText(screen.t(key))).toBeTruthy();
});

it('keeps the typed code and offers the current space on ALREADY_IN_SPACE at accept time', async () => {
  const preview = jest.fn().mockResolvedValue({ anniversaryDate: '2025-06-29', memberCount: 1 });
  const { screen, input, check, onOpenSpace } = await setup(preview, jest.fn().mockRejectedValue(new ApiError(409, 'ALREADY_IN_SPACE')));
  await fireEvent.changeText(input(), 'AAAABBBB');
  await check();
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('join.accept') }));
  expect(await screen.findByText(screen.t('join.hasSpace.title'))).toBeTruthy();
  expect(input().props.value).toBe('AAAA-BBBB');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.hasSpace.action') }));
  expect(onOpenSpace).toHaveBeenCalled();
});

it('reports too many attempts and network errors', async () => {
  const preview = jest.fn().mockRejectedValueOnce(new ApiError(429, 'RATE_LIMITED', { retryAfterSeconds: 600 })).mockRejectedValueOnce(new TypeError('Network request failed'));
  const { screen, input, check } = await setup(preview);
  await fireEvent.changeText(input(), 'AAAABBBB');
  await check();
  expect(await screen.findByText(screen.t('login.code.rate', { m: 10 }))).toBeTruthy();
  await check();
  expect(await screen.findByText(screen.t('join.err'))).toBeTruthy();
});
