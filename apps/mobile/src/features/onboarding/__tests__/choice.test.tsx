import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { SpaceChoiceScreen } from '../SpaceChoiceScreen';

it('offers both creating and joining a space', async () => {
  const onCreate = jest.fn(); const onJoin = jest.fn();
  const screen = await renderWithI18n(<SpaceChoiceScreen onCreate={onCreate} onJoin={onJoin} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.createSpace') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.haveCode') }));
  expect(onCreate).toHaveBeenCalledTimes(1);
  expect(onJoin).toHaveBeenCalledTimes(1);
});
