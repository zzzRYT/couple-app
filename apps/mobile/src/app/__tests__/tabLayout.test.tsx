import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactNode } from 'react';
import { renderWithI18n } from '../../test/render';
import TabLayout from '../(tabs)/_layout';

type Asset = { testUri: string };
type IconProps = { src?: { default: Asset; selected: Asset }; sf?: unknown; renderingMode?: string; drawable?: string };
const mockIcons: IconProps[] = [];
jest.mock('expo-router', () => ({ usePathname: () => '/home' }));
jest.mock('expo-router/native-tabs', () => {
  const NativeTabs = ({ children }: { children: ReactNode }) => children;
  NativeTabs.Trigger = Object.assign(({ children }: { children: ReactNode }) => children, {
    Label: () => null,
    Icon: (props: IconProps) => { mockIcons.push(props); return null; },
  });
  return { NativeTabs };
});

it('V0-F03-AC-05 draws the board icons (house, calendar with a heart, sun-gear) as tinted template images, heavier when selected', async () => {
  await renderWithI18n(<TabLayout />);
  const file = (asset: Asset) => asset.testUri.split('/').at(-1);
  expect(mockIcons.map((icon) => [file(icon.src!.default), file(icon.src!.selected), icon.renderingMode, icon.drawable, icon.sf])).toEqual([
    ['home.png', 'home-selected.png', 'template', 'home', undefined],
    ['anniversaries.png', 'anniversaries-selected.png', 'template', 'calendar', undefined],
    ['settings.png', 'settings-selected.png', 'template', 'settings', undefined],
  ]);
});

it('V0-F03-AC-05 ships every tab glyph at the 25 pt tab size for 1x, 2x and 3x screens', () => {
  const width = (name: string) => readFileSync(join(__dirname, '../../../assets/tabs', name)).readUInt32BE(16);
  for (const glyph of ['home', 'home-selected', 'anniversaries', 'anniversaries-selected', 'settings', 'settings-selected']) {
    expect([width(`${glyph}.png`), width(`${glyph}@2x.png`), width(`${glyph}@3x.png`)]).toEqual([25, 50, 75]);
  }
});
