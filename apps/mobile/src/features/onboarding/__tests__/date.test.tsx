import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { V0DateScreen } from '../V0DateScreen';
import { tokens } from '../../../theme/tokens';
const now = '2026-10-27T03:00:00Z';
async function setup() {
  const onNext = jest.fn();
  const screen = await renderWithI18n(<V0DateScreen initial="2026-10-27" now={now} timeZone="Asia/Seoul" onNext={onNext} onBack={jest.fn()} />);
  const pick = async (field: string, value: number) => {
    await fireEvent.press(screen.getByTestId('date-year'));
    await fireEvent.press(screen.getByTestId(`wheel-${field}-${value}`));
    await fireEvent.press(screen.getByRole('button', { name: screen.t('common.done') }));
    await act(() => new Promise((resolve) => setTimeout(resolve, tokens.motion.transitionMs + 50)));
  };
  return { screen, onNext, pick };
}

it('V0-F02-AC-01 changes the day-count preview when a start date is picked', async () => {
  const { screen, onNext, pick } = await setup();
  expect(screen.getByText(screen.t('start.date.preview', { n: 1 }))).toBeTruthy();
  await pick('year', 2025); await pick('month', 6); await pick('day', 29);
  expect(screen.getByText(screen.t('start.date.preview', { n: 486 }))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.next') }));
  expect(onNext).toHaveBeenCalledWith('2025-06-29');
});

it('V0-F02-AC-02 shows the future-date error and cannot go next', async () => {
  const { screen, onNext, pick } = await setup();
  await pick('month', 12); await pick('day', 1);
  expect(screen.getByText(screen.t('start.date.err.future'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.next') }));
  expect(onNext).not.toHaveBeenCalled();
});
