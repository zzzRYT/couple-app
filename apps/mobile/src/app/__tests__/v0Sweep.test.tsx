import type { ReactElement } from 'react';
import { fireEvent } from '@testing-library/react-native';
import { snapshotFixture } from '../../test/fixtures';
import { LOCALES, cappedTexts, renderSweep, unlabeledTouchables } from '../../test/a11y';
import { computeAnniversaries } from '../../lib/anniversaries';
import type { MilestoneCelebration } from '../../lib/client';
import { V0HomeScreen } from '../../features/home/V0HomeScreen';
import { V0Error, V0Loading } from '../../features/home/states';
import { AnniversaryList } from '../../features/anniversaries/AnniversaryList';
import { AnniversaryDetail } from '../../features/anniversaries/AnniversaryDetail';
import { AnniversaryEdit } from '../../features/anniversaries/AnniversaryEdit';
import { V0SettingsScreen } from '../../features/settings/V0SettingsScreen';
import { SpaceChoiceScreen } from '../../features/onboarding/SpaceChoiceScreen';
import { ProfileScreen } from '../../features/onboarding/ProfileScreen';
import { V0DateScreen } from '../../features/onboarding/V0DateScreen';
import { CreateSpaceScreen } from '../../features/onboarding/CreateSpaceScreen';
import { JoinScreen } from '../../features/onboarding/JoinScreen';
import { InviteScreen } from '../../features/onboarding/InviteScreen';
import { EndSpaceScreen } from '../../features/lifecycle/EndSpaceScreen';
import { EndedScreen } from '../../features/lifecycle/EndedScreen';
import { DeleteAccountScreen } from '../../features/account/DeleteAccountScreen';
import { TimeZoneSheet } from '../../features/settings/TimeZoneSheet';
import { NotificationTimeSheet } from '../../features/settings/NotificationTimeSheet';
import { AnniversaryToast } from '../../features/anniversaries/AnniversaryToast';
import type { Locale } from '../../i18n';

const noop = jest.fn();
const view = computeAnniversaries({ startDate: '2025-01-01', timeZone: 'Asia/Seoul', me: { birthday: null }, partner: null, customs: [{ id: 'x', title: 'Our day', date: '2026-11-11', repeat: 'yearly' }] }, '2026-11-11T12:00:00Z');
const state = (snapshot = snapshotFixture()) => ({ status: 'ready' as const, snapshot, offline: false, lastSyncedAt: null });
const celebration = { id: 'c', key: 'd500', kind: 'days', date: '2026-11-02', n: 500, daysAgo: 0, seenByMe: false, presetAvailable: false, presetId: 'milestone-day' } as unknown as MilestoneCelebration;
const home = (extra: Record<string, unknown> = {}, snapshot = snapshotFixture()) => <V0HomeScreen state={state(snapshot)} now="2026-11-02T03:00:00Z" onAnniversaries={noop} onRefresh={noop} onOpenInvite={noop} celebration={null} onSeen={noop} {...extra} />;
const editBase = { today: '2026-11-02', partner: 'Haru', offline: false, initialNotify: 'default' as const, notifyDefault: '기본 설정', remove: noop, reload: noop, onClose: noop, onSaved: noop, save: noop };
const custom = { id: 'x', title: 'Trip', date: '2025-05-30', memo: 'Together', repeat: 'once' as const, createdBy: 'me', updatedBy: 'me', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', version: 1 };

/** Screens whose required text must wrap, not truncate, at 200% (V0-NF-01). */
const SCREENS: Record<string, () => ReactElement> = {
  'home hero': () => home(),
  'home celebration card': () => home({ celebration, onSeen: noop }),
  'home pending invite': () => home({}, snapshotFixture({ memberCount: 1 })),
  'home loading': () => <V0Loading />,
  'home error': () => <V0Error retry={noop} />,
  'anniversary list': () => <AnniversaryList view={view} filter="all" pastOpen offline={false} birthdayState="mine" partner="Haru" onFilter={noop} onPast={noop} onAdd={noop} onItem={noop} onBirthday={noop} />,
  'anniversary list custom empty': () => <AnniversaryList view={view} filter="custom" pastOpen={false} offline={false} birthdayState="none" partner="Haru" onFilter={noop} onPast={noop} onAdd={noop} onItem={noop} onBirthday={noop} />,
  'anniversary detail automatic': () => <AnniversaryDetail item={{ key: 'd150', kind: 'days', date: '2025-05-30', n: 150 }} today="2025-05-01" startDate="2025-01-01" partner="Haru" userId="me" notify="default" notifyDefault="기본 설정" offline={false} onBack={noop} onEdit={noop} onDelete={noop} onSettings={noop} onMe={noop} />,
  'anniversary detail custom': () => <AnniversaryDetail item={{ key: 'custom:x', kind: 'custom', date: '2025-05-30', title: 'Trip', customId: 'x' }} custom={custom} today="2025-05-01" startDate="2025-01-01" partner="Haru" userId="me" notify="off" notifyDefault="기본 설정" offline={false} onBack={noop} onEdit={noop} onDelete={noop} onSettings={noop} onMe={noop} />,
  'anniversary edit': () => <AnniversaryEdit {...editBase} />,
  'anniversary edit existing': () => <AnniversaryEdit {...editBase} initial={{ ...custom, repeat: 'yearly' }} />,
  settings: () => <V0SettingsScreen snapshot={snapshotFixture()} offline={false} version="1.0.0 (12)" onLogout={noop} onZone={noop} navigate={noop} />,
  'onboarding choice': () => <SpaceChoiceScreen onCreate={noop} onJoin={noop} onBack={noop} />,
  'onboarding profile': () => <ProfileScreen onSave={noop} onBack={noop} />,
  'onboarding start date': () => <V0DateScreen initial={null} now="2026-11-02T03:00:00Z" timeZone="Asia/Seoul" onNext={noop} onBack={noop} />,
  'onboarding create space': () => <CreateSpaceScreen createSpace={noop} now="2026-11-02T03:00:00Z" timeZone="Asia/Seoul" onCreated={noop} onOpenSpace={noop} onBack={noop} />,
  'onboarding join': () => <JoinScreen previewInvitation={noop} acceptInvitation={noop} onJoined={noop} onOpenSpace={noop} onBack={noop} />,
  'onboarding invite': () => <InviteScreen createInvitation={noop} reducedMotion onBack={noop} onLater={noop} onJoined={noop} />,
  'end space': () => <EndSpaceScreen onEnd={noop} onCancel={noop} />,
  'ended by me': () => <EndedScreen ended={{ kind: 'ended', by: 'me', at: '2026-10-29T00:00:00Z' }} hasActiveSpace={false} partnerName="Haru" onContinue={noop} />,
  'ended by partner disconnect': () => <EndedScreen ended={{ kind: 'disconnect', by: 'partner', at: '2026-10-29T00:00:00Z' }} hasActiveSpace={false} partnerName="Haru" onContinue={noop} />,
  'ended by partner deleted': () => <EndedScreen ended={{ kind: 'account_deleted', by: 'partner', at: '2026-10-29T00:00:00Z' }} hasActiveSpace={false} partnerName="Haru" onContinue={noop} />,
  'delete account': () => <DeleteAccountScreen reauth={{ apple: noop, kakao: noop, sendEmailCode: noop, verifyEmailCode: noop } as never} onSubmit={noop} onFinished={noop} onCancel={noop} provider="apple" options={{ apple: 'native', kakao: false, devEmail: false }} v0 />,
  'time zone sheet': () => <TimeZoneSheet visible timeZone="Asia/Seoul" onClose={noop} onSelect={noop} />,
  'notification time sheet': () => <NotificationTimeSheet visible time="09:00" onClose={noop} onSelect={noop} />,
  'toast': () => <AnniversaryToast text="Saved" onHide={noop} />,
  'settings offline': () => <V0SettingsScreen snapshot={snapshotFixture()} offline version="1.0.0 (12)" onLogout={noop} onZone={noop} navigate={noop} />,
};

describe.each(Object.entries(SCREENS))('%s', (_name, build) => {
  it.each(LOCALES)('V0-NF-02 has every key in %s and V0-NF-01 names every touchable', async (locale: Locale) => {
    const { screen, missing, restore } = await renderSweep(build(), locale);
    expect(missing).toEqual([]);
    expect(unlabeledTouchables(screen.toJSON())).toEqual([]);
    restore();
  });
  it.each(LOCALES)('V0-NF-01 keeps required text uncapped at 200%% in %s', async (locale: Locale) => {
    const { screen, restore } = await renderSweep(build(), locale, 2);
    expect(cappedTexts(screen.toJSON())).toEqual([]);
    restore();
  });
});

it('V0-NF-01 names the date wheels once the edit date field is open', async () => {
  for (const locale of LOCALES) {
    const { screen, missing, restore, t } = await renderSweep(<AnniversaryEdit {...editBase} />, locale);
    await fireEvent.press(screen.getByLabelText(t('a11y.dateField')));
    expect(missing).toEqual([]);
    expect(unlabeledTouchables(screen.toJSON())).toEqual([]);
    restore();
  }
});

describe('V0-NF-01 large text wraps instead of shrinking or clipping', () => {
  it.each([['ko-KR', 'D+\n492'], ['en-US', 'Day\n492'], ['ja-JP', '492日目']] as const)('puts the big day count on two lines at 200%% in %s', async (locale, expected) => {
    const { screen, restore } = await renderSweep(home(), locale, 2);
    expect(screen.getByText(expected)).toBeTruthy();
    restore();
    const normal = await renderSweep(home(), locale, 1);
    expect(normal.screen.getByText(expected.replace('\n', ' ').replace('D+ ', 'D+'))).toBeTruthy();
    normal.restore();
  });
  it('keeps the board single-line row title at normal size and lets it wrap at 200%', async () => {
    const normal = await renderSweep(SCREENS['anniversary list']!(), 'ko-KR', 1);
    expect(cappedTexts(normal.screen.toJSON()).length).toBeGreaterThan(0);
    normal.restore();
    const large = await renderSweep(SCREENS['anniversary list']!(), 'ko-KR', 2);
    expect(cappedTexts(large.screen.toJSON())).toEqual([]);
    large.restore();
  });
});
