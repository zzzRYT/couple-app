import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ProfileScreen } from '../ProfileScreen';

it('V0-F02-AC-03 requires a name and skips optional birthday', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const screen = await renderWithI18n(<ProfileScreen onSave={save} onBack={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('start.profile.skip') }));
  expect(screen.getByText(screen.t('start.profile.err.name'))).toBeTruthy();
  expect(save).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText(screen.t('start.profile.name')), '하루');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('start.profile.skip') }));
  expect(save).toHaveBeenCalledWith('하루', null);
});

it('V0-start-profile-err keeps 다음 disabled without a name and flags the cleared field, while skip stays available', async () => {
  const screen = await renderWithI18n(<ProfileScreen onSave={jest.fn()} onBack={jest.fn()} initialName="하루" />);
  const next = () => screen.getByRole('button', { name: screen.t('common.next') });
  expect(next().props.accessibilityState.disabled).toBe(false);
  expect(screen.getByText(screen.t('edit.counter', { n: 2, max: 10 }))).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText(screen.t('start.profile.name')), '  ');
  expect(next().props.accessibilityState.disabled).toBe(true);
  expect(screen.getByRole('alert', { name: screen.t('start.profile.err.name') })).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('start.profile.skip') }).props.accessibilityState.disabled).toBe(false);
});

it('says the profile could not be saved when saving fails', async () => {
  const screen = await renderWithI18n(<ProfileScreen onSave={jest.fn().mockRejectedValue(new Error('offline'))} onBack={jest.fn()} initialName="하루" />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.next') }));
  expect(await screen.findByRole('alert', { name: screen.t('edit.save.err') })).toBeTruthy();
});

it('V0-F12-AC-02 clears my birthday on V0-set-me and saves it as removed', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const screen = await renderWithI18n(<ProfileScreen editing onSave={save} onBack={jest.fn()} initialName="하루" initialBirthday={{ month: 3, day: 14, year: null }} />);
  expect(screen.queryByText(screen.t('set.me.birthday.none'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('set.me.birthday.clear') }));
  expect(screen.getByText(screen.t('set.me.birthday.none'))).toBeTruthy();
  expect(screen.queryByRole('button', { name: screen.t('set.me.birthday.clear') })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.save') }));
  expect(save).toHaveBeenCalledWith('하루', null);
});

it('offers 생일 지우기 only while a birthday is set on V0-set-me', async () => {
  const empty = await renderWithI18n(<ProfileScreen editing onSave={jest.fn()} initialName="하루" />);
  expect(empty.queryByRole('button', { name: empty.t('set.me.birthday.clear') })).toBeNull();
  await empty.unmount();
  const onboarding = await renderWithI18n(<ProfileScreen onSave={jest.fn()} initialName="하루" initialBirthday={{ month: 3, day: 14, year: null }} />);
  expect(onboarding.queryByRole('button', { name: onboarding.t('set.me.birthday.clear') })).toBeNull();
});
