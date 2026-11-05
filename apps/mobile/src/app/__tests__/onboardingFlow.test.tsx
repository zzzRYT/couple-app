import { useState } from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithI18n } from '../../test/render';
import { CreateFlowProvider } from '../../features/onboarding/CreateFlowContext';
import CreateSpaceRoute from '../(onboarding)/create-space';
import ProfileRoute from '../(onboarding)/profile';

jest.mock('expo-router', () => ({ ...jest.requireActual('expo-router'), router: { push: jest.fn(), dismissTo: jest.fn() } }));
jest.mock('expo-localization', () => ({ getCalendars: () => [{ timeZone: 'Asia/Seoul' }] }));
const mockApp = { client: { saveMemberProfile: jest.fn(), createSpace: jest.fn() } };
const mockSpace = { entry: 'none', refresh: jest.fn(), reload: jest.fn(), queueInviteAfterActivation: jest.fn() };
jest.mock('../../lib/AppContext', () => ({ useApp: () => mockApp }));
jest.mock('../../features/space/SpaceContext', () => ({ useSpace: () => mockSpace }));

const calls: string[] = [];
beforeEach(() => {
  calls.length = 0; jest.clearAllMocks(); mockSpace.entry = 'none';
  mockApp.client.saveMemberProfile.mockImplementation(async () => { calls.push('profile'); });
  mockApp.client.createSpace.mockImplementation(async () => { calls.push('space'); return { spaceId: 'space-1', memberCount: 1 }; });
  mockSpace.queueInviteAfterActivation.mockImplementation(() => { calls.push('invite'); });
});

async function pickDate(screen: Awaited<ReturnType<typeof renderWithI18n>>) {
  for (const [field, value] of [['year', 2025], ['month', 6], ['day', 29]] as const) {
    await fireEvent.press(screen.getByTestId('date-year'));
    await fireEvent.press(screen.getByTestId(`wheel-${field}-${value}`));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('common.done') }));
  }
}
// The router mock drives a two-step stack: the provider stays mounted like the onboarding layout.
let go: (step: 'date' | 'profile') => void = () => {};
function Flow() {
  const [step, setStep] = useState<'date' | 'profile'>('date');
  go = setStep;
  return <CreateFlowProvider>{step === 'date' ? <CreateSpaceRoute /> : <ProfileRoute />}</CreateFlowProvider>;
}
const both = () => <Flow />;
beforeEach(() => {
  (router.push as jest.Mock).mockImplementation(() => { go('profile'); });
  (router.dismissTo as jest.Mock).mockImplementation(() => { go('date'); });
});

it('V0-F02-AC-04 saves the name and birthday first, then creates the space in the device time zone and queues the invite', async () => {
  const screen = await renderWithI18n(both());
  await pickDate(screen);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.next') }));
  expect(router.push).toHaveBeenCalledWith('/profile');
  await fireEvent.changeText(screen.getByLabelText(screen.t('start.profile.name')), '하루');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('start.profile.skip') }));
  await waitFor(() => expect(mockSpace.reload).toHaveBeenCalled());
  expect(mockApp.client.saveMemberProfile).toHaveBeenCalledWith('하루', null);
  expect(mockApp.client.createSpace).toHaveBeenCalledWith('2025-06-29', 'Asia/Seoul');
  expect(calls).toEqual(['profile', 'space', 'invite']);
});

it('V0-F02-AC-09 goes back one step with the picked date kept, and has no back after the space exists', async () => {
  const screen = await renderWithI18n(both());
  await pickDate(screen);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.next') }));
  await fireEvent.press(screen.getByTestId('screen-back'));
  expect(router.dismissTo).toHaveBeenCalledWith('/create-space');
  expect(screen.getByTestId('date-year').props.accessibilityLabel).toContain('2025');
  mockSpace.entry = 'active';
  const after = await renderWithI18n(<CreateFlowProvider><ProfileRoute /></CreateFlowProvider>);
  expect(after.queryByTestId('screen-back')).toBeNull();
});
