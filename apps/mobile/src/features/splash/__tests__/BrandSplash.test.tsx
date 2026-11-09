import { act, fireEvent, render } from '@testing-library/react-native';
import { AppState, StyleSheet } from 'react-native';
import { BrandSplash, SPLASH_EXIT_MS, SPLASH_EXIT_REDUCED_MS, SPLASH_MIN_MS } from '../BrandSplash';
import { RESUME_SPLASH_AFTER_MS, resumeShowsSplash, useResumeSplash } from '../useResumeSplash';
import { SPLASH } from '../../../config/splash';

jest.mock('../../../ui/motion', () => ({ useReducedMotion: () => mockReduced, useLoopActive: () => true }));
let mockReduced = false;
beforeEach(() => { mockReduced = false; jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });
const style = (node: { props: Record<string, unknown> }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('V0-F13-AC-06 V0-12 splash', () => {
  it('draws Aroomi at the launch screen size on the ground of its scheme and reports the first paint', async () => {
    const onDrawn = jest.fn();
    const screen = await render(<BrandSplash holding scheme="dark" label="Loading" onDrawn={onDrawn} />);
    const image = screen.getByTestId('brand-splash-image');
    expect(style(image)).toMatchObject({ width: SPLASH.imageWidth, height: SPLASH.imageWidth });
    expect(style(screen.getByTestId('brand-splash'))).toMatchObject({ backgroundColor: SPLASH.background.dark });
    expect(screen.getByLabelText('Loading')).toBeTruthy();
    await fireEvent(image, 'load');
    expect(onDrawn).toHaveBeenCalledTimes(1);
  });

  it('stays while the app is not ready, then for the rest of the minimum, then fades out', async () => {
    const screen = await render(<BrandSplash holding scheme="light" />);
    await advance(5000);
    expect(screen.getByTestId('brand-splash')).toBeTruthy();
    await screen.rerender(<BrandSplash holding={false} scheme="light" />);
    expect(screen.getByTestId('brand-splash').props.pointerEvents).toBe('auto');
    await advance(1);
    expect(screen.getByTestId('brand-splash').props.pointerEvents).toBe('none');
    await advance(SPLASH_EXIT_MS);
    expect(screen.queryByTestId('brand-splash')).toBeNull();
  });

  it('keeps a quick start on screen for the minimum and never longer', async () => {
    const screen = await render(<BrandSplash holding scheme="light" />);
    await advance(200);
    await screen.rerender(<BrandSplash holding={false} scheme="light" />);
    await advance(SPLASH_MIN_MS - 201);
    expect(screen.getByTestId('brand-splash').props.pointerEvents).toBe('auto');
    await advance(1);
    expect(screen.getByTestId('brand-splash').props.pointerEvents).toBe('none');
    await advance(SPLASH_EXIT_MS);
    expect(screen.queryByTestId('brand-splash')).toBeNull();
  });

  it('shows again for a warm start and keeps the scheme it appeared with', async () => {
    const screen = await render(<BrandSplash holding={false} scheme="light" />);
    await advance(SPLASH_MIN_MS);
    await advance(SPLASH_EXIT_MS);
    expect(screen.queryByTestId('brand-splash')).toBeNull();
    await screen.rerender(<BrandSplash holding={false} replay={1} scheme="dark" />);
    expect(style(screen.getByTestId('brand-splash'))).toMatchObject({ backgroundColor: SPLASH.background.dark });
    await screen.rerender(<BrandSplash holding={false} replay={1} scheme="light" />);
    expect(style(screen.getByTestId('brand-splash'))).toMatchObject({ backgroundColor: SPLASH.background.dark });
    await advance(SPLASH_MIN_MS);
    await advance(SPLASH_EXIT_MS);
    expect(screen.queryByTestId('brand-splash')).toBeNull();
  });

  it('fades out faster with Reduce Motion', async () => {
    mockReduced = true;
    const screen = await render(<BrandSplash holding scheme="light" />);
    await screen.rerender(<BrandSplash holding={false} scheme="light" />);
    await advance(SPLASH_MIN_MS);
    expect(screen.getByTestId('brand-splash').props.pointerEvents).toBe('none');
    await advance(SPLASH_EXIT_REDUCED_MS);
    expect(screen.queryByTestId('brand-splash')).toBeNull();
  });
});

describe('V0-F13-AC-07 V0-12 warm start', () => {
  it('shows the splash only after 30 seconds or more in the background', () => {
    expect(resumeShowsSplash(null, 100_000)).toBe(false);
    expect(resumeShowsSplash(0, RESUME_SPLASH_AFTER_MS - 1)).toBe(false);
    expect(resumeShowsSplash(0, RESUME_SPLASH_AFTER_MS)).toBe(true);
  });

  it('counts long returns from the background and ignores short trips and inactive spells', async () => {
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => { listeners.push(listener as (state: string) => void); return { remove: jest.fn() }; });
    let now = 0;
    const seen: number[] = [];
    function Probe() { seen.push(useResumeSplash(RESUME_SPLASH_AFTER_MS, () => now)); return null; }
    await render(<Probe />);
    const emit = (state: string, at: number) => act(() => { now = at; for (const listener of listeners) listener(state); });
    await emit('inactive', 1_000);
    await emit('active', 60_000);
    await emit('background', 70_000);
    await emit('active', 80_000);
    expect(seen.at(-1)).toBe(0);
    await emit('background', 100_000);
    await emit('inactive', 129_000);
    await emit('active', 130_000);
    expect(seen.at(-1)).toBe(1);
  });
});
