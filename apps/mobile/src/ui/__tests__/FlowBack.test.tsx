import { useEffect as mockUseEffect } from 'react';
import { fireEvent } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { FlowBackProvider } from '../FlowBack';
import { Screen } from '../components';
import { renderWithI18n } from '../../test/render';

jest.mock('expo-router', () => ({ useFocusEffect: (effect: () => void) => mockUseEffect(effect, [effect]) }));

it.each(['ko-KR', 'en-US', 'ja-JP'] as const)('uses the shared translated back control in %s', async (locale) => {
  const onBack = jest.fn();
  const screen = await renderWithI18n(<FlowBackProvider><Screen onBack={onBack}>{null}</Screen></FlowBackProvider>, locale);
  const button = screen.getByRole('button', { name: screen.t('common.back') });
  expect(button.props.style.width).toBe(48);
  expect(button.props.style.height).toBe(48);
  await fireEvent.press(button);
  expect(onBack).toHaveBeenCalledTimes(1);
});

it('uses the same action for Android and consumes back when the action is absent', async () => {
  let hardwareBack: () => boolean = () => false;
  const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    hardwareBack = handler as () => boolean;
    return { remove: jest.fn() };
  });
  const onBack = jest.fn();
  const screen = await renderWithI18n(<FlowBackProvider><Screen onBack={onBack}>{null}</Screen></FlowBackProvider>);
  expect(hardwareBack()).toBe(true);
  expect(onBack).toHaveBeenCalledTimes(1);
  await screen.rerender(<FlowBackProvider><Screen>{null}</Screen></FlowBackProvider>);
  expect(hardwareBack()).toBe(true);
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('screen-back')).toBeNull();
  spy.mockRestore();
});
