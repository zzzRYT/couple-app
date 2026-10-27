import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { Welcome } from '../Welcome';

it('shows the age notice and legal links without collecting a birth date', async () => {
  const onStart = jest.fn();
  const screen = await renderWithI18n(<Welcome onStart={onStart} onHasAccount={jest.fn()} />);
  expect(screen.getByText(screen.t('onb.legal.lead'))).toBeTruthy();
  expect(screen.getByText(screen.t('onb.legal.links'))).toBeTruthy();
  expect(JSON.stringify(screen.toJSON())).not.toContain('"type":"TextInput"');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('onb.start') }));
  expect(onStart).toHaveBeenCalledWith();
});

it('pages through three intro cards with the mascot only on the third', async () => {
  const screen = await renderWithI18n(<Welcome onStart={jest.fn()} onHasAccount={jest.fn()} />);
  expect(screen.getByText(screen.t('onb.p1.title'))).toBeTruthy();
  expect(screen.queryByTestId('welcome-mascot')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.next') }));
  expect(screen.getByText(screen.t('onb.p2.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.next') }));
  expect(screen.getByText(screen.t('onb.p3.title'))).toBeTruthy();
  expect(screen.getByTestId('welcome-mascot')).toBeTruthy();
});

it('hides the tagline at 130% text size and offers the existing-account path', async () => {
  const onHasAccount = jest.fn();
  const large = await renderWithI18n(<Welcome onStart={jest.fn()} onHasAccount={onHasAccount} fontScale={1.3} />);
  expect(large.queryByText(large.t('brand.tagline'))).toBeNull();
  await fireEvent.press(large.getByRole('button', { name: large.t('onb.hasAccount') }));
  expect(onHasAccount).toHaveBeenCalled();
  const normal = await renderWithI18n(<Welcome onStart={jest.fn()} onHasAccount={jest.fn()} fontScale={1} />);
  expect(normal.getByText(normal.t('brand.tagline'))).toBeTruthy();
});
