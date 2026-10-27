import { fireEvent } from '@testing-library/react-native';
import { renderWithI18n } from '../../../test/render';
import { snapshotFixture } from '../../../test/fixtures';
import { panelClient } from '../../../test/promptClient';
import { ConsentScreen } from '../ConsentScreen';
import { PromptPanel } from '../../prompt/PromptPanel';

it('explains the processing with the legal placeholder and records consent', async () => {
  const setConsent = jest.fn().mockResolvedValue({ state: 'granted', bothGranted: false });
  const onDone = jest.fn();
  const screen = await renderWithI18n(<ConsentScreen myState="not_given" setConsent={setConsent} onDone={onDone} />);
  expect(screen.getByText(screen.t('consent.provider.keep'))).toBeTruthy();
  expect(screen.t('consent.provider.keep')).toContain('[법무 확인 후 입력]');
  expect(screen.getByText(screen.t('consent.status.off'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: screen.t('consent.agree') }));
  expect(setConsent).toHaveBeenCalledWith('granted');
  expect(onDone).toHaveBeenCalled();
});

it('keeps prompt submission disabled before consent', async () => {
  const screen = await renderWithI18n(<PromptPanel client={panelClient()} snapshot={snapshotFixture({ consent: 'not_given' })} online onOpenConsent={jest.fn()} />);
  expect(screen.getByRole('button', { name: screen.t('a11y.send') }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByRole('button', { name: screen.t('prompt.start') }).props.accessibilityState.disabled).toBe(true);
});

it('withdraws after confirmation and reports the discarded unapplied preview', async () => {
  const setConsent = jest.fn().mockResolvedValue({ state: 'revoked', bothGranted: false });
  const screen = await renderWithI18n(<ConsentScreen myState="granted" hasUnappliedPreview setConsent={setConsent} onDone={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: screen.t('consent.withdraw') }));
  expect(screen.getByText(screen.t('consent.withdraw.body'))).toBeTruthy();
  expect(setConsent).not.toHaveBeenCalled();
  await fireEvent.press(screen.getAllByRole('button', { name: screen.t('consent.withdraw') }).at(-1)!);
  expect(setConsent).toHaveBeenCalledWith('revoked');
  expect(await screen.findByText(screen.t('consent.withdraw.done'))).toBeTruthy();
  expect(screen.getByText(screen.t('preview.cancel.toast'))).toBeTruthy();
  expect(screen.getByText(screen.t('consent.status.off'))).toBeTruthy();
});
