import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { PARTNER, snapshotFixture } from '../../../test/fixtures';
import type { Snapshot } from '../../../lib/client';
import { Avatar } from '../../calendar/Avatar';
import { profilesOf, stablePhoto } from '../profiles';

let mockSnapshot: Snapshot | null = null;
jest.mock('../SpaceContext', () => ({ useOptionalSpace: () => (mockSnapshot ? { state: { snapshot: mockSnapshot } } : null) }));
beforeEach(() => { mockSnapshot = null; });
const t = (key: string) => `t:${key}`;
// Avatars are hidden from screen readers (a name always sits next to them).
const hidden = { includeHiddenElements: true };

it('gives both partners a profile, with the pending partner and an unnamed me falling back', () => {
  const snapshot = snapshotFixture(); snapshot.members[1]!.photo = 'https://cdn/p/partner.jpg?token=1';
  expect(profilesOf(snapshot, t)).toEqual({ me: { userId: snapshot.me.userId, name: '하루', photo: null }, partner: { userId: PARTNER, name: '도담', photo: 'https://cdn/p/partner.jpg?token=1' } });
  const alone = snapshotFixture({ memberCount: 1 }); alone.me.displayName = null;
  expect(profilesOf(alone, t)).toEqual({ me: { userId: alone.me.userId, name: '', photo: null }, partner: { userId: null, name: 't:home.pending.partner', photo: null } });
});

it('keeps the first signed URL of a photo for an hour so images do not reload on every refresh', () => {
  const start = 1_000_000;
  expect(stablePhoto('https://cdn/p/a.jpg?token=1', start)).toBe('https://cdn/p/a.jpg?token=1');
  expect(stablePhoto('https://cdn/p/a.jpg?token=2', start + 59 * 60_000)).toBe('https://cdn/p/a.jpg?token=1');
  expect(stablePhoto('https://cdn/p/b.jpg?token=3', start + 59 * 60_000)).toBe('https://cdn/p/b.jpg?token=3');
  expect(stablePhoto('https://cdn/p/a.jpg?token=4', start + 61 * 60_000)).toBe('https://cdn/p/a.jpg?token=4');
  expect(stablePhoto(undefined)).toBeNull();
});

it('shows the owner photo in an avatar and falls back to the initial when it fails to load', async () => {
  mockSnapshot = snapshotFixture(); mockSnapshot.members[1]!.photo = 'https://cdn/p/avatar.jpg?token=1';
  const screen = await renderWithI18n(<><Avatar owner="partner" name="도담" size={40} /><Avatar owner="me" name="하루" size={40} /></>);
  expect(screen.getByTestId('avatar-photo', hidden).props.source).toEqual({ uri: 'https://cdn/p/avatar.jpg?token=1' });
  expect(screen.getByText('하', hidden)).toBeTruthy();
  expect(screen.queryByText('도', hidden)).toBeNull();
  await fireEvent(screen.getByTestId('avatar-photo', hidden), 'error');
  expect(screen.queryByTestId('avatar-photo', hidden)).toBeNull();
  expect(screen.getByText('도', hidden)).toBeTruthy();
});

it('shows the initial without a space', async () => {
  const screen = await renderWithI18n(<Avatar owner="me" name="하루" size={40} />);
  expect(screen.getByText('하', hidden)).toBeTruthy();
});
