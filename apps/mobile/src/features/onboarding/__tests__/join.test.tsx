import { act, fireEvent } from '@testing-library/react-native';
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

it('V0-F02-AC-06 and V0-F02-AC-07 confirm the space, then accept the invitation', async () => {
  const preview = jest.fn().mockResolvedValue({ anniversaryDate: '2025-06-29', memberCount: 1, displayName: '하루', timeZone: 'Asia/Seoul' });
  const { screen, input, check, onJoined, acceptInvitation } = await setup(preview);
  await fireEvent.changeText(input(), 'k7m4q9xp');
  await check();
  expect(preview).toHaveBeenCalledWith('K7M4Q9XP');
  expect(await screen.findByText(screen.t('join.found.heading'))).toBeTruthy();
  expect(screen.getByText(screen.t('join.found.who', { name: '하루' }))).toBeTruthy();
  expect(screen.getByText(/사귄 날은 2025년 6월 29일/)).toBeTruthy();
  expect(screen.getByLabelText(screen.t('mascot.alt.wave'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.accept') }));
  expect(acceptInvitation).toHaveBeenCalledWith('K7M4Q9XP');
  expect(onJoined).toHaveBeenCalledWith('s1');
});

it.each([
  ['INVITE_EXPIRED', 410, 'join.expired.title'], ['INVITE_USED', 409, 'join.used.title'], ['INVITE_INVALID', 404, 'join.invalid.title'],
  ['SPACE_FULL', 409, 'join.full.title'], ['ALREADY_IN_SPACE', 409, 'join.hasSpace.title'],
])('V0-F02-AC-06 maps %s to its message', async (code, status, key) => {
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


it('pastes and formats a code from the clipboard', async () => {
  const preview = jest.fn().mockResolvedValue({ anniversaryDate: '2025-06-29' });
  const screen = await renderWithI18n(<JoinScreen previewInvitation={preview} acceptInvitation={jest.fn()} onJoined={jest.fn()} onOpenSpace={jest.fn()} readClipboard={async () => 'k7m4 q9xp'} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.paste') }));
  expect(screen.getByLabelText(screen.t('join.title')).props.value).toBe('K7M4-Q9XP');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.check') }));
  expect(preview).toHaveBeenCalledWith('K7M4Q9XP');
});

it('checks a linked code automatically and shows confirmation', async () => {
  const preview = jest.fn().mockResolvedValue({ anniversaryDate: '2025-06-29' });
  const screen = await renderWithI18n(<JoinScreen previewInvitation={preview} acceptInvitation={jest.fn()} onJoined={jest.fn()} onOpenSpace={jest.fn()} initialCode="AB12CD34" />);
  expect(await screen.findByText(screen.t('join.found.heading'))).toBeTruthy();
  expect(preview).toHaveBeenCalledWith('AB12CD34');
  expect(preview).toHaveBeenCalledTimes(1);
});
it('shows the one-space message without checking an incoming code', async () => {
  const preview = jest.fn();
  const screen = await renderWithI18n(<JoinScreen previewInvitation={preview} acceptInvitation={jest.fn()} onJoined={jest.fn()} onOpenSpace={jest.fn()} initialCode="AB12CD34" alreadyInSpace />);
  expect(screen.getByText(screen.t('join.hasSpace.title'))).toBeTruthy();
  expect(preview).not.toHaveBeenCalled();
});
it('pastes an invite link as a code', async () => {
  const screen = await renderWithI18n(<JoinScreen previewInvitation={jest.fn()} acceptInvitation={jest.fn()} onJoined={jest.fn()} onOpenSpace={jest.fn()} readClipboard={async () => 'https://aroom.jinjinstar.com/i/AB12-CD34'} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.paste') }));
  expect(screen.getByLabelText(screen.t('join.title')).props.value).toBe('AB12-CD34');
});


it('does not offer back while accepting or after the server has joined the space', async () => {
  let finish: (value: { spaceId: string }) => void = () => {};
  const accept = jest.fn(() => new Promise<{ spaceId: string }>((resolve) => { finish = resolve; }));
  const onJoined = jest.fn();
  const screen = await renderWithI18n(<JoinScreen previewInvitation={jest.fn().mockResolvedValue({ anniversaryDate: '2025-06-29' })} acceptInvitation={accept} onJoined={onJoined} onOpenSpace={jest.fn()} onBack={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('join.title')), 'AAAABBBB');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.check') }));
  expect(screen.getByTestId('screen-back')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.accept') }));
  expect(screen.queryByTestId('screen-back')).toBeNull();
  await act(async () => { finish({ spaceId: 's1' }); });
  expect(onJoined).toHaveBeenCalledWith('s1');
  expect(screen.queryByTestId('screen-back')).toBeNull();
});

it('V0-F02-AC-07 "do not join" returns to code entry', async () => {
  const preview = jest.fn().mockResolvedValue({ anniversaryDate: '2025-06-29', memberCount: 1, displayName: '하루', timeZone: 'Asia/Seoul' });
  const { screen, input, check, acceptInvitation } = await setup(preview);
  await fireEvent.changeText(input(), 'k7m4q9xp');
  await check();
  await fireEvent.press(await screen.findByRole('button', { name: screen.t('join.decline') }));
  expect(screen.getByRole('button', { name: screen.t('join.check') })).toBeTruthy();
  expect(acceptInvitation).not.toHaveBeenCalled();
});

describe('V0-F02-AC-12 entering a code while holding a space alone (V0-10)', () => {
  async function inApp(previewInvitation: jest.Mock, moveFromSpace = jest.fn().mockResolvedValue(undefined), ownCode: string | null = 'ZZZZ-9999') {
    const screen = await renderWithI18n(<JoinScreen previewInvitation={previewInvitation} acceptInvitation={jest.fn()} onJoined={jest.fn()} onOpenSpace={jest.fn()} moveFromSpace={moveFromSpace} ownCode={ownCode} />);
    const enter = async (code: string) => {
      await fireEvent.changeText(screen.getByLabelText(screen.t('connect.code.title')), code);
      await fireEvent.press(screen.getByRole('button', { name: screen.t('join.check') }));
    };
    return { screen, enter, moveFromSpace };
  }

  it('asks to move when the valid code meets ALREADY_IN_SPACE, then moves with that code', async () => {
    const { screen, enter, moveFromSpace } = await inApp(jest.fn().mockRejectedValue(new ApiError(409, 'ALREADY_IN_SPACE')));
    expect(screen.getByText(screen.t('connect.code.body'))).toBeTruthy();
    await enter('k7m4q9xp');
    expect(await screen.findByText(screen.t('connect.move.title'))).toBeTruthy();
    for (const key of ['connect.move.i1', 'connect.move.i2', 'connect.move.i3']) expect(screen.getByText(`• ${screen.t(key)}`)).toBeTruthy();
    expect(moveFromSpace).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('connect.move.submit') }));
    expect(moveFromSpace).toHaveBeenCalledWith('K7M4Q9XP');
  });

  it('cancel goes back to the code with nothing ended, and a failed end shows the network error', async () => {
    const { screen, enter, moveFromSpace } = await inApp(jest.fn().mockRejectedValue(new ApiError(409, 'ALREADY_IN_SPACE')), jest.fn().mockRejectedValue(new TypeError('Network request failed')));
    await enter('K7M4Q9XP');
    await fireEvent.press(await screen.findByRole('button', { name: screen.t('common.cancel') }));
    expect(screen.getByLabelText(screen.t('connect.code.title')).props.value).toBe('K7M4-Q9XP');
    expect(moveFromSpace).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('join.check') }));
    await fireEvent.press(await screen.findByRole('button', { name: screen.t('connect.move.submit') }));
    expect(await screen.findByText(screen.t('join.err'))).toBeTruthy();
  });

  it('keeps S05 errors for expired, used, wrong and full codes instead of asking to move', async () => {
    const { screen, enter } = await inApp(jest.fn().mockRejectedValue(new ApiError(410, 'INVITE_EXPIRED')));
    await enter('K7M4Q9XP');
    expect(await screen.findByText(screen.t('join.expired.title'))).toBeTruthy();
    expect(screen.queryByText(screen.t('connect.move.title'))).toBeNull();
  });

  it('refuses this device\'s own code without asking the server or ending anything (V0-connect-own)', async () => {
    const preview = jest.fn();
    const { screen, enter, moveFromSpace } = await inApp(preview);
    await enter('zzzz9999');
    expect(await screen.findByText(screen.t('connect.err.own'))).toBeTruthy();
    expect(preview).not.toHaveBeenCalled();
    expect(moveFromSpace).not.toHaveBeenCalled();
  });

  it('an invite link opened with a space alone checks the code and asks to move', async () => {
    const preview = jest.fn().mockRejectedValue(new ApiError(409, 'ALREADY_IN_SPACE'));
    const screen = await renderWithI18n(<JoinScreen initialCode="K7M4Q9XP" previewInvitation={preview} acceptInvitation={jest.fn()} onJoined={jest.fn()} onOpenSpace={jest.fn()} moveFromSpace={jest.fn()} ownCode={null} />);
    expect(await screen.findByText(screen.t('connect.move.title'))).toBeTruthy();
    expect(preview).toHaveBeenCalledWith('K7M4Q9XP');
  });
});
