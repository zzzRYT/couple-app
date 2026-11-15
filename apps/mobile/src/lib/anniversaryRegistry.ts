type PresetRow = { id: string; month: number; day: number; builtIn: boolean; region: 'kr' | 'jp' | null; ko: string };
/** Mirrors public.anniversary_preset. `builtIn` identifies built-in days; the rest are offered on the add screen. `ko` is the stored title. */
export const ANNIVERSARY_PRESETS = [
  { id: 'diary', month: 1, day: 14, builtIn: false, region: 'kr', ko: '다이어리데이' },
  { id: 'valentine', month: 2, day: 14, builtIn: true, region: null, ko: '발렌타인데이' },
  { id: 'samgyeopsal', month: 3, day: 3, builtIn: false, region: 'kr', ko: '삼겹살데이' },
  { id: 'white', month: 3, day: 14, builtIn: true, region: null, ko: '화이트데이' },
  { id: 'rose', month: 5, day: 14, builtIn: true, region: 'kr', ko: '로즈데이' },
  { id: 'kiss', month: 6, day: 14, builtIn: true, region: 'kr', ko: '키스데이' },
  { id: 'silver', month: 7, day: 14, builtIn: false, region: 'kr', ko: '실버데이' },
  { id: 'wine', month: 10, day: 14, builtIn: false, region: 'kr', ko: '와인데이' },
  { id: 'movie', month: 11, day: 14, builtIn: false, region: 'kr', ko: '무비데이' },
  { id: 'hug', month: 12, day: 14, builtIn: true, region: 'kr', ko: '허그데이' },
  { id: 'xmasEve', month: 12, day: 24, builtIn: false, region: null, ko: '크리스마스 이브' },
] as const satisfies readonly PresetRow[];
export type AnniversaryPreset = (typeof ANNIVERSARY_PRESETS)[number];
export type PresetId = AnniversaryPreset['id'];
