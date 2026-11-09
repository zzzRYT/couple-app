import { StyleSheet, Text } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithI18n, resetI18nCache } from '../../test/render';
import { Dialog, Skeleton } from '../components';
import { AnniversaryDateField } from '../../features/anniversaries/AnniversaryDateField';
import { CelebrationSparkle } from '../../features/milestone/CelebrationSparkle';
import { CelebrationCard } from '../../features/home/CelebrationCard';

jest.mock('../motion', () => ({ useReducedMotion: () => mockReduced, useLoopActive: () => true }));
const celebration = { id: 'c', key: 'd500', kind: 'day', days: 500, milestoneDate: '2026-11-02', daysAgo: 0, seenByMe: false, presetAvailable: false, presetId: 'milestone-day' } as never;
let mockReduced = true;
beforeEach(() => { resetI18nCache(); mockReduced = true; });
type Json = { type: string; props: Record<string, unknown>; children?: (Json | string)[] | null };
const modal = (node: Json | Json[] | null): Json | undefined => [node].flat().flatMap((n) => n ? [n] : []).map((n) => n.type === 'Modal' ? n : (n.children ?? []).map((c) => typeof c === 'string' ? undefined : modal(c)).find(Boolean)).find(Boolean);
const animation = (screen: Awaited<ReturnType<typeof renderWithI18n>>) => modal(screen.toJSON() as Json | null)?.props.animationType;
const flush = () => act(async () => { await Promise.resolve(); });

describe('V0-NF-01 Reduce Motion', () => {
  it('presents the dialog without a transition and with a fade otherwise', async () => {
    const element = <Dialog visible title="t" onClose={() => {}}><Text>x</Text></Dialog>;
    const reduced = await renderWithI18n(element); await flush();
    expect(animation(reduced)).toBe('none');
    await reduced.unmount(); mockReduced = false;
    const regular = await renderWithI18n(element); await flush();
    expect(animation(regular)).toBe('fade');
    await regular.unmount();
  });
  it('opens the date wheel sheet without sliding', async () => {
    const screen = await renderWithI18n(<AnniversaryDateField value={{ year: 2025, month: 6, day: 29 }} onChange={() => {}} maxYear={2026} />); await flush();
    await fireEvent.press(screen.getByLabelText(screen.t('a11y.dateField')));
    expect(StyleSheet.flatten(screen.getByTestId('sheet-panel').props.style).transform).toBeUndefined();
  });
  it('holds the celebration card mascot on its still pose and stops the sparkle pulse', async () => {
    const card = await renderWithI18n(<CelebrationCard celebration={celebration} startDate="2025-06-29" disabled={false} onSeen={() => {}} />);
    expect(card.queryByTestId('milestone-sparkle')).toBeNull();
    expect(card.getByLabelText(card.t('mascot.alt.cheer')).props.style).toEqual({ width: 90, height: 90 });
    const sparkle = await renderWithI18n(<CelebrationSparkle />); await flush();
    expect(JSON.stringify(sparkle.toJSON())).toContain('"scale":1}');
  });
  it('shows the loading placeholder as a still shape', async () => {
    const screen = await renderWithI18n(<Skeleton label="loading" height={40} />);
    expect(JSON.stringify(screen.toJSON())).not.toContain('opacity');
  });
});
