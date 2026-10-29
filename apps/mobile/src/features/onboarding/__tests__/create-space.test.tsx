import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { CreateSpaceScreen } from '../CreateSpaceScreen';
import { ApiError } from '../../../lib/errors';
const now = '2026-10-27T03:00:00Z';
async function setup(createSpace = jest.fn().mockResolvedValue({ spaceId: 'space-1', memberCount: 1 })) {
  const onCreated = jest.fn();
  const onOpenSpace = jest.fn();
  const screen = await renderWithI18n(<CreateSpaceScreen createSpace={createSpace} now={now} timeZone="Asia/Seoul" onCreated={onCreated} onOpenSpace={onOpenSpace} />);
  const pick = async (field: string, value: number) => {
    await fireEvent.press(screen.getByTestId('date-year'));
    await fireEvent.press(screen.getByTestId(`wheel-${field}-${value}`));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('common.done') }));
  };
  const submit = () => fireEvent.press(screen.getByRole('button', { name: screen.t('space.create') }));
  return { screen, createSpace, onCreated, onOpenSpace, pick, submit };
}

it('initializes the room time zone note from the device zone', async () => {
  const { screen } = await setup();
  expect(screen.getByText(screen.t('space.tz.note', { tz: 'Asia/Seoul' }))).toBeTruthy();
});

it('rejects nonexistent and future dates without calling the server', async () => {
  const { screen, createSpace, pick, submit } = await setup();
  await pick('year', 2026); await pick('month', 2); await pick('day', 30);
  await submit();
  expect(screen.getByText(screen.t('space.date.invalid'))).toBeTruthy();
  await pick('month', 12); await pick('day', 1);
  await submit();
  expect(screen.getByText(screen.t('space.date.future'))).toBeTruthy();
  expect(createSpace).not.toHaveBeenCalled();
});

it('creates the space with the chosen date and time zone', async () => {
  const { screen, createSpace, onCreated, pick, submit } = await setup();
  await pick('year', 2025); await pick('month', 6); await pick('day', 29);
  await submit();
  expect(createSpace).toHaveBeenCalledWith('2025-06-29', 'Asia/Seoul');
  expect(screen.getByText(screen.t('space.ok.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('space.ok.next') }));
  expect(onCreated).toHaveBeenCalledWith('space-1');
});

it('maps ALREADY_IN_SPACE and network failures to their messages', async () => {
  const createSpace = jest.fn().mockRejectedValueOnce(new ApiError(409, 'ALREADY_IN_SPACE')).mockRejectedValueOnce(new TypeError('Network request failed'));
  const { screen, onOpenSpace, submit } = await setup(createSpace);
  await submit();
  expect(screen.getByText(screen.t('join.hasSpace.title'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('join.hasSpace.action') }));
  expect(onOpenSpace).toHaveBeenCalled();
  await act(async () => { await submit(); });
  expect(screen.getByText(screen.t('space.err.title'))).toBeTruthy();
});
