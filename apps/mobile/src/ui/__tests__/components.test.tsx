import { fireEvent, render } from '@testing-library/react-native';
import { Button, TextField, Banner, Chip, Toast, Skeleton, Dialog, BottomSheet, ListRow, OccupancyChip } from '../components';
it('exposes labelled controls with minimum touch sizes', async () => {
  const onPress = jest.fn();
  const screen = await render(<><Button label="Continue" onPress={onPress} /><TextField label="Email" /><Banner text="Offline" kind="offline" /></>);
  const button = screen.getByRole('button', { name: 'Continue' });
  expect(button.props.style.minHeight).toBeGreaterThanOrEqual(44);
  await fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Email')).toBeTruthy();
  expect(screen.getByRole('alert')).toBeTruthy();
});

it('renders each shared primitive and names its actions', async () => {
  const noop = () => {};
  const screen = await render(<><Chip label="Status" /><OccupancyChip label="Owner" /><Toast text="Saved" /><Skeleton label="Loading" /><Dialog visible title="Confirm" onClose={noop}><Button label="OK" onPress={noop} /></Dialog><BottomSheet visible title="Details" onClose={noop}><ListRow label="Open" onPress={noop} /></BottomSheet></>);
  expect(screen.getByLabelText('Status')).toBeTruthy();
  expect(screen.getByLabelText('Owner')).toBeTruthy();
  expect(screen.getByLabelText('Loading')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Open' })).toBeTruthy();
  expect(screen.toJSON()).toMatchSnapshot();
});
