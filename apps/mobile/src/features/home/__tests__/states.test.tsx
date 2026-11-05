import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { V0Error, V0Loading } from '../states';
it('V0-F13-AC-01 announces loading once', async () => {
  const screen = await renderWithI18n(<V0Loading />);
  expect(screen.getByLabelText(screen.t('state.loading'))).toBeTruthy();
});
it('V0-F13-AC-02 and V0-EC-03 show retry for error and empty offline states', async () => {
  const retry = jest.fn(); const screen = await renderWithI18n(<V0Error offline retry={retry} />);
  expect(screen.getByText(screen.t('state.offline.empty.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.retry') }));
  expect(retry).toHaveBeenCalledTimes(1);
});
