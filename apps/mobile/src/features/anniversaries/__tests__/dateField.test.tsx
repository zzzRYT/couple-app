import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { AnniversaryDateField } from '../AnniversaryDateField';
it('V0-edit-picker can select a prior year and commits only on Done', async () => {
  const onChange = jest.fn();
  const screen = await renderWithI18n(<AnniversaryDateField value={{ year: 2026, month: 11, day: 2 }} onChange={onChange} minYear={1900} maxYear={2100} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('edit.field.date') }));
  await fireEvent(screen.getByRole('adjustable', { name: screen.t('space.year') }), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
  expect(onChange).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.done') }));
  expect(onChange).toHaveBeenCalledWith({ year: 2025, month: 11, day: 2 });
});
it('V0-edit-picker offers only the days of the chosen month and clamps the day when the month changes', async () => {
  const onChange = jest.fn();
  const screen = await renderWithI18n(<AnniversaryDateField value={{ year: 2026, month: 1, day: 31 }} onChange={onChange} minYear={1900} maxYear={2100} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('edit.field.date') }));
  await fireEvent(screen.getByRole('adjustable', { name: screen.t('space.month') }), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  expect(screen.getByRole('adjustable', { name: screen.t('space.day') }).props.accessibilityValue).toEqual({ text: '28' });
  expect(screen.queryByText('29')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('common.done') }));
  expect(onChange).toHaveBeenCalledWith({ year: 2026, month: 2, day: 28 });
});
