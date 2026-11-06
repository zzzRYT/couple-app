import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { SetPasswordFlow, SetPasswordSheet } from '../SetPasswordFlow';

const set = () => ({ set: jest.fn().mockResolvedValue('ok') });
const relay = 'x7k2m9qd4t@privaterelay.appleid.com';

it('V0-F16-AC-01 is guidance: "later" always continues and the note says where to find it', async () => {
  const onLater = jest.fn();
  const screen = await renderWithI18n(<SetPasswordFlow password={set()} email={relay} copy={jest.fn()} onDone={jest.fn()} onLater={onLater} />);
  expect(screen.getByText(screen.t('auth.setpw.prompt.title'))).toBeTruthy();
  expect(screen.getByText(screen.t('auth.setpw.later.note'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.setpw.later') }));
  expect(onLater).toHaveBeenCalled();
});

it('V0-F16-AC-02 shows the rules, refuses a mismatch, then shows the sign-in address with copy and the private address note', async () => {
  const password = set(), copy = jest.fn().mockResolvedValue(undefined), onDone = jest.fn();
  const screen = await renderWithI18n(<SetPasswordFlow password={password} email={relay} copy={copy} onDone={onDone} onLater={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.setpw.cta') }));
  expect(screen.getByLabelText(screen.t('login.pw.label')).props.textContentType).toBe('newPassword');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), 'short');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.confirm')), 'shrt');
  expect(screen.getByText(screen.t('login.pw.mismatch'))).toBeTruthy();
  expect(screen.getByRole('button', { name: screen.t('onb.pw.submit') }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), 'mopiru2026');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.confirm')), 'mopiru2026');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('onb.pw.submit') }));
  expect(await screen.findByText(screen.t('auth.setpw.done.title'))).toBeTruthy();
  expect(password.set).toHaveBeenCalledWith('mopiru2026');
  expect(screen.getByText(screen.t('set.security.relay'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.copy.a11y') }));
  expect(copy).toHaveBeenCalledWith(relay);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.next') }));
  expect(onDone).toHaveBeenCalled();
});

it('V0-F16-AC-02 hides the private address note for an ordinary address', async () => {
  const screen = await renderWithI18n(<SetPasswordFlow start="form" password={set()} email="haru@example.com" copy={jest.fn()} onDone={jest.fn()} onLater={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.label')), 'mopiru2026');
  await fireEvent.changeText(screen.getByLabelText(screen.t('login.pw.confirm')), 'mopiru2026');
  await fireEvent.press(screen.getByRole('button', { name: screen.t('onb.pw.submit') }));
  await screen.findByText(screen.t('auth.setpw.done.title'));
  expect(screen.queryByText(screen.t('set.security.relay'))).toBeNull();
});

it('V0-F16-AC-03 the sheet on home creates or skips', async () => {
  const onCreate = jest.fn(), onLater = jest.fn();
  const screen = await renderWithI18n(<SetPasswordSheet visible onCreate={onCreate} onLater={onLater} />);
  expect(screen.getByText(screen.t('auth.setpw.sheet.body'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.setpw.cta') }));
  await fireEvent.press(screen.getByRole('button', { name: screen.t('auth.setpw.later') }));
  await waitFor(() => { expect(onCreate).toHaveBeenCalled(); expect(onLater).toHaveBeenCalled(); });
});
