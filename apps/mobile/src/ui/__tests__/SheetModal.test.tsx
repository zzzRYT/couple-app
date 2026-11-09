import { StyleSheet, Text } from 'react-native';
import { act, fireEvent, within } from '@testing-library/react-native';
import { renderWithI18n, resetI18nCache } from '../../test/render';
import { BottomSheet } from '../components';
import { SheetModal } from '../SheetModal';
import { tokens } from '../../theme/tokens';

jest.mock('../motion', () => ({ useReducedMotion: () => mockReduced, useLoopActive: () => true }));
let mockReduced = false;
beforeEach(() => { resetI18nCache(); mockReduced = false; jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });
const sheet = (visible: boolean) => <BottomSheet visible={visible} title="t" onClose={() => {}}><Text>x</Text></BottomSheet>;

describe('bottom sheet motion', () => {
  it('keeps the scrim outside the sliding panel and never animates the modal itself', async () => {
    const screen = await renderWithI18n(sheet(true));
    const panel = screen.getByTestId('sheet-panel');
    expect(within(panel).queryByTestId('sheet-scrim')).toBeNull();
    expect(screen.getByTestId('sheet-scrim')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).toContain('"animationType":"none"');
    const style = StyleSheet.flatten(panel.props.style);
    expect(style.transform).toEqual([{ translateY: expect.any(Number) }]);
    expect(StyleSheet.flatten(screen.getByTestId('sheet-scrim').props.style)).toMatchObject({ opacity: expect.any(Number) });
    expect(StyleSheet.flatten(screen.getByTestId('sheet-scrim').props.style).transform).toBeUndefined();
  });

  it('fades without sliding under Reduce Motion', async () => {
    mockReduced = true;
    const screen = await renderWithI18n(sheet(true));
    const style = StyleSheet.flatten(screen.getByTestId('sheet-panel').props.style);
    expect(style.transform).toBeUndefined();
    expect(style).toMatchObject({ opacity: expect.any(Number) });
  });

  it('stays mounted for the transition after closing, then leaves', async () => {
    const screen = await renderWithI18n(sheet(true));
    await screen.rerender(sheet(false));
    expect(screen.queryByTestId('sheet-panel')).toBeTruthy();
    await act(async () => { jest.advanceTimersByTime(tokens.motion.transitionMs); });
    expect(screen.queryByTestId('sheet-panel')).toBeNull();
    expect(screen.queryByTestId('sheet-scrim')).toBeNull();
  });

  it('renders nothing while it has never been opened', async () => {
    const screen = await renderWithI18n(<SheetModal visible={false} onClose={() => {}} dismissLabel="close"><Text>x</Text></SheetModal>);
    await act(async () => { jest.advanceTimersByTime(tokens.motion.transitionMs); });
    expect(screen.queryByTestId('sheet-panel')).toBeNull();
  });

  it('closes when the area outside the panel is tapped', async () => {
    const onClose = jest.fn();
    const screen = await renderWithI18n(<SheetModal visible onClose={onClose} dismissLabel="close"><Text>x</Text></SheetModal>);
    await fireEvent.press(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
