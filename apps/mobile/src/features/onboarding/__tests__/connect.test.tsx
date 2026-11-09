import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { ConnectScreen } from '../ConnectScreen';

it('V0-F02-AC-11 offers sending my code and entering the partner code, and says what joining does', async () => {
  const onSend = jest.fn(); const onEnter = jest.fn();
  const screen = await renderWithI18n(<ConnectScreen onSend={onSend} onEnter={onEnter} />);
  expect(screen.getByText(screen.t('connect.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('connect.note'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('connect.send.title') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('connect.enter.title') }));
  expect(onSend).toHaveBeenCalledTimes(1);
  expect(onEnter).toHaveBeenCalledTimes(1);
});
