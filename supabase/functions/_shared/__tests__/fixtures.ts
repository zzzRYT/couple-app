import { call, makeUser, type TestUser } from './local.ts';
import { spacesHandler } from '../../spaces/index.ts';
import { invitationsHandler } from '../../invitations/index.ts';
import type { Deps } from '../http.ts';

/** Two members joined through a real invitation, plus an outsider. */
export async function couple(deps: Deps): Promise<{ a: TestUser; b: TestUser; c: TestUser; spaceId: string }> {
  const spaces = spacesHandler(deps), inv = invitationsHandler(deps, () => 'test-pepper');
  const [a, b, c] = await Promise.all([makeUser('cp-a'), makeUser('cp-b'), makeUser('cp-c')]);
  const space = await call(spaces, a, 'POST', '/spaces/spaces', { anniversaryDate: '2025-01-01', timeZone: 'Asia/Seoul' });
  const issued = await call(inv, a, 'POST', `/invitations/spaces/${space.body.spaceId}/invitations`, {});
  const joined = await call(inv, b, 'POST', '/invitations/invitations/accept', { code: issued.body.code });
  if (joined.status !== 200) throw new Error(`join failed: ${JSON.stringify(joined.body)}`);
  return { a, b, c, spaceId: space.body.spaceId };
}
