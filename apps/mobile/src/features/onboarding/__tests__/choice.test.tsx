import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { SpaceChoiceScreen } from '../SpaceChoiceScreen';

it('offers both creating and joining a space, with no back control', async () => {
  const onCreate = jest.fn(); const onJoin = jest.fn();
  const screen = await renderWithI18n(<SpaceChoiceScreen onCreate={onCreate} onJoin={onJoin} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('start.choose.new.title') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('start.choose.join.title') }));
  expect(onCreate).toHaveBeenCalledTimes(1);
  expect(onJoin).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('screen-back')).toBeNull();
});
