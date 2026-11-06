import { appGate, type AppGateInput } from '../appGate';

const notice = { kind: 'ended' as const, by: 'partner' as const, at: '2026-10-29T00:00:00Z' };
const ready: AppGateInput = { fontsLoaded: true, sessionLoaded: true, hasSession: true, entry: 'none', pendingInviteLoaded: true, snapshotProfile: '하루' };

it.each([
  ['fonts loading', { ...ready, fontsLoaded: false }, 'booting'],
  ['session restoring', { ...ready, sessionLoaded: false }, 'booting'],
  ['signed out', { ...ready, hasSession: false }, 'signedOut'],
  ['401 after sign in', { ...ready, sessionExpired: true }, 'sessionExpired'],
  ['space lookup pending', { ...ready, entry: 'loading' }, 'booting'],
  ['pending invite lookup', { ...ready, pendingInviteLoaded: false }, 'booting'],
  ['choice screen', ready, 'needsOnboardingChoice'],
  ['cold invite join', { ...ready, pendingInvite: 'AB12CD34' }, 'needsOnboardingChoice'],
  ['active space', { ...ready, entry: 'active', spaceId: 'space-1' }, 'active'],
  ['ended notice', { ...ready, entry: 'ended', ended: notice }, 'ended'],
  ['network error while loading', { ...ready, entry: 'error' }, 'booting'],
] as const)('%s resolves to %s', (_label, input, kind) => {
  expect(appGate(input).kind).toBe(kind);
});

it('sends a successful ended acknowledgement back to create-or-join', () => {
  expect(appGate({ ...ready, entry: 'none' }).kind).toBe('needsOnboardingChoice');
});

it('does not retain expired state after a successful reauthentication', () => {
  expect(appGate({ ...ready, sessionExpired: false, entry: 'active', spaceId: 'space-1' })).toEqual({ kind: 'active', spaceId: 'space-1' });
});

it.each([
  ['boot resolves without a session', { ...ready, hasSession: false }, 'signedOut'],
  ['login to active space', { ...ready, entry: 'active', spaceId: 'space-1' }, 'active'],
  ['active space ended by partner', { ...ready, entry: 'ended', ended: notice }, 'ended'],
  ['acknowledge ended notice', { ...ready, entry: 'none', ended: null }, 'needsOnboardingChoice'],
  ['active request receives 401', { ...ready, sessionExpired: true }, 'sessionExpired'],
  ['expired session signs in again', { ...ready, sessionExpired: false, entry: 'active', spaceId: 'space-1' }, 'active'],
] as const)('transition: %s → %s', (_event, input, expected) => {
  expect(appGate(input).kind).toBe(expected);
});

it('V0-F02-AC-08 waits for a snapshot and requires a missing member profile', () => {
  const input = { fontsLoaded: true, sessionLoaded: true, hasSession: true, entry: 'active' as const, spaceId: 'space', pendingInviteLoaded: true };
  expect(appGate({ ...input, snapshotProfile: undefined })).toEqual({ kind: 'booting' });
  expect(appGate({ ...input, snapshotProfile: null })).toEqual({ kind: 'needsProfile' });
  expect(appGate({ ...input, snapshotProfile: '하루' })).toEqual({ kind: 'active', spaceId: 'space' });
});

it('V0-F01-AC-03 sends a signed-in person without an active space to the create-or-join choice', () => {
  expect(appGate({ ...ready, entry: 'none' })).toMatchObject({ kind: 'needsOnboardingChoice' });
});

it('V0-F02-AC-10 resumes at the profile step when a joined member has not saved a name yet', () => {
  expect(appGate({ ...ready, entry: 'active', spaceId: 'space-1', snapshotProfile: null })).toEqual({ kind: 'needsProfile' });
});
