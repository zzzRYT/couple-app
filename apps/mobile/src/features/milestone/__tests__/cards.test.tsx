import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import type { MilestoneCelebration } from '../../../lib/client';
import { MilestoneCard } from '../MilestoneCard';
import { MilestoneBubble } from '../MilestoneBubble';

const milestone: MilestoneCelebration = { id: 'event-1', key: 'd100', kind: 'day', days: 100, anniversaryN: null, milestoneDate: '2026-10-27', daysAgo: 0, seenByMe: false, presetAvailable: true, presetId: 'milestone-day' };

it('shows a translated home card and closes it for the member', async () => {
  const onClose = jest.fn(), onSuggest = jest.fn();
  const screen = await renderWithI18n(<MilestoneCard celebration={milestone} offline={false} onClose={onClose} onSuggest={onSuggest} />);
  expect(screen.getByText(screen.t('milestone.title.day', { n: 100 }))).toBeTruthy();
  await fireEvent.press(screen.getByTestId('milestone-close'));
  expect(onClose).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('milestone.action.suggest') }));
  expect(onSuggest).toHaveBeenCalledTimes(1);
});

it('keeps the room preset entrance after the celebration bubble is acknowledged', async () => {
  const screen = await renderWithI18n(<MilestoneBubble celebration={null} preset={{ ...milestone, seenByMe: true }} onClose={jest.fn()} onSuggest={jest.fn()} disabled={false} />);
  expect(screen.queryByTestId('milestone-bubble')).toBeNull();
  expect(screen.getByTestId('milestone-preset-entry')).toBeTruthy();
});

it('keeps the last verified card closeable offline but disables its suggestion', async () => {
  const onClose = jest.fn(), onSuggest = jest.fn();
  const screen = await renderWithI18n(<MilestoneCard celebration={milestone} offline onClose={onClose} onSuggest={onSuggest} />);
  expect(screen.getByTestId('milestone-card')).toBeTruthy();
  expect(screen.queryByRole('button', { name: screen.t('milestone.action.suggest') })).toBeNull();
  await fireEvent.press(screen.getByTestId('milestone-close'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
