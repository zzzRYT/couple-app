import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ME, PARTNER, snapshotFixture } from '../../../test/fixtures';
import { lease } from '../../../test/promptClient';
import { ApiError } from '../../../lib/errors';
import { JoinScreen } from '../../onboarding/JoinScreen';
import { moveToPartnerSpace } from '../moveSpace';

const solo = (spaceId = 'space-b') => { const snapshot = snapshotFixture({ memberCount: 1 }); snapshot.space.spaceId = spaceId; return snapshot; };
const deps = (overrides = {}) => ({
  code: 'K7M4Q9XP', snapshot: solo(), userId: ME,
  close: jest.fn().mockResolvedValue({ status: 'ended' }), accept: jest.fn().mockResolvedValue({ spaceId: 'space-a', memberCount: 2 }),
  ackEnded: jest.fn().mockResolvedValue(undefined), releaseSession: jest.fn().mockResolvedValue(undefined), keepCode: jest.fn().mockResolvedValue(undefined),
  resetSpace: jest.fn(), reload: jest.fn().mockResolvedValue(undefined), ...overrides,
});
const order = (...fns: jest.Mock[]) => fns.map((fn) => fn.mock.invocationCallOrder[0]!);

describe('V0-F02-AC-12 moving from a space held alone into the partner space', () => {
  it('ends the waiting space, drops it, joins with the code, acknowledges the end notice, then re-reads the entry', async () => {
    const d = deps();
    await moveToPartnerSpace(d);
    expect(d.close).toHaveBeenCalledWith('space-b');
    expect(d.accept).toHaveBeenCalledWith('K7M4Q9XP');
    expect(d.keepCode).not.toHaveBeenCalled();
    const calls = order(d.close, d.resetSpace, d.accept, d.ackEnded, d.reload);
    expect([...calls].sort((a, b) => a - b)).toEqual(calls);
  });

  it('never ends a space that already has a partner', async () => {
    const d = deps({ snapshot: snapshotFixture({ memberCount: 2 }) });
    await expect(moveToPartnerSpace(d)).rejects.toThrow('SPACE_HAS_PARTNER');
    expect(d.close).not.toHaveBeenCalled();
  });

  it('gives back its own lease, treats 404 as already ended, and keeps everything when the end really fails', async () => {
    const held = solo(); held.promptSession = lease(ME, '2026-10-27T03:03:00Z');
    const gone = deps({ snapshot: held, close: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND')) });
    await moveToPartnerSpace(gone);
    expect(gone.releaseSession).toHaveBeenCalled();
    expect(gone.accept).toHaveBeenCalled();
    const down = deps({ close: jest.fn().mockRejectedValue(new ApiError(503, 'SERVER_ERROR')) });
    await expect(moveToPartnerSpace(down)).rejects.toThrow('SERVER_ERROR');
    expect(down.resetSpace).not.toHaveBeenCalled();
    expect(down.accept).not.toHaveBeenCalled();
  });
});

it('V0-F02-AC-13 keeps the code for the onboarding join screen when the join fails after the end', async () => {
  const d = deps({ accept: jest.fn().mockRejectedValue(new ApiError(410, 'INVITE_EXPIRED')) });
  await moveToPartnerSpace(d);
  expect(d.keepCode).toHaveBeenCalledWith('K7M4Q9XP');
  expect(d.ackEnded).toHaveBeenCalled();
  expect(d.reload).toHaveBeenCalled();
});

/** The server rules the move relies on (one active space per person, ALREADY_IN_SPACE, end, accept, end notice), in memory. */
function fakeServer() {
  type Space = { members: string[]; status: 'active' | 'ended'; code: string | null };
  const spaces = new Map<string, Space>(); const notices = new Map<string, boolean>();
  const activeOf = (user: string) => [...spaces].find(([, s]) => s.status === 'active' && s.members.includes(user))?.[0] ?? null;
  const byCode = (code: string) => [...spaces].find(([, s]) => s.status === 'active' && s.code === code);
  return {
    spaces,
    start(user: string, spaceId: string, code: string) { spaces.set(spaceId, { members: [user], status: 'active', code }); },
    expire(code: string) { const entry = byCode(code); if (entry) entry[1].code = null; },
    client(user: string) {
      const check = (code: string) => {
        const entry = byCode(code);
        if (!entry) throw new ApiError(404, 'INVITE_INVALID');
        if (activeOf(user)) throw new ApiError(409, 'ALREADY_IN_SPACE');
        return entry;
      };
      return {
        previewInvitation: async (code: string) => { check(code); return { anniversaryDate: '2025-06-29', displayName: '하루', timeZone: 'Asia/Seoul' }; },
        acceptInvitation: async (code: string) => { const [spaceId, space] = check(code); space.members.push(user); space.code = null; return { spaceId, memberCount: 2 }; },
        endSpace: async (spaceId: string) => {
          const space = spaces.get(spaceId);
          if (!space || space.status !== 'active' || !space.members.includes(user)) throw new ApiError(404, 'NOT_FOUND');
          space.status = 'ended'; space.code = null; space.members.forEach((member) => notices.set(member, true));
          return { status: 'ended' as const };
        },
        ackEnded: async () => { notices.set(user, false); },
        mySpace: async () => ({ active: activeOf(user) ? { spaceId: activeOf(user)! } : null, ended: notices.get(user) ? { kind: 'ended' as const, by: 'me' as const, at: '2026-11-09T00:00:00Z' } : null }),
      };
    },
  };
}

describe('V0-F02-AC-12 regression: both partners started alone ("새로 시작하기" twice)', () => {
  async function enterPartnerCode(server: ReturnType<typeof fakeServer>, keepCode = jest.fn().mockResolvedValue(undefined)) {
    const b = server.client(ME);
    const reload = jest.fn().mockResolvedValue(undefined);
    const move = (code: string) => moveToPartnerSpace({ code, snapshot: solo('space-b'), userId: ME, close: b.endSpace, accept: b.acceptInvitation, ackEnded: b.ackEnded, releaseSession: jest.fn(), keepCode, resetSpace: jest.fn(), reload });
    const screen = await renderWithI18n(<JoinScreen previewInvitation={b.previewInvitation} acceptInvitation={b.acceptInvitation} onJoined={jest.fn()} onOpenSpace={jest.fn()} moveFromSpace={move} ownCode="ZZZZ-9999" />);
    await fireEvent.changeText(screen.getByLabelText(screen.t('connect.code.title')), 'k7m4-q9xp');
    await fireEvent.press(screen.getByRole('button', { name: screen.t('join.check') }));
    expect(await screen.findByText(screen.t('connect.move.title'))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: screen.t('connect.move.submit') }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    return { b, screen };
  }

  it('A issues a code, B enters it from the app, and both land in one connected space', async () => {
    const server = fakeServer();
    server.start(PARTNER, 'space-a', 'K7M4Q9XP');
    server.start(ME, 'space-b', 'ZZZZ9999');
    // Before the fix the only answer was ALREADY_IN_SPACE: B could not join from Home or Settings.
    await expect(server.client(ME).acceptInvitation('K7M4Q9XP')).rejects.toMatchObject({ code: 'ALREADY_IN_SPACE' });
    const { b } = await enterPartnerCode(server);
    expect(server.spaces.get('space-a')!.members).toEqual([PARTNER, ME]);
    expect(server.spaces.get('space-b')!.status).toBe('ended');
    expect(await b.mySpace()).toEqual({ active: { spaceId: 'space-a' }, ended: null });
    expect(await server.client(PARTNER).mySpace()).toEqual({ active: { spaceId: 'space-a' }, ended: null });
  });

  it('V0-F02-AC-13 a code that stops working mid-move leaves B on the join screen path, not on "ended"', async () => {
    const server = fakeServer();
    server.start(PARTNER, 'space-a', 'K7M4Q9XP');
    server.start(ME, 'space-b', 'ZZZZ9999');
    const keepCode = jest.fn(async () => { /* the code is kept for the onboarding join screen */ });
    const b = server.client(ME);
    const expireOnEnd = { ...b, endSpace: async (spaceId: string) => { const result = await b.endSpace(spaceId); server.expire('K7M4Q9XP'); return result; } };
    const move = (code: string) => moveToPartnerSpace({ code, snapshot: solo('space-b'), userId: ME, close: expireOnEnd.endSpace, accept: b.acceptInvitation, ackEnded: b.ackEnded, releaseSession: jest.fn(), keepCode, resetSpace: jest.fn(), reload: jest.fn().mockResolvedValue(undefined) });
    await move('K7M4Q9XP');
    expect(keepCode).toHaveBeenCalledWith('K7M4Q9XP');
    expect(await b.mySpace()).toEqual({ active: null, ended: null });
  });
});
