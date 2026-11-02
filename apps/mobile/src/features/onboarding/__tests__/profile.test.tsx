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
