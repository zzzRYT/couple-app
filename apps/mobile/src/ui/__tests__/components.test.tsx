import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { safeMetrics } from '../../test/render';
import { Button, TextField, Banner, Chip, Toast, Skeleton, Dialog, BottomSheet, ListRow, OccupancyChip } from '../components';
it('exposes labelled controls', async () => {
  const onPress = jest.fn();
  const screen = await render(<><Button label="Continue" onPress={onPress} /><TextField label="Email" /><Banner text="Offline" kind="offline" /></>);
  const button = screen.getByRole('button', { name: 'Continue' });
  await fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Email')).toBeTruthy();
  expect(screen.getByRole('alert')).toBeTruthy();
});

it('draws the button face inside a 48pt touch area: 36 tall, 32 compact, radius 8, 14px label', async () => {
  const noop = () => {};
  const screen = await render(<><Button label="Go" onPress={noop} /><Button compact label="Small" onPress={noop} /><Button variant="ghost" label="Skip" onPress={noop} /></>);
  for (const [name, height] of [['Go', 36], ['Small', 32], ['Skip', 36]] as const) {
    const touch = StyleSheet.flatten(screen.getByRole('button', { name }).props.style);
    expect(touch.minHeight).toBeGreaterThanOrEqual(48);
    expect(touch.minWidth).toBeGreaterThanOrEqual(48);
    const label = screen.getByText(name);
    const text = StyleSheet.flatten(label.props.style);
    expect(text).toMatchObject({ fontSize: 14, lineHeight: 20 });
    const face = StyleSheet.flatten(label.parent!.props.style);
    expect(face).toMatchObject({ minHeight: height, borderRadius: 8 });
    expect(2 * (Number(face.paddingVertical) + Number(face.borderWidth ?? 0)) + Number(text.lineHeight)).toBe(height);
  }
});

it('renders each shared primitive and names its actions', async () => {
  const noop = () => {};
  const screen = await render(<SafeAreaProvider initialMetrics={safeMetrics}><Chip label="Status" /><OccupancyChip label="Owner" /><Toast text="Saved" /><Skeleton label="Loading" /><Dialog visible title="Confirm" onClose={noop}><Button label="OK" onPress={noop} /></Dialog><BottomSheet visible title="Details" onClose={noop}><ListRow label="Open" onPress={noop} /></BottomSheet></SafeAreaProvider>);
  expect(screen.getByLabelText('Status')).toBeTruthy();
  expect(screen.getByLabelText('Owner')).toBeTruthy();
  expect(screen.getByLabelText('Loading')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Open' })).toBeTruthy();
  expect(screen.toJSON()).toMatchSnapshot();
});
